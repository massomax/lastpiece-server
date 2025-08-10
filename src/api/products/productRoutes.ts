import { Router } from "express";
import { body, param, query } from "express-validator";
import validateRequest from "../../middlewares/validateRequest";
import authenticateJwt from "../../middlewares/authenticateJwt";
import { authorize } from "../../middlewares/authorize";
import * as ctrl from "./productController";

const router = Router();

// 0) Листы (витрина)
router.get(
  "/",
  [
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("cursor").optional().isString(),
  ],
  validateRequest,
  ctrl.listAll
);

router.get(
  "/by-seller/:sellerId",
  [
    param("sellerId").isMongoId(),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("cursor").optional().isString(),
  ],
  validateRequest,
  ctrl.listBySeller
);

router.get(
  "/by-category/:categorySlug",
  [
    param("categorySlug").isString().isLength({ min: 2 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("cursor").optional().isString(),
  ],
  validateRequest,
  ctrl.listByCategory
);

// 1) Создать (seller/admin)
router.post(
  "/",
  authenticateJwt,
  authorize("seller", "admin"),
  [
    body("title").isString().isLength({ min: 1 }),
    body("price").isInt({ min: 0 }), // цена в копейках/центах
    body("currency").optional().isIn(["RUB", "EUR", "USD"]),
    body("categoryId").isMongoId(),
    body("images").optional().isArray(),
    body("tags").optional().isArray(),

    // Админ может указать sellerId, селлер — нет
    body("sellerId").optional().isMongoId(),

    // Продвижение (необязательно)
    body("promotionLevel").optional().isIn(["none", "basic", "plus", "pro"]),
    body("promotionEndAt").optional({ nullable: true }).isISO8601(),
    body("isFeatured").optional().isBoolean(),
  ],
  validateRequest,
  ctrl.createProduct
);

// 2) Обновить
router.patch(
  "/:id",
  authenticateJwt,
  authorize("seller", "admin"),
  [param("id").isMongoId(), body("rotateShuffle").optional().isBoolean()],
  validateRequest,
  ctrl.updateProduct
);

// 3) Удалить (soft)
router.delete(
  "/:id",
  authenticateJwt,
  authorize("seller", "admin"),
  [param("id").isMongoId()],
  validateRequest,
  ctrl.deleteProduct
);

export default router;
