import Vehicle from "../../models/vehicles/Vehicle.js";
import Ride from "../../models/rides/Ride.js";

export async function listVehicles(req, res, next) {
  try {
    const vehicles = await Vehicle.find({ driver: req.user._id }).sort({ createdAt: -1 });
    res.json({ vehicles });
  } catch (err) {
    next(err);
  }
}

export async function createVehicle(req, res, next) {
  try {
    const { type, plateNumber, seatCapacity } = req.body;
    const vehicle = await Vehicle.create({
      driver: req.user._id,
      type,
      plateNumber,
      seatCapacity: Number(seatCapacity)
    });
    res.status(201).json({ vehicle });
  } catch (err) {
    next(err);
  }
}

export async function updateVehicle(req, res, next) {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findOne({ _id: id, driver: req.user._id });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found." });

    const activeRide = await Ride.findOne({ vehicle: vehicle._id, status: { $in: ["pending", "ongoing"] } });
    if (activeRide) return res.status(400).json({ message: "Cannot edit vehicle with an active ride." });

    const { type, plateNumber, seatCapacity } = req.body;
    if (type) vehicle.type = type;
    if (plateNumber) vehicle.plateNumber = plateNumber;
    if (seatCapacity !== undefined) vehicle.seatCapacity = Number(seatCapacity);

    await vehicle.save();
    res.json({ vehicle });
  } catch (err) {
    next(err);
  }
}

export async function deleteVehicle(req, res, next) {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findOne({ _id: id, driver: req.user._id });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found." });

    const activeRide = await Ride.findOne({ vehicle: vehicle._id, status: { $in: ["pending", "ongoing"] } });
    if (activeRide) return res.status(400).json({ message: "Cannot delete vehicle with an active ride." });

    await vehicle.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
