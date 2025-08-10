import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../src/models/categoryModel";
import { slugify } from "../src/utils/slug";

dotenv.config();

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/LastPiece";

const ROOTS = [
  "Молоко",
  "Выпечка",
  "Мясо",
  "Овощи",
  "Фрукты",
  "Напитки",
  "Сыры",
  "Шоколад",
];

async function run() {
  await mongoose.connect(uri);
  console.log("Mongo connected");

  for (const name of ROOTS) {
    const slug = slugify(name);
    const exists = await Category.findOne({ parentId: null, slug }).lean();
    if (!exists) {
      await Category.create({
        name,
        slug,
        parentId: null,
        status: "active",
        createdBy: "admin",
        synonyms: [],
      });
      console.log("Inserted:", name);
    } else {
      console.log("Exists:", name);
    }
  }

  await mongoose.disconnect();
  console.log("Done");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
