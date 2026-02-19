import { Router } from "express";
import { protect, authorizeRoles } from "../../middleware/authMiddleware.js";
import {
  listRides,
  createRide,
  updateRide,
  deleteRide,
  setRideStatus,
  bookOneSeat,
  history,
  earningsSummary
} from "../../controllers/rides/rideController.js";

const router = Router();

router.use(protect, authorizeRoles("driver"));

router.get("/", listRides);
router.post("/", createRide);
router.patch("/:id", updateRide);
router.delete("/:id", deleteRide);

router.patch("/:id/status", setRideStatus);
router.post("/:id/book-seat", bookOneSeat);

router.get("/history", history);
router.get("/earnings/summary", earningsSummary);

export default router;
