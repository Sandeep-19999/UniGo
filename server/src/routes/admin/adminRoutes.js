import { Router } from "express";
import { protect, authorizeRoles } from "../../middleware/authMiddleware.js";

const router = Router();

router.get("/dashboard", protect, authorizeRoles("admin"), (req, res) => {
  res.json({ ok: true, message: "Admin dashboard access granted." });
});

export default router;
