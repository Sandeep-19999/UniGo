import mongoose from "mongoose";
import { setServers, setDefaultResultOrder } from "dns";
import Payment from "../models/Payment.js";

async function dropLegacyPaymentIndexes() {
  const indexNames = [
    "invoice.invoiceNumber_1",
    "refund.refundId_1",
    "refund.transactionId_1"
  ];

  for (const indexName of indexNames) {
    try {
      await Payment.collection.dropIndex(indexName);
      console.log(`✅ Dropped legacy payment index: ${indexName}`);
    } catch (err) {
      if (err?.codeName !== "IndexNotFound") {
        console.warn(`⚠️ Could not drop index ${indexName}: ${err.message}`);
      }
    }
  }
}

export default async function connectDB(uri) {
  if (!uri) throw new Error("MONGODB_URI is missing.");

  const dbName = process.env.MONGODB_DB_NAME || "unigo";

  try {
    await mongoose.connect(uri, { dbName });
    console.log(`✅ MongoDB connected (db: ${mongoose.connection.name})`);
    await dropLegacyPaymentIndexes();
  } catch (err) {
    const isDnsResolutionError =
      err?.code === "ECONNREFUSED" ||
      err?.code === "ENOTFOUND" ||
      err?.code === "EAI_AGAIN" ||
      err?.syscall === "querySrv" ||
      String(err?.message || "").includes("ENOTFOUND") ||
      String(err?.message || "").includes("querySrv");

    if (isDnsResolutionError) {
      console.warn("⚠️ DNS resolution failed, retrying with custom DNS servers (IPv4 first)...");

      const dnsServers = (process.env.DNS_SERVERS || "8.8.8.8,1.1.1.1")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      setServers(dnsServers);
      setDefaultResultOrder("ipv4first");

      await mongoose.connect(uri, {
        dbName,
        family: 4,
        serverSelectionTimeoutMS: 30000,
      });
      console.log(`✅ MongoDB connected with fallback DNS (db: ${mongoose.connection.name})`);
      await dropLegacyPaymentIndexes();
      return;
    }

    throw err;
  }
}
