import { Router } from "express";
import { protect, authorizeRoles } from "../../middleware/authMiddleware.js";
import {
  getDriverOnboardingQueue,
  getDriverOnboardingByDriverId,
  reviewDriverDocument
} from "../../controllers/admin/driverReviewController.js";

const router = Router();

router.use(protect, authorizeRoles("admin"));

router.get("/queue", getDriverOnboardingQueue);
router.get("/:driverId", getDriverOnboardingByDriverId);
router.patch("/:driverId/documents/:documentType/review", reviewDriverDocument);

export default router;
