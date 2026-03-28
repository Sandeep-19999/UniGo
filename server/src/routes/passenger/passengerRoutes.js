import { Router } from "express";
import { protect, authorizeRoles } from "../../middleware/authMiddleware.js";
import {
  browseAvailableRides,
  createRideRequest,
  getMyRideRequests,
  getRideRequestById,
  cancelRideRequest,
  updatePassengerRideLocation,
  getRideTracking
} from "../../controllers/rides/passengerRideController.js";
import {
  createBooking,
  getPassengerBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking
} from "../../controllers/rides/bookingController.js";

const router = Router();

router.get("/home", protect, authorizeRoles("user"), (req, res) => {
  res.json({ ok: true, message: "Passenger home access granted" });
});

router.get("/available-rides", protect, authorizeRoles("user"), browseAvailableRides);

router.post("/rides", protect, authorizeRoles("user"), createRideRequest);
router.get("/rides", protect, authorizeRoles("user"), getMyRideRequests);
router.get("/rides/:id", protect, authorizeRoles("user"), getRideRequestById);
router.put("/rides/:id/cancel", protect, authorizeRoles("user"), cancelRideRequest);
router.patch("/rides/:id/location", protect, authorizeRoles("user"), updatePassengerRideLocation);
router.get("/rides/:id/tracking", protect, authorizeRoles("user"), getRideTracking);

router.post("/bookings", protect, authorizeRoles("user"), createBooking);
router.get("/bookings", protect, authorizeRoles("user"), getPassengerBookings);
router.get("/bookings/:id", protect, authorizeRoles("user"), getBookingById);
router.put("/bookings/:id/status", protect, authorizeRoles("user"), updateBookingStatus);
router.put("/bookings/:id/cancel", protect, authorizeRoles("user"), cancelBooking);

export default router;