import { Request, Response, NextFunction } from "express";
import * as svc from "../../services/productService";

const parseLimit = (v: any) =>
  Math.min(Math.max(parseInt(String(v || 20), 10) || 20, 1), 100);

// READ — листы с курсором
export async function listAll(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = parseLimit(req.query.limit);
    const cursor = (req.query.cursor as string) || null;
    const data = await svc.listAll(limit, cursor);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

export async function listBySeller(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { sellerId } = req.params;
    const limit = parseLimit(req.query.limit);
    const cursor = (req.query.cursor as string) || null;
    const data = await svc.listBySeller(sellerId, limit, cursor);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

export async function listByCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { categorySlug } = req.params;
    const limit = parseLimit(req.query.limit);
    const cursor = (req.query.cursor as string) || null;
    const data = await svc.listByCategorySlug(categorySlug, limit, cursor);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

// CREATE
export async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const role = (req.user?.role === "admin" ? "admin" : "seller") as
      | "admin"
      | "seller";
    const userId = req.user?.sub!;
    const created = await svc.createProduct(req.body, role, userId);
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
}

// UPDATE
export async function updateProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const role = (req.user?.role === "admin" ? "admin" : "seller") as
      | "admin"
      | "seller";
    const userId = req.user?.sub!;
    const updated = await svc.updateProduct(
      req.params.id,
      req.body,
      role,
      userId
    );
    res.json(updated);
  } catch (e) {
    next(e);
  }
}

// DELETE (soft)
export async function deleteProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const role = (req.user?.role === "admin" ? "admin" : "seller") as
      | "admin"
      | "seller";
    const userId = req.user?.sub!;
    await svc.softDeleteProduct(req.params.id, role, userId);
    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
}
