import "dotenv/config";
import connectDB from "../config/db.js";
import User from "../models/users/User.js";

async function main() {
  await connectDB(process.env.MONGODB_URI);

  const email = (process.env.ADMIN_EMAIL || "admin@unigo.local").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "AdminPass123!";
  const name = process.env.ADMIN_NAME || "UniGo Admin";

  const existing = await User.findOne({ email });
  if (existing) {
    console.log("✅ Admin already exists:", existing.email);
    process.exit(0);
  }

  await User.create({ name, email, password, role: "admin" });

  console.log("✅ Seeded admin:", email);
  console.log("   Password:", password);
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed error:", e);
  process.exit(1);
});
