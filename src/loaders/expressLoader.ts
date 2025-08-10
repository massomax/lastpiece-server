import { Application, Request, Response } from "express";
import express from "express";
import cookieParser from "cookie-parser";
import errorHandler from "../middlewares/errorHandler";
import helmet from "helmet";
import config from "../config";
import rateLimit from "express-rate-limit";
import { initSwagger } from "./swaggerLoader";
import cors from "cors";
// роуты
import sellerRoutes from "../api/seller/sellerRoutes";
import sellerAdminRoutes from "../api/admin/sellerAdminRoutes";
import notificationRoutes from "../api/notifications/notificationRoutes";
import categoryRoutes from "../api/categories/categoryRoutes";
import productRoutes from "../api/products/productRoutes";
import uploadRoutes, { uploadLimiter } from "../api/uploads/uploadRoutes";

export const initExpress = (app: Application): void => {
  app.use(express.json());
  app.use(cookieParser());

  app.use(helmet());
  // Swagger (UI по /docs, сырой YAML по /openapi.yaml)
  initSwagger(app);

  // CORS (для куки нужно credentials + конкретные origin’ы)
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true); // Postman/CLI
        if (config.cors.origins.includes("*")) return callback(null, true);
        if (config.cors.origins.includes(origin)) return callback(null, true);
        return callback(new Error("CORS blocked"), false);
      },
      credentials: config.cors.credentials,
    })
  );

  // Базовый лимитер на мутабельные запросы (перехватим в роутерах при желании)
  const basicMutatingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.get("/", (_req, res) => {
    res.json({ ok: true });
  });

  // v1 API
  app.use("/api/v1/sellers", sellerRoutes);
  app.use("/api/v1/admin/sellers", sellerAdminRoutes);
  app.use("/api/v1/notifications", notificationRoutes);
  app.use("/api/v1/categories", categoryRoutes);
  app.use("/api/v1/products", productRoutes);

  // Uploads: отдельный строгий лимитер
  app.use("/api/v1/uploads", uploadLimiter, uploadRoutes);

  app.use(errorHandler);
};
