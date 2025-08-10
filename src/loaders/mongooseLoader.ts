import mongoose from "mongoose";
import config from "../config";
import NotificationModel from "../models/notificationModel";
import SellerModel from "../models/sellerModel";
import CategoryModel from "../models/categoryModel";

export const initMongo = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("✅ MongoDB connected");

    // синхронизация индексов (создаст новые, обновит существующие)
    await Promise.all([
      SellerModel.syncIndexes(),
      NotificationModel.syncIndexes(),
      CategoryModel.syncIndexes(),
    ]);
    console.log("✅ Indexes synced");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};
