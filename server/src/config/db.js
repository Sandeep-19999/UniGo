import mongoose from "mongoose";

export default async function connectDB(uri) {
  if (!uri) throw new Error("MONGODB_URI is missing.");

  const dbName = process.env.MONGODB_DB_NAME || "unigo";
  await mongoose.connect(uri, { dbName });
  console.log(`✅ MongoDB connected (db: ${mongoose.connection.name})`);
}
