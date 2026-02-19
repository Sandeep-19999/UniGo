import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/auth/authRoutes.js";
import adminRoutes from "./routes/admin/adminRoutes.js";
import passengerRoutes from "./routes/passenger/passengerRoutes.js";
import driverVehicleRoutes from "./routes/driver/vehicleRoutes.js";
import driverRideRoutes from "./routes/driver/rideRoutes.js";

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

function parseOrigins() {
  const raw = process.env.CORS_ORIGIN || "";
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return list.length ? list : ["http://localhost:5173", "http://127.0.0.1:5173"];
}

export function createApp() {
  const app = express();
  const allowed = new Set(parseOrigins());

  app.use(express.json({ limit: "1mb" }));

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true); // allow Postman/curl
        if (allowed.has(origin)) return cb(null, true);
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
  app.use("/api/passenger", passengerRoutes);

  app.use("/api/driver/vehicles", driverVehicleRoutes);
  app.use("/api/driver/rides", driverRideRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
