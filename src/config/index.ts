import dotenv from "dotenv";
import type { StringValue } from "ms";
dotenv.config();

export default {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/LastPiece",
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "",
    // приоритет — значение из .env, приведённое к StringValue, иначе строка по умолчанию
    accessExpires: (process.env.JWT_ACCESS_EXPIRES_IN as StringValue) || "15m",
    refreshExpires: (process.env.JWT_REFRESH_EXPIRES_IN as StringValue) || "7d",
  },
  cookie: {
    domain: process.env.COOKIE_DOMAIN || "localhost",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "strict" as const,
  },
  cors: {
    // через запятую: https://app.dev,https://admin.dev
    origins: (process.env.CORS_ORIGINS || "http://localhost:5173")
      .split(",")
      .map((s) => s.trim()),
    credentials: true,
  },
  uploads: {
    imgurClientId: process.env.IMGUR_CLIENT_ID || "",
    maxFiles: parseInt(process.env.UPLOAD_MAX_FILES || "5", 10),
    maxFileSizeMB: parseInt(process.env.UPLOAD_MAX_MB || "5", 10),
    allowedMime: ["image/jpeg", "image/png", "image/webp"],
  },
  promo: {
    salt: process.env.PROMO_SALT || "default-salt",
  },
};
