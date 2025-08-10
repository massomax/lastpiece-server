import { Schema, model, Document, Types } from "mongoose";

export type Currency = "RUB" | "EUR" | "USD";
export type ProductStatus = "draft" | "active" | "archived";
export type PromotionLevel = "none" | "basic" | "plus" | "pro"; // задел под тарифы продвижения

export interface ProductDoc extends Document {
  _id: Types.ObjectId;
  sellerId: Types.ObjectId;

  title: string;
  description?: string;
  images: string[];
  tags: string[];

  categoryId: Types.ObjectId;
  categoryName: string;
  categorySlug: string;

  price: number;
  oldPrice?: number;
  currency: Currency;

  stockQty: number;
  status: ProductStatus;
  sku?: string;

  deletedAt?: Date | null;

  isFeatured: boolean;

  promotionLevel: PromotionLevel;
  promotionEndAt?: Date | null;
  rankScore: number;

  // Новый ключ для детерминированного рандома внутри ранга
  shuffleKey: number;

  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<ProductDoc>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", required: true, index: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    images: { type: [String], default: [] },
    tags: { type: [String], default: [] },

    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    categoryName: { type: String, required: true },
    categorySlug: { type: String, required: true },

    price: { type: Number, required: true, min: 0 },
    oldPrice: { type: Number, default: undefined },
    currency: { type: String, enum: ["RUB","EUR","USD"], default: "RUB" },

    stockQty: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["draft","active","archived"], default: "draft", index: true },
    sku: { type: String, default: undefined },

    deletedAt: { type: Date, default: null, index: true },

    isFeatured: { type: Boolean, default: false, index: true },

    promotionLevel: { type: String, enum: ["none","basic","plus","pro"], default: "none", index: true },
    promotionEndAt: { type: Date, default: null, index: true },
    rankScore: { type: Number, default: 0, index: true },

    shuffleKey: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

productSchema.index({ sellerId: 1, sku: 1 }, { unique: true, partialFilterExpression: { sku: { $type: "string" } } });

// Индексы под листинги и курсор: rankScore DESC -> shuffleKey DESC -> _id DESC
productSchema.index({ rankScore: -1, shuffleKey: -1, _id: -1 });
productSchema.index({ sellerId: 1, rankScore: -1, shuffleKey: -1, _id: -1 });
productSchema.index({ categoryId: 1, rankScore: -1, shuffleKey: -1, _id: -1 });

export default model<ProductDoc>("Product", productSchema);