import { Router } from "express";
import { protect, authorizeRoles } from "../../middleware/authMiddleware.js";
import { listVehicles, createVehicle, updateVehicle, deleteVehicle } from "../../controllers/vehicles/vehicleController.js";

const router = Router();

router.use(protect, authorizeRoles("driver"));

router.get("/", listVehicles);
router.post("/", createVehicle);
router.patch("/:id", updateVehicle);
router.delete("/:id", deleteVehicle);

export default router;
