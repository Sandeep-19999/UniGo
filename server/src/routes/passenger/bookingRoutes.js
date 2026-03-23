import express from "express";
import {
  createBooking,
  listPassengerBookings,
  listRideBookings,
  updateBookingStatus,
  deleteBooking,
  getBooking,
} from "../../controllers/rides/bookingController.js";
import { protect, authorizeRoles } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Passenger booking routes
router.post("/", protect, authorizeRoles("user"), createBooking);
router.get("/", protect, authorizeRoles("user"), listPassengerBookings);
router.get("/:bookingId", protect, getBooking);
router.put("/:bookingId/status", protect, updateBookingStatus);
router.delete("/:bookingId", protect, authorizeRoles("user"), deleteBooking);

// Driver: view bookings for a specific ride
router.get("/ride/:rideId", protect, authorizeRoles("driver"), listRideBookings);

export default router;
