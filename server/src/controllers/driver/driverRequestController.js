import mongoose from "mongoose";
import RideRequest from "../../models/rides/RideRequest.js";
import DriverAvailability from "../../models/drivers/DriverAvailability.js";
import Vehicle from "../../models/vehicles/Vehicle.js";
import { matchDriversForRideRequest } from "../../services/matchingService.js";

function extractDriverMatch(rideRequest, driverId) {
  return (rideRequest.matchedDrivers || []).find((item) => String(item.driver) === String(driverId)) || null;
}

export async function listMatchedRequests(req, res, next) {
  try {
    const rideRequests = await RideRequest.find({
      status: "pending",
      acceptedBy: null,
      matchedDrivers: {
        $elemMatch: {
          driver: req.user._id,
          status: "pending"
        }
      }
    })
      .populate("passenger", "name email phone")
      .populate("matchedDrivers.driver", "name email phone")
      .populate("matchedDrivers.vehicle", "type plateNumber make model year")
      .sort({ createdAt: -1 });

    const items = rideRequests.map((rideRequest) => ({
      rideRequest,
      myMatch: extractDriverMatch(rideRequest, req.user._id)
    }));

    res.json({ items, total: items.length });
  } catch (err) {
    next(err);
  }
}

export async function acceptMatchedRequest(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const requestedVehicleId = req.body.vehicleId;

    const rideRequest = await RideRequest.findOne({
      _id: id,
      status: "pending",
      acceptedBy: null,
      matchedDrivers: {
        $elemMatch: {
          driver: req.user._id,
          status: "pending"
        }
      }
    }).session(session);

    if (!rideRequest) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Matched ride request not found or already accepted." });
    }

    const availability = await DriverAvailability.findOne({ driver: req.user._id, isOnline: true }).session(session);
    if (!availability) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Driver must be online to accept ride requests." });
    }

    const fallbackVehicleId = requestedVehicleId || availability.vehicle || extractDriverMatch(rideRequest, req.user._id)?.vehicle;
    const vehicle = await Vehicle.findOne({ _id: fallbackVehicleId, driver: req.user._id }).session(session);
    if (!vehicle) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Vehicle not found for acceptance." });
    }

    rideRequest.status = "accepted";
    rideRequest.matchingStatus = "accepted";
    rideRequest.acceptedBy = req.user._id;
    rideRequest.acceptedVehicle = vehicle._id;
    rideRequest.acceptedAt = new Date();
    rideRequest.matchedDrivers = (rideRequest.matchedDrivers || []).map((item) => {
      if (String(item.driver) === String(req.user._id)) {
        return { ...item.toObject?.() ?? item, vehicle: vehicle._id, status: "accepted", respondedAt: new Date() };
      }
      if (item.status === "pending") {
        return { ...item.toObject?.() ?? item, status: "expired", respondedAt: new Date() };
      }
      return item;
    });

    await rideRequest.save({ session });

    availability.status = "matched";
    availability.lastMatchedAt = new Date();
    await availability.save({ session });

    await session.commitTransaction();

    const populated = await RideRequest.findById(rideRequest._id)
      .populate("passenger", "name email phone")
      .populate("acceptedBy", "name email phone")
      .populate("acceptedVehicle", "type plateNumber make model year seatCapacity");

    res.json({ message: "Ride request accepted successfully.", rideRequest: populated });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
}

export async function rejectMatchedRequest(req, res, next) {
  try {
    const { id } = req.params;

    const rideRequest = await RideRequest.findOne({
      _id: id,
      status: "pending",
      acceptedBy: null,
      matchedDrivers: {
        $elemMatch: {
          driver: req.user._id,
          status: "pending"
        }
      }
    });

    if (!rideRequest) {
      return res.status(404).json({ message: "Matched ride request not found or already processed." });
    }

    rideRequest.matchedDrivers = (rideRequest.matchedDrivers || []).map((item) => {
      if (String(item.driver) === String(req.user._id) && item.status === "pending") {
        return { ...item.toObject?.() ?? item, status: "rejected", respondedAt: new Date() };
      }
      return item;
    });

    if (!(rideRequest.rejectedByDrivers || []).some((driverId) => String(driverId) === String(req.user._id))) {
      rideRequest.rejectedByDrivers.push(req.user._id);
    }

    await rideRequest.save();
    await matchDriversForRideRequest(rideRequest._id);

    const refreshed = await RideRequest.findById(id)
      .populate("passenger", "name email phone")
      .populate("matchedDrivers.driver", "name email phone");

    res.json({ message: "Ride request rejected.", rideRequest: refreshed });
  } catch (err) {
    next(err);
  }
}

export async function getAcceptedDriverRequests(req, res, next) {
  try {
    const rideRequests = await RideRequest.find({ acceptedBy: req.user._id })
      .populate("passenger", "name email phone")
      .populate("acceptedVehicle", "type plateNumber make model year seatCapacity")
      .sort({ acceptedAt: -1, createdAt: -1 });

    res.json({ rideRequests });
  } catch (err) {
    next(err);
  }
}
