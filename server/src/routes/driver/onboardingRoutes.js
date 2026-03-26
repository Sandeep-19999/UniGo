import { Router } from "express";
import { protect, authorizeRoles } from "../../middleware/authMiddleware.js";
import {
  getOnboardingStatus,
  getDriverOnboardingDetail,
  upsertDriverProfile,
  submitVehicleInformation,
  listDriverDocuments,
  submitDriverDocument,
  deleteDriverDocument
} from "../../controllers/driver/onboardingController.js";

const router = Router();

router.use(protect, authorizeRoles("driver"));

router.get("/status", getOnboardingStatus);
router.get("/detail", getDriverOnboardingDetail);
router.put("/profile", upsertDriverProfile);
router.put("/vehicle", submitVehicleInformation);
router.get("/documents", listDriverDocuments);
router.put("/documents/:documentType", submitDriverDocument);
router.delete("/documents/:documentType", deleteDriverDocument);

export default router;
