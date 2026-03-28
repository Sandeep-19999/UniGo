import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/auth/authRoutes.js";
import adminRoutes from "./routes/admin/adminRoutes.js";
import driverReviewRoutes from "./routes/admin/driverReviewRoutes.js";
import passengerRoutes from "./routes/passenger/passengerRoutes.js";
import driverVehicleRoutes from "./routes/driver/vehicleRoutes.js";
import driverRideRoutes from "./routes/driver/rideRoutes.js";
import onboardingRoutes from "./routes/driver/onboardingRoutes.js";
import availabilityRoutes from "./routes/driver/availabilityRoutes.js";
import driverRequestRoutes from "./routes/driver/requestRoutes.js";
import driverEarningsRoutes from "./routes/driver/earningsRoutes.js";
import testRoutes from "./routes/test/testRoutes.js";

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

function parseOrigins() {
  const raw = process.env.CORS_ORIGIN || "";
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return list.length ? list : ["http://localhost:5173", "http://127.0.0.1:5173"];
}

function isLocalOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

export function createApp() {
  const app = express();
  const allowed = new Set(parseOrigins());

  app.use(express.json({ limit: "2mb" }));

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (allowed.has(origin) || isLocalOrigin(origin)) return cb(null, true);
        return cb(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      optionsSuccessStatus: 204
    })
  );
  app.options("*", cors());

  app.use(morgan("dev"));

  app.get("/api/health", (req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/admin/driver-reviews", driverReviewRoutes);
  app.use("/api/passenger", passengerRoutes);
  app.use("/api/test", testRoutes);

  app.use("/api/driver/onboarding", onboardingRoutes);
  app.use("/api/driver/availability", availabilityRoutes);
  app.use("/api/driver/requests", driverRequestRoutes);
  app.use("/api/driver/earnings", driverEarningsRoutes);
  app.use("/api/driver/vehicles", driverVehicleRoutes);
  app.use("/api/driver/rides", driverRideRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}