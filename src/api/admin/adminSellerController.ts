import { Request, Response, NextFunction } from "express";
import * as adminService from "../../services/adminSellerService";

/**
 * GET /api/v1/admin/sellers/pending
 * Возвращает список продавцов в статусе 'pending'
 */
export async function listPendingSellers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const pending = await adminService.listPendingSellers();
    res.json(pending);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/admin/sellers/:id/approve
 * Одобряет продавца и создаёт уведомление типа 'approval'
 */
export async function approveSeller(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    await adminService.approveSeller(id);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/admin/sellers/:id/reject
 * Отклоняет продавца и создаёт уведомление типа 'rejection'
 */
export async function rejectSeller(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    await adminService.rejectSeller(id);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}
