import { Schema, model, Document, Types } from "mongoose";
import moment from "moment-timezone";

// Интерфейс документа
export interface SellerDoc extends Document {
  _id: Types.ObjectId;
  companyName: string;
  email: string;
  password: string;
  phone: string;
  website: string;
  description: string;

  role: "seller" | "admin" | "user";
  status: "pending" | "active" | "suspended";
  isEmailVerified: boolean;

  // опциональные
  address?: string;
  logoUrl?: string;
  tags?: string[];

  // таймстемпы
  createdAt: Date;
  updatedAt: Date;
}

const sellerSchema = new Schema<SellerDoc>(
  {
    companyName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    website: { type: String, required: true },
    description: { type: String, required: true },

    role: {
      type: String,
      enum: ["seller", "admin", "user"],
      default: "seller",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "suspended"],
      default: "pending",
      required: true,
    },
    isEmailVerified: { type: Boolean, default: false },

    address: { type: String },
    logoUrl: { type: String },
    tags: [{ type: String }],
  },
  {
    // Проставляем timestamps и подменяем время на Europe/Moscow
    timestamps: {
      currentTime: () => moment().tz("Europe/Moscow").toDate(),
    },
  }
);

export default model<SellerDoc>("Seller", sellerSchema);
