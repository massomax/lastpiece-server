import mongoose, { Schema, Document } from "mongoose";

// Интерфейс Mongoose-документа уведомления
export interface INotification extends Document {
  sellerId: mongoose.Types.ObjectId;
  type: "registration" | "approval" | "rejection";
  createdAt: Date;
  readAt: Date;
  data: Record<string, any>;
}

const NotificationSchema: Schema<INotification> = new Schema({
  // Ссылка на продавца, на которого создано уведомление
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: "Seller",
    required: true,
  },
  // Тип события уведомления
  type: {
    type: String,
    enum: ["registration", "approval", "rejection"],
    required: true,
  },
  // Время создания уведомления (при создании передаём moment().tz('Europe/Moscow').toDate())
  createdAt: {
    type: Date,
    required: true,
  },
  readAt: { type: Date, default: null },
  // Произвольные дополнительные данные по необходимости
  data: {
    type: Schema.Types.Mixed,
    default: {},
  },
});

NotificationSchema.index({ sellerId: 1, createdAt: -1 });

// Экспорт модели
const NotificationModel = mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
export default NotificationModel;
