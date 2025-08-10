import { Router } from "express";
import multer from "multer";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import authenticateJwt from "../../middlewares/authenticateJwt";
import { authorize } from "../../middlewares/authorize";
import validateRequest from "../../middlewares/validateRequest";
import { body } from "express-validator";
import config from "../../config";
import * as ctrl from "./uploadController";

const router = Router();

// Индивидуальный лимитер на аплоады
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: config.uploads.maxFileSizeMB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!config.uploads.allowedMime.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type"));
    }
    cb(null, true);
  },
});

router.post(
  "/images",
  authenticateJwt,
  authorize("seller", "admin"),
  upload.array("images", config.uploads.maxFiles),
  [body("album").optional().isString()],
  validateRequest,
  ctrl.uploadImages
);

export default router;
