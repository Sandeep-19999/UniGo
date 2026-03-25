import { Router } from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  createRating,
  getDriverRatings,
  getRatingByBooking,
  updateRating,
  canRateBooking
} from "../controllers/ratingController.js";

const router = Router();

// Create rating for a booking
router.post("/", protect, authorizeRoles("user"), createRating);

// Get all ratings for a driver
router.get("/driver/:driverId", getDriverRatings);

// Check if can rate booking
router.get("/check/:bookingId", protect, authorizeRoles("user"), canRateBooking);

// Get rating for a specific booking
router.get("/booking/:bookingId", getRatingByBooking);

// Update rating
router.put("/:ratingId", protect, authorizeRoles("user"), updateRating);

export default router;
