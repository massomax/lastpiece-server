import { Router } from "express";
import { body } from "express-validator";
import validateRequest from "../../middlewares/validateRequest";
import {
  registerSeller,
  loginSeller,
  refreshSeller,
  logoutSeller,
} from "./sellerController";
import authenticateJwt from "../../middlewares/authenticateJwt";

const router = Router();

router.post(
  "/register",
  [
    body("companyName").notEmpty().withMessage("companyName is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be ≥8 chars"),
    body("phone").notEmpty().withMessage("phone is required"),
    body("website").optional().isURL().withMessage("website must be a URL"),
    body("description").notEmpty().withMessage("description is required"),
  ],
  validateRequest,
  registerSeller
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  loginSeller
);

router.post("/refresh", refreshSeller);
router.post("/logout", authenticateJwt, logoutSeller);

export default router;
