import "dotenv/config";
import connectDB from "./config/db.js";
import { createApp } from "./app.js";
import { getSmsConfigStatus } from "./utils/safetyHelpers.js";

const PORT = process.env.PORT || 5001;

async function main() {
  await connectDB(process.env.MONGODB_URI);
  const app = createApp();
  const smsConfig = getSmsConfigStatus();

  if (!smsConfig.ok) {
    console.warn("[SMS CONFIG] Twilio SMS is not fully configured.");
    console.warn(`[SMS CONFIG] Missing: ${smsConfig.missing.join(", ")}`);
  }

  if (smsConfig.warnings.length > 0) {
    smsConfig.warnings.forEach((warning) => {
      console.warn(`[SMS CONFIG] ${warning}`);
    });
  }

  if (smsConfig.ok && smsConfig.warnings.length === 0) {
    console.log("[SMS CONFIG] Twilio settings look valid.");
  }

  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║          🚀 UniGo Server Started              ║
╠═══════════════════════════════════════════════╣
║ Server: http://localhost:${PORT}                  
║ Environment: ${process.env.NODE_ENV || "development"}
║ Mode: Safety & Payment Services               
╠═══════════════════════════════════════════════╣
║ Available Endpoints:                          
║ • /api/health                                 
║ • /api/docs                                   
║ • /api/safety/* (Protected)                   
║ • /api/payment/* (Protected)                  
╚═══════════════════════════════════════════════╝
    `);
  });
}

main().catch((e) => {
  console.error("Startup error:", e);
  process.exit(1);
});