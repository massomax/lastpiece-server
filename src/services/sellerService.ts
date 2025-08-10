import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import moment from "moment-timezone";

import SellerModel, { SellerDoc } from "../models/sellerModel";
import NotificationModel from "../models/notificationModel";
import config from "../config";

/**
 * Пара токенов
 */
export interface JwtPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Опции для установки cookie с refresh токеном
 */
export const cookieOpts = () => ({
  httpOnly: config.cookie.httpOnly,
  secure: config.cookie.secure,
  domain: config.cookie.domain,
  sameSite: config.cookie.sameSite,
  maxAge: msFromDuration(config.jwt.refreshExpires),
});

/**
 * Конвертация строковой длительности (e.g. "7d", "15m") в миллисекунды
 */
export const msFromDuration = (dur: string): number => {
  const match = dur.match(/(\d+)([smhd])/);
  if (!match) return 0;
  const [, amount, unit] = match;
  const map: Record<string, number> = { s: 1e3, m: 6e4, h: 36e5, d: 864e5 };
  return parseInt(amount, 10) * map[unit as keyof typeof map];
};

/**
 * Регистрирует нового продавца, создаёт уведомление о регистрации и возвращает пару JWT
 */
export async function registerSeller(
  dto: Omit<SellerDoc, "status" | "role" | "_id"> & { password: string }
): Promise<JwtPair> {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

  const seller = new SellerModel({
    ...dto,
    password: hashedPassword,
    status: "pending",
  });
  await seller.save();

  await NotificationModel.create({
    sellerId: seller._id,
    type: "registration",
    data: {
      companyName: seller.companyName,
      email: seller.email,
    },
    createdAt: moment().tz("Europe/Moscow").toDate(),
  });

  const payload = { sub: seller._id.toString(), role: seller.role };
  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpires,
  });
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpires,
  });

  return { accessToken, refreshToken };
}

/**
 * Аутентифицирует продавца по email/password и возвращает пару JWT
 */
export async function loginSeller(
  dto: Pick<SellerDoc, "email" | "password">
): Promise<JwtPair> {
  const seller = await SellerModel.findOne({ email: dto.email });
  if (!seller) {
    const err = new Error("Invalid email or password");
    (err as any).status = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(dto.password, seller.password);
  if (!isMatch) {
    const err = new Error("Invalid email or password");
    (err as any).status = 401;
    throw err;
  }

  if (seller.status !== "active") {
    const err = new Error(
      seller.status === "pending"
        ? "Account pending approval"
        : "Account suspended"
    );
    (err as any).status = 403;
    throw err;
  }

  const payload = { sub: seller._id.toString(), role: seller.role };
  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpires,
  });
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpires,
  });

  return { accessToken, refreshToken };
}

/**
 * Обновляет пару JWT по refresh токену и возвращает новую пару
 */
export async function refreshTokens(currentToken: string): Promise<JwtPair> {
  let payload: any;
  try {
    payload = jwt.verify(currentToken, config.jwt.refreshSecret);
  } catch {
    const err = new Error("Invalid or expired refresh token");
    (err as any).status = 401;
    throw err;
  }

  const seller = await SellerModel.findById(payload.sub);
  if (!seller) {
    const err = new Error("Seller not found");
    (err as any).status = 404;
    throw err;
  }

  const newPayload = { sub: seller._id.toString(), role: seller.role };
  const accessToken = jwt.sign(newPayload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpires,
  });
  const refreshToken = jwt.sign(newPayload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpires,
  });

  return { accessToken, refreshToken };
}

export default {
  registerSeller,
  loginSeller,
  refreshTokens,
  cookieOpts,
  msFromDuration,
};
