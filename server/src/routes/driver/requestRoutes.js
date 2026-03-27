import { Router } from "express";
import { protect, authorizeRoles } from "../../middleware/authMiddleware.js";
import { requireApprovedDriverOnboarding } from "../../middleware/driverOnboardingMiddleware.js";
import {
  listMatchedRequests,
  acceptMatchedRequest,
  updateRideProgressStep,
  rejectMatchedRequest,
  cancelAcceptedRide,
  getAcceptedDriverRequests
} from "../../controllers/driver/driverRequestController.js";

const router = Router();

router.use(protect, authorizeRoles("driver"));

router.get("/matches", requireApprovedDriverOnboarding, listMatchedRequests);
router.get("/accepted", requireApprovedDriverOnboarding, getAcceptedDriverRequests);
router.patch("/:id/accept", requireApprovedDriverOnboarding, acceptMatchedRequest);
router.patch("/:id/step", requireApprovedDriverOnboarding, updateRideProgressStep);
router.patch("/:id/reject", requireApprovedDriverOnboarding, rejectMatchedRequest);
router.patch("/:id/cancel", requireApprovedDriverOnboarding, cancelAcceptedRide);

export default router;