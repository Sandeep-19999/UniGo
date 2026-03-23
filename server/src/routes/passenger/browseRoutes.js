import express from "express";
import {
  listAvailableRides,
  getRideDetail,
  listAvailableDrivers,
  getDriverDetail,
} from "../../controllers/rides/passengerController.js";

const router = express.Router();

// Public endpoints - no authentication required
router.get("/rides", listAvailableRides);
router.get("/rides/:rideId", getRideDetail);
router.get("/drivers", listAvailableDrivers);
router.get("/drivers/:driverId", getDriverDetail);

export default router;
