import { Schema, model, Document, Types } from "mongoose";

export type CategoryStatus = "active" | "pending" | "archived";
export type CategoryCreatedBy = "admin" | "seller";

export interface CategoryDoc extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string; // уникален в границах parentId
  parentId?: Types.ObjectId | null;
  status: CategoryStatus;
  createdBy: CategoryCreatedBy;
  synonyms: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<CategoryDoc>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 60,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 60,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "pending", "archived"],
      default: "pending",
      index: true,
    },
    createdBy: { type: String, enum: ["admin", "seller"], required: true },
    synonyms: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Уникальность slug в пределах одного родителя
CategorySchema.index({ parentId: 1, slug: 1 }, { unique: true });
// Поиск активных по родителю
CategorySchema.index({ status: 1, parentId: 1 });
// (опционально) текстовый индекс на имя/синонимы
// CategorySchema.index({ name: "text", synonyms: "text" });

export default model<CategoryDoc>("Category", CategorySchema);
