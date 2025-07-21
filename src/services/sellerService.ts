import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import SellerModel, { SellerDoc } from "../models/sellerModel";
import config from "../config";

interface JwtPair {
  accessToken: string;
  refreshToken: string;
}

export const cookieOpts = () => ({
  httpOnly: config.cookie.httpOnly,
  secure: config.cookie.secure,
  domain: config.cookie.domain,
  sameSite: config.cookie.sameSite,
  maxAge: msFromDuration(config.jwt.refreshExpires),
});

// основной метод регистрации
export const registerSeller = async (payload: {
  companyName: string;
  email: string;
  password: string;
  phone: string;
  website?: string;
  description: string;
  address?: string;
  logoUrl?: string;
  tags?: string[];
}): Promise<{
  accessToken: { accessToken: string; refreshToken: string };
}> => {
  // 1. Проверяем уникальность email
  const exists = await SellerModel.findOne({ email: payload.email });
  if (exists)
    throw Object.assign(new Error("Email already in use"), { status: 400 });

  // 2. Хешируем пароль
  const hashed = await bcrypt.hash(payload.password, 12);

  // 3. Создаём запись
  const seller = await SellerModel.create({
    ...payload,
    password: hashed,
  });

  // 4. Генерируем токены
  const jwtPayload = { sub: seller.id, role: seller.role };
  const accessToken = jwt.sign(jwtPayload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpires,
  });
  const refreshToken = jwt.sign(jwtPayload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpires,
  });

  return { accessToken: { accessToken, refreshToken } };
};

export const loginSeller = async (
  email: string,
  password: string
): Promise<JwtPair> => {
  // 1. Найти по email
  const seller = await SellerModel.findOne({ email }).exec();
  if (!seller) {
    const err = new Error("Invalid email or password");
    (err as any).status = 401;
    throw err;
  }

  // 2. Проверить пароль
  const match = await bcrypt.compare(password, seller.password);
  if (!match) {
    const err = new Error("Invalid email or password");
    (err as any).status = 401;
    throw err;
  }

  // 3. Сгенерировать JWT
  const jwtPayload = { sub: seller.id, role: seller.role };
  const accessToken = jwt.sign(jwtPayload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpires,
  });
  const refreshToken = jwt.sign(jwtPayload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpires,
  });

  return { accessToken, refreshToken };
};

export const refreshTokens = async (
  token: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  if (!token) {
    const err = new Error("No refresh token provided");
    (err as any).status = 401;
    throw err;
  }

  let payload: any;
  try {
    payload = jwt.verify(token, config.jwt.refreshSecret) as {
      sub: string;
      role: string;
    };
  } catch {
    const err = new Error("Invalid or expired refresh token");
    (err as any).status = 401;
    throw err;
  }

  // Опционально: проверить, что пользователь всё ещё существует
  const seller = await SellerModel.findById(payload.sub).exec();
  if (!seller) {
    const err = new Error("Seller not found");
    (err as any).status = 401;
    throw err;
  }

  // Генерируем новую пару токенов
  const jwtPayload = { sub: seller.id, role: seller.role };
  const newAccessToken = jwt.sign(jwtPayload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpires,
  });
  const newRefreshToken = jwt.sign(jwtPayload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpires,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

// Уже был helper для конвертации строковых duration в ms
export const msFromDuration = (dur: string): number => {
  const match = dur.match(/(\d+)([smhd])/);
  if (!match) return 0;
  const [, amount, unit] = match;
  const map: any = { s: 1e3, m: 6e4, h: 36e5, d: 864e5 };
  return parseInt(amount, 10) * map[unit];
};

// экспорт конфигурации для контроллера
export { config };
