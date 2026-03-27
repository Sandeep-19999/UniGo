import { Router } from "express";
import { protect, authorizeRoles } from "../../middleware/authMiddleware.js";
import { requireApprovedDriverOnboarding } from "../../middleware/driverOnboardingMiddleware.js";
import {
  getMyEarningsSummary,
  getMyEarningsHistory,
  requestCashout
} from "../../controllers/driver/earningsController.js";

const router = Router();

router.use(protect, authorizeRoles("driver"), requireApprovedDriverOnboarding);

router.get("/summary", getMyEarningsSummary);
router.get("/history", getMyEarningsHistory);
router.post("/cashout", requestCashout);

export default router;