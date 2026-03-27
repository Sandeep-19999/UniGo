import { Router } from "express";
import { protect, authorizeRoles } from "../../middleware/authMiddleware.js";
import {
  getMyAvailability,
  saveDriverDestination,
  goOnline,
  updateAvailabilityLocation,
  goOffline
} from "../../controllers/driver/availabilityController.js";

const router = Router();

router.use(protect, authorizeRoles("driver"));

router.get("/me", getMyAvailability);
router.patch("/destination", saveDriverDestination);
router.post("/go-online", goOnline);
router.patch("/location", updateAvailabilityLocation);
router.patch("/go-offline", goOffline);

export default router;