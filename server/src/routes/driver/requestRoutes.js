import { Router } from "express";
import { protect, authorizeRoles } from "../../middleware/authMiddleware.js";
import { requireApprovedDriverOnboarding } from "../../middleware/driverOnboardingMiddleware.js";
import {
  listMatchedRequests,
  acceptMatchedRequest,
  rejectMatchedRequest,
  getAcceptedDriverRequests
} from "../../controllers/driver/driverRequestController.js";

const router = Router();

router.use(protect, authorizeRoles("driver"));

router.get("/matches", requireApprovedDriverOnboarding, listMatchedRequests);
router.get("/accepted", requireApprovedDriverOnboarding, getAcceptedDriverRequests);
router.patch("/:id/accept", requireApprovedDriverOnboarding, acceptMatchedRequest);
router.patch("/:id/reject", requireApprovedDriverOnboarding, rejectMatchedRequest);

export default router;
