import { Router } from "express";
import authenticateJwt from "../../middlewares/authenticateJwt";
import { authorize } from "../../middlewares/authorize";
import * as ctrl from "./notificationController";
import { param, query, body } from "express-validator";
import validateRequest from "../../middlewares/validateRequest";

const router = Router();

// Продавец: получить свои уведомления
router.get(
  "/",
  authenticateJwt,
  authorize("seller","admin"), // админ тоже может смотреть (см. контроллер)
  [
    query("type").optional().isIn(["registration","approval","rejection"]),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("page").optional().isInt({ min: 1 }),
  ],
  validateRequest,
  ctrl.listMyNotifications
);

// Продавец: отметить как прочитанное
router.patch(
  "/:id/read",
  authenticateJwt,
  authorize("seller","admin"),
  [param("id").isMongoId()],
  validateRequest,
  ctrl.markAsRead
);

// Админ: список уведомлений по любому продавцу (опц.)
router.get(
  "/admin",
  authenticateJwt,
  authorize("admin"),
  [
    query("sellerId").optional().isMongoId(),
    query("type").optional().isIn(["registration","approval","rejection"]),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("page").optional().isInt({ min: 1 }),
  ],
  validateRequest,
  ctrl.listAnyNotifications
);

export default router;
