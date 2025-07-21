import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config";

export default function authenticateJwt(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 1. Получаем заголовок безопасно
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  // 2. Разбиваем на схему и токен
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ error: "Malformed token" });
    return;
  }

  try {
    // 3. Верифицируем токен
    const payload = jwt.verify(token, config.jwt.accessSecret) as {
      sub: string;
      role: "seller" | "admin" | "user";
    };

    // 4. Сохраняем данные в req.user
    req.user = { sub: payload.sub, role: payload.role };

    // 5. Продолжаем цепочку
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
}
