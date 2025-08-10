import SellerModel, { SellerDoc } from "../models/sellerModel";
import NotificationModel, { INotification } from "../models/notificationModel";
import moment from "moment-timezone";

/**
 * Сервис для админ-операций с продавцами
 */

/**
 * Возвращает список продавцов со статусом 'pending'
 */
export async function listPendingSellers(): Promise<SellerDoc[]> {
  return SellerModel.find({ status: "pending" }).exec();
}

/**
 * Одобряет продавца (меняет статус на 'active') и создаёт уведомление
 * @param id - идентификатор продавца
 */
export async function approveSeller(id: string): Promise<void> {
  const seller = await SellerModel.findByIdAndUpdate(
    id,
    { status: "active" },
    { new: true }
  ).exec();
  if (!seller) {
    const err = new Error("Seller not found");
    (err as any).status = 404;
    throw err;
  }

  await NotificationModel.create({
    sellerId: seller._id,
    type: "approval",
    data: { sellerId: seller._id.toString() },
    createdAt: moment().tz("Europe/Moscow").toDate(),
  });
}

/**
 * Отклоняет продавца (меняет статус на 'suspended') и создаёт уведомление
 * @param id - идентификатор продавца
 */
export async function rejectSeller(id: string): Promise<void> {
  const seller = await SellerModel.findByIdAndUpdate(
    id,
    { status: "suspended" },
    { new: true }
  ).exec();
  if (!seller) {
    const err = new Error("Seller not found");
    (err as any).status = 404;
    throw err;
  }

  await NotificationModel.create({
    sellerId: seller._id,
    type: "rejection",
    data: { sellerId: seller._id.toString() },
    createdAt: moment().tz("Europe/Moscow").toDate(),
  });
}
