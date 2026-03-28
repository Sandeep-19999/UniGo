import mongoose from "mongoose";
import Rating from "./server/src/models/Rating.js";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/unigo";

async function clearAllRatings() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB");

    // Delete all ratings
    const result = await Rating.deleteMany({});
    console.log(`✓ Deleted ${result.deletedCount} ratings`);

    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

clearAllRatings();
