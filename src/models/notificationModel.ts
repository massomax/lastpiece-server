// src/models/notificationModel.ts

import { Schema, model, Document, Types } from "mongoose";
import moment from "moment-timezone";

// Типы уведомления точно повторяют статус продавца
export type NotificationType = "pending" | "active" | "suspended";

export interface NotificationDoc extends Document {
  sellerId: Types.ObjectId; // ссылка на Seller
  type: NotificationType; // pending, active или suspended
  data: Record<string, any>; // любые доп. данные (например, companyName, email)
  createdAt: Date; // московское время
}

const notificationSchema = new Schema<NotificationDoc>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    type: {
      type: String,
      enum: ["pending", "active", "suspended"],
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    // Только createdAt и с учётом Europe/Moscow
    timestamps: {
      createdAt: true,
      updatedAt: false,
      currentTime: () => moment().tz("Europe/Moscow").toDate(),
    },
  }
);

export default model<NotificationDoc>("Notification", notificationSchema);
