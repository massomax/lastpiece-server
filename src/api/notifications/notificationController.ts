import { Request, Response, NextFunction } from "express";
import NotificationModel from "../../models/notificationModel";

export async function listMyNotifications(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { sub, role } = req.user!;
    const { type, page = 1, limit = 20 } = req.query as any;

    const filter: any = {};
    if (role === "seller") filter.sellerId = sub; // только свои
    if (type) filter.type = type;

    const docs = await NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .lean();

    res.json(docs);
  } catch (e) {
    next(e);
  }
}

export async function listAnyNotifications(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { sellerId, type, page = 1, limit = 20 } = req.query as any;
    const filter: any = {};
    if (sellerId) filter.sellerId = sellerId;
    if (type) filter.type = type;

    const docs = await NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .lean();

    res.json(docs);
  } catch (e) {
    next(e);
  }
}

export async function markAsRead(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const { sub, role } = req.user!;

    const notif = await NotificationModel.findById(id);
    if (!notif) return res.sendStatus(404);

    // продавец может пометить только своё
    if (role === "seller" && notif.sellerId.toString() !== sub) {
      return res.sendStatus(403);
    }

    if (!notif.readAt) {
      notif.readAt = new Date();
      await notif.save();
    }
    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
}
