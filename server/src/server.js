import "dotenv/config";
import connectDB from "./config/db.js";
import { createApp } from "./app.js";

const PORT = process.env.PORT || 5001;

async function main() {
  await connectDB(process.env.MONGODB_URI);
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

main().catch((e) => {
  console.error("Startup error:", e);
  process.exit(1);
});
