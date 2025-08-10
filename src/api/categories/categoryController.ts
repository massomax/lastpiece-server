import { Request, Response, NextFunction } from "express";
import * as svc from "../../services/categoryService";

export async function listCategories(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parentId = (req.query.parentId as string) ?? undefined;
    const q = (req.query.q as string) ?? undefined;
    const items = await svc.listActive(parentId === "" ? null : parentId, q);
    res.json(
      items.map((c) => ({
        id: String(c._id),
        name: c.name,
        slug: c.slug,
        parentId: c.parentId ? String(c.parentId) : null,
      }))
    );
  } catch (e) {
    next(e);
  }
}

export async function proposeCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { name, parentId } = req.body as {
      name: string;
      parentId?: string | null;
    };
    const role = req.user?.role === "admin" ? "admin" : "seller";
    const cat = await svc.propose(name, parentId, role);
    res.status(201).json({
      id: String(cat._id),
      name: cat.name,
      slug: cat.slug,
      status: cat.status,
      parentId: cat.parentId ? String(cat.parentId) : null,
      createdBy: cat.createdBy,
    });
  } catch (e: any) {
    if (e.status === 409 && e.payload) {
      return res
        .status(409)
        .json({ error: "CategoryAlreadyExists", ...e.payload });
    }
    next(e);
  }
}

export async function listPending(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    const data = await svc.listPending(page, Math.min(limit, 100));
    res.json(data);
  } catch (e) {
    next(e);
  }
}

export async function approveCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await svc.approve(req.params.id);
    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
}

export async function mergeCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { targetId } = req.body as { targetId: string };
    await svc.merge(req.params.id, targetId);
    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
}

export async function archiveCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await svc.archive(req.params.id);
    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
}
