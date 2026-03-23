import express from "express";
import {
  submitRating,
  getUserRatings,
  getRatingForBooking,
  deleteRating,
} from "../../controllers/rides/ratingController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Submit a rating (protected)
router.post("/", protect, submitRating);

// Get ratings for a specific user
router.get("/user/:userId", getUserRatings);

// Get all ratings for a specific booking
router.get("/booking/:bookingId", getRatingForBooking);

// Delete a rating
router.delete("/:ratingId", protect, deleteRating);

export default router;
