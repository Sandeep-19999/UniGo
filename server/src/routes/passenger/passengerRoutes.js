import { Router } from "express";
import { protect, authorizeRoles } from "../../middleware/authMiddleware.js";

const router = Router();

router.get("/home", protect, authorizeRoles("user"), (req, res) => {
  res.json({ ok: true, message: "Passenger home access granted (placeholder)." });
});

export default router;
