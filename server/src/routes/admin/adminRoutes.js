import { Router } from "express";
import { protect, authorizeRoles } from "../../middleware/authMiddleware.js";
import {
  createAdminProfile,
  getAllAdmins,
  getAdminById,
  updateAdminProfile,
  updateLastLogin,
  deleteAdminProfile,
  getAdminByUserId,
  getAllPassengers,
  getAllDrivers,
  getDashboardStats
} from "../../controllers/admin/adminController.js";

const router = Router();

router.get("/dashboard", protect, authorizeRoles("admin"), (req, res) => {
  res.json({ ok: true, message: "Admin dashboard access granted." });
});

// Admin profile endpoints
router.post("/profiles", protect, authorizeRoles("admin"), createAdminProfile);
router.get("/profiles", protect, authorizeRoles("admin"), getAllAdmins);
router.get("/profiles/:id", protect, authorizeRoles("admin"), getAdminById);
router.get("/profiles/user/:userId", protect, authorizeRoles("admin"), getAdminByUserId);
router.put("/profiles/:id", protect, authorizeRoles("admin"), updateAdminProfile);
router.delete("/profiles/:id", protect, authorizeRoles("admin"), deleteAdminProfile);

// Login tracking
router.post("/profiles/login-track", protect, authorizeRoles("admin"), updateLastLogin);

// Management endpoints
router.get("/passengers", protect, authorizeRoles("admin"), getAllPassengers);
router.get("/drivers", protect, authorizeRoles("admin"), getAllDrivers);
router.get("/stats", protect, authorizeRoles("admin"), getDashboardStats);

export default router;
