import { FilterQuery, Types } from "mongoose";
import Category, { CategoryDoc } from "../models/categoryModel";
import { slugify, normalizeName } from "../utils/slug";

export interface CategoryInput {
  name: string;
  parentId?: string | null;
}

export async function listActive(
  parentId?: string | null,
  q?: string
): Promise<CategoryDoc[]> {
  const filter: FilterQuery<CategoryDoc> = { status: "active" } as any;
  if (parentId === undefined) {
    // корень
    filter.parentId = null;
  } else if (parentId === null) {
    filter.parentId = null;
  } else if (parentId) {
    filter.parentId = new Types.ObjectId(parentId);
  }
  if (q && q.trim()) {
    const rx = new RegExp(
      normalizeName(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );
    filter.$or = [{ name: rx }, { synonyms: rx }];
  }
  return Category.find(filter).sort({ name: 1 }).lean();
}

export async function propose(
  name: string,
  parentId?: string | null,
  createdBy: "admin" | "seller" = "seller"
) {
  const normName = normalizeName(name);
  const slug = slugify(normName);
  const parent = parentId ? new Types.ObjectId(parentId) : null;

  // Поиск дублей в active/pending при том же parentId
  const dup = await Category.findOne({
    status: { $in: ["active", "pending"] },
    parentId: parent,
    $or: [
      { slug },
      { name: new RegExp(`^${normName}$`, "i") },
      { synonyms: new RegExp(`^${normName}$`, "i") },
    ],
  }).lean();

  if (dup) {
    const suggestions = [dup].map((c) => ({
      id: String(c._id),
      name: c.name,
      slug: c.slug,
    }));
    const err: any = new Error("CategoryAlreadyExists");
    err.status = 409;
    err.payload = { suggestions };
    throw err;
  }

  const created = await Category.create({
    name: normName,
    slug,
    parentId: parent,
    status: "pending",
    createdBy,
    synonyms: [],
  });
  return created;
}

export async function listPending(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Category.find({ status: "pending" })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Category.countDocuments({ status: "pending" }),
  ]);
  return { items, total, page, limit };
}

export async function approve(id: string) {
  const updated = await Category.findOneAndUpdate(
    { _id: new Types.ObjectId(id), status: { $in: ["pending", "archived"] } },
    { $set: { status: "active" } },
    { new: true }
  );
  if (!updated) {
    const err: any = new Error("CategoryNotFoundOrAlreadyActive");
    err.status = 404;
    throw err;
  }
}

export async function merge(id: string, targetId: string) {
  if (id === targetId) {
    const err: any = new Error("SameCategory");
    err.status = 400;
    throw err;
  }
  const [src, tgt] = await Promise.all([
    Category.findById(id),
    Category.findById(targetId),
  ]);
  if (!src || !tgt) {
    const err: any = new Error("CategoryNotFound");
    err.status = 404;
    throw err;
  }
  // Перенести имя исходной в синонимы целевой, если нет
  const norm = normalizeName(src.name);
  if (!tgt.synonyms.map((s) => s.toLowerCase()).includes(norm.toLowerCase())) {
    tgt.synonyms.push(norm);
  }
  await tgt.save();
  // Архивируем исходную. Переназначение товаров сделаем на этапе продуктов
  src.status = "archived";
  await src.save();
}

export async function archive(id: string) {
  // TODO: когда появятся продукты, проверять связи и кидать 409, если есть активные товары
  const updated = await Category.findByIdAndUpdate(id, {
    $set: { status: "archived" },
  });
  if (!updated) {
    const err: any = new Error("CategoryNotFound");
    err.status = 404;
    throw err;
  }
}
