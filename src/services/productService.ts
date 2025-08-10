import { FilterQuery, Types } from "mongoose";
import Product, { ProductDoc, PromotionLevel } from "../models/productModel";
import Category from "../models/categoryModel";
import { decodeCursor, encodeCursor } from "../utils/cursor";
import { computeShuffleKey } from "../utils/shuffle";

export interface CreateProductInput {
  sellerId?: string; // админ должен передать, для seller — игнорируется
  title: string;
  description?: string;
  images?: string[];
  tags?: string[];
  categoryId: string;
  price: number;
  oldPrice?: number;
  currency?: "RUB" | "EUR" | "USD";
  stockQty?: number;
  status?: "draft" | "active" | "archived";
  sku?: string;
  isFeatured?: boolean;
  promotionLevel?: PromotionLevel;
  promotionEndAt?: string | Date | null;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  rotateShuffle?: boolean; // по запросу можно пересчитать shuffleKey
}

const PROMO_WEIGHTS: Record<PromotionLevel, number> = {
  none: 0,
  basic: 10,
  plus: 20,
  pro: 30,
};
const SHUFFLE_SALT = process.env.PROMO_SALT || "default-salt"; // можно менять по крону для ротации

function calcRankScore(
  level: PromotionLevel,
  promotionEndAt: Date | null,
  isFeatured: boolean
): number {
  const active = promotionEndAt ? promotionEndAt.getTime() > Date.now() : false;
  let score = 0;
  if (active) score += PROMO_WEIGHTS[level];
  if (isFeatured) score += 5;
  return score;
}

async function resolveCategorySnapshot(categoryId: string) {
  const cat = await Category.findOne({
    _id: new Types.ObjectId(categoryId),
    status: "active",
  }).lean();
  if (!cat) {
    const err: any = new Error("CategoryNotFoundOrInactive");
    err.status = 400;
    throw err;
  }
  return {
    categoryId: cat._id,
    categoryName: cat.name,
    categorySlug: cat.slug,
  };
}

export async function createProduct(
  input: CreateProductInput,
  role: "seller" | "admin",
  userId: string
): Promise<ProductDoc> {
  const sellerId = role === "seller" ? userId : input.sellerId;
  if (!sellerId) {
    const err: any = new Error("sellerIdRequiredForAdmin");
    err.status = 400;
    throw err;
  }

  const { categoryId, categoryName, categorySlug } =
    await resolveCategorySnapshot(input.categoryId);

  const level = input.promotionLevel ?? "none";
  const promotionEndAt = input.promotionEndAt
    ? new Date(input.promotionEndAt)
    : null;
  const isFeatured = !!input.isFeatured;
  const rankScore = calcRankScore(level, promotionEndAt, isFeatured);

  // заранее генерим _id, чтобы рассчитать стабильный shuffleKey
  const _id = new Types.ObjectId();
  const shuffleKey = computeShuffleKey(_id.toHexString(), SHUFFLE_SALT);

  const status = role === "seller" ? "draft" : input.status ?? "draft";

  const doc = await Product.create({
    _id,
    sellerId: new Types.ObjectId(sellerId),
    title: input.title,
    description: input.description ?? "",
    images: input.images ?? [],
    tags: input.tags ?? [],

    categoryId,
    categoryName,
    categorySlug,

    price: input.price,
    oldPrice: input.oldPrice ?? undefined,
    currency: input.currency ?? "RUB",

    stockQty: input.stockQty ?? 0,
    status,
    sku: input.sku ?? undefined,

    deletedAt: null,
    isFeatured,
    promotionLevel: level,
    promotionEndAt,
    rankScore,
    shuffleKey,
  });

  return doc;
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
  role: "seller" | "admin",
  userId: string
) {
  const prod = await Product.findById(id);
  if (!prod || prod.deletedAt) {
    const err: any = new Error("ProductNotFound");
    err.status = 404;
    throw err;
  }

  if (role === "seller" && String(prod.sellerId) !== userId) {
    const err: any = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  if (role === "seller" && input.sellerId) delete input.sellerId;

  if (role === "seller" && input.status !== undefined) {
    if (input.status === "active") {
      const err: any = new Error("SellerCannotActivateProduct");
      err.status = 403;
      throw err;
    }
  }

  if (input.categoryId) {
    const snap = await resolveCategorySnapshot(input.categoryId);
    (prod as any).categoryId = snap.categoryId;
    (prod as any).categoryName = snap.categoryName;
    (prod as any).categorySlug = snap.categorySlug;
  }

  if (input.title !== undefined) prod.title = input.title;
  if (input.description !== undefined) prod.description = input.description;
  if (input.images !== undefined) prod.images = input.images;
  if (input.tags !== undefined) prod.tags = input.tags;
  if (input.price !== undefined) prod.price = input.price;
  if (input.oldPrice !== undefined) prod.oldPrice = input.oldPrice as any;
  if (input.currency !== undefined) prod.currency = input.currency as any;
  if (input.stockQty !== undefined) prod.stockQty = input.stockQty;
  if (input.status !== undefined) prod.status = input.status as any;
  if (input.sku !== undefined) prod.sku = input.sku;
  if (input.isFeatured !== undefined) prod.isFeatured = !!input.isFeatured;
  if (input.promotionLevel !== undefined)
    prod.promotionLevel = input.promotionLevel;
  if (input.promotionEndAt !== undefined)
    prod.promotionEndAt = input.promotionEndAt
      ? new Date(input.promotionEndAt)
      : null;

  // пересчёт ранка
  prod.rankScore = calcRankScore(
    prod.promotionLevel,
    prod.promotionEndAt ?? null,
    prod.isFeatured
  );

  // опционально пересчитать shuffleKey (например, по кнопке «перетасовать»)
  if (input.rotateShuffle) {
    prod.shuffleKey = computeShuffleKey(String(prod._id), SHUFFLE_SALT);
  }

  await prod.save();
  return prod;
}

export async function softDeleteProduct(
  id: string,
  role: "seller" | "admin",
  userId: string
) {
  const prod = await Product.findById(id);
  if (!prod || prod.deletedAt) {
    const err: any = new Error("ProductNotFound");
    err.status = 404;
    throw err;
  }
  if (role === "seller" && String(prod.sellerId) !== userId) {
    const err: any = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  prod.deletedAt = new Date();
  await prod.save();
}

// ===== Листы с курсором (rank -> shuffle -> _id) =====
function buildCursorFilter(cursorStr?: string | null) {
  const cur = decodeCursor(cursorStr);
  if (!cur) return {};
  return {
    $or: [
      { rankScore: { $lt: cur.r } },
      { rankScore: cur.r, shuffleKey: { $lt: cur.s } },
      {
        rankScore: cur.r,
        shuffleKey: cur.s,
        _id: { $lt: new Types.ObjectId(cur.id) },
      },
    ],
  };
}

function makeNextCursor(items: any[]) {
  if (!items.length) return null;
  const last = items[items.length - 1];
  return encodeCursor({
    r: last.rankScore ?? 0,
    s: last.shuffleKey ?? 0,
    id: String(last._id),
  });
}

export async function listAll(limit: number, cursor?: string | null) {
  const filter: FilterQuery<ProductDoc> = {
    status: "active",
    deletedAt: null,
  } as any;
  const items = await Product.find({ ...filter, ...buildCursorFilter(cursor) })
    .sort({ rankScore: -1, shuffleKey: -1, _id: -1 })
    .limit(limit + 1)
    .lean();
  const hasMore = items.length > limit;
  if (hasMore) items.pop();
  return { items, nextCursor: hasMore ? makeNextCursor(items) : null };
}

export async function listBySeller(
  sellerId: string,
  limit: number,
  cursor?: string | null
) {
  const filter: FilterQuery<ProductDoc> = {
    status: "active",
    deletedAt: null,
    sellerId: new Types.ObjectId(sellerId),
  } as any;
  const items = await Product.find({ ...filter, ...buildCursorFilter(cursor) })
    .sort({ rankScore: -1, shuffleKey: -1, _id: -1 })
    .limit(limit + 1)
    .lean();
  const hasMore = items.length > limit;
  if (hasMore) items.pop();
  return { items, nextCursor: hasMore ? makeNextCursor(items) : null };
}

export async function listByCategorySlug(
  categorySlug: string,
  limit: number,
  cursor?: string | null
) {
  const cat = await Category.findOne({
    slug: categorySlug,
    status: "active",
  }).lean();
  if (!cat) {
    const err: any = new Error("CategoryNotFoundOrInactive");
    err.status = 404;
    throw err;
  }
  const filter: FilterQuery<ProductDoc> = {
    status: "active",
    deletedAt: null,
    categoryId: cat._id,
  } as any;
  const items = await Product.find({ ...filter, ...buildCursorFilter(cursor) })
    .sort({ rankScore: -1, shuffleKey: -1, _id: -1 })
    .limit(limit + 1)
    .lean();
  const hasMore = items.length > limit;
  if (hasMore) items.pop();
  return { items, nextCursor: hasMore ? makeNextCursor(items) : null };
}
