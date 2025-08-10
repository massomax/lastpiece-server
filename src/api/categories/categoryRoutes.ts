import { Router } from "express";
import { body, param, query } from "express-validator";
import validateRequest from "../../middlewares/validateRequest";
import authenticateJwt from "../../middlewares/authenticateJwt";
import { authorize } from "../../middlewares/authorize";
import {
  listCategories,
  proposeCategory,
  listPending,
  approveCategory,
  mergeCategory,
  archiveCategory,
} from "./categoryController";

const router = Router();

// Публичный список активных категорий
router.get(
  "/",
  [
    query("parentId").optional().isString(),
    query("q").optional().isString().isLength({ min: 2 }),
  ],
  validateRequest,
  listCategories
);

// Предложить новую категорию (seller/admin)
router.post(
  "/propose",
  authenticateJwt,
  authorize("seller", "admin"),
  [
    body("name").isString().isLength({ min: 3, max: 60 }),
    body("parentId").optional({ nullable: true }).isString(),
  ],
  validateRequest,
  proposeCategory
);

// Админские
router.get(
  "/pending",
  authenticateJwt,
  authorize("admin"),
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  listPending
);

router.patch(
  "/:id/approve",
  authenticateJwt,
  authorize("admin"),
  [param("id").isMongoId()],
  validateRequest,
  approveCategory
);

router.patch(
  "/:id/merge",
  authenticateJwt,
  authorize("admin"),
  [param("id").isMongoId(), body("targetId").isMongoId()],
  validateRequest,
  mergeCategory
);

router.patch(
  "/:id/archive",
  authenticateJwt,
  authorize("admin"),
  [param("id").isMongoId()],
  validateRequest,
  archiveCategory
);

export default router;
