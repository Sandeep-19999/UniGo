import mongoose from "mongoose";
import RideRequest from "../../models/rides/RideRequest.js";
import DriverAvailability from "../../models/drivers/DriverAvailability.js";
import Vehicle from "../../models/vehicles/Vehicle.js";
import { DriverEarnings } from "../../models/Payment.js";
import { matchDriversForRideRequest } from "../../services/matchingService.js";

const NEXT_STEP_BY_CURRENT = {
  assigned: ["arrived_at_pickup", "trip_started"],
  arrived_at_pickup: ["rider_notified", "trip_started"],
  rider_notified: ["trip_started"],
  trip_started: ["dropping_off", "completed"],
  dropping_off: ["completed"],
  completed: []
};

const STATUS_BY_STEP = {
  awaiting_driver: "pending",
  assigned: "accepted",
  arrived_at_pickup: "accepted",
  rider_notified: "accepted",
  trip_started: "started",
  dropping_off: "started",
  completed: "completed"
};

function extractDriverMatch(rideRequest, driverId) {
  return (rideRequest.matchedDrivers || []).find((item) => String(item.driver) === String(driverId)) || null;
}

function populateDriverRequestQuery(query) {
  return query
    .populate("passenger", "name email phone")
    .populate("acceptedBy", "name email phone")
    .populate("acceptedVehicle", "type plateNumber make model year seatCapacity")
    .populate("matchedDrivers.driver", "name email phone")
    .populate("matchedDrivers.vehicle", "type plateNumber make model year seatCapacity");
}

async function creditRideEarningsIfNeeded(rideRequest) {
  const amount = Number(rideRequest.finalFare || rideRequest.estimatedFare || rideRequest.estimatedPrice || 0);
  if (amount <= 0 || rideRequest.earningsCreditedAt || !rideRequest.acceptedBy) return;

  const routeLabel = `${rideRequest.pickupLocation} → ${rideRequest.dropLocation}`;

  await DriverEarnings.findOneAndUpdate(
    { driverId: rideRequest.acceptedBy },
    {
      $setOnInsert: {
        driverId: rideRequest.acceptedBy,
        totalEarnings: 0,
        availableBalance: 0,
        totalWithdrawn: 0,
        completedRides: 0,
        rideEarnings: [],
        cashoutRequests: []
      },
      $inc: {
        totalEarnings: amount,
        availableBalance: amount,
        completedRides: 1
      },
      $push: {
        rideEarnings: {
          rideId: rideRequest._id,
          passengerId: rideRequest.passenger || null,
          routeLabel,
          amount,
          earnedAt: new Date(),
          status: "completed"
        }
      },
      $set: {
        lastUpdated: new Date()
      }
    },
    { upsert: true, new: true }
  );

  rideRequest.earningsCreditedAt = new Date();
  await rideRequest.save();
}

export async function listMatchedRequests(req, res, next) {
  try {
    const rideRequests = await populateDriverRequestQuery(
      RideRequest.find({
        status: "pending",
        acceptedBy: null,
        matchedDrivers: {
          $elemMatch: {
            driver: req.user._id,
            status: "pending"
          }
        }
      }).sort({ createdAt: -1 })
    );

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
    rideRequest.driverJourneyStep = "assigned";
    rideRequest.driverJourneyUpdatedAt = new Date();
    rideRequest.matchedDrivers = (rideRequest.matchedDrivers || []).map((item) => {
      const plainItem = item.toObject?.() ?? item;
      if (String(item.driver) === String(req.user._id)) {
        return { ...plainItem, vehicle: vehicle._id, status: "accepted", respondedAt: new Date() };
      }
      if (item.status === "pending") {
        return { ...plainItem, status: "expired", respondedAt: new Date() };
      }
      return plainItem;
    });

    await rideRequest.save({ session });

    availability.status = "matched";
    availability.lastMatchedAt = new Date();
    await availability.save({ session });

    await session.commitTransaction();

    const populated = await populateDriverRequestQuery(RideRequest.findById(rideRequest._id));

    res.json({ message: "Ride request accepted successfully.", rideRequest: populated });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
}

export async function updateRideProgressStep(req, res, next) {
  try {
    const { id } = req.params;
    const nextStep = String(req.body?.step || "").trim();

    const rideRequest = await RideRequest.findOne({
      _id: id,
      acceptedBy: req.user._id,
      status: { $in: ["accepted", "started"] }
    });

    if (!rideRequest) {
      return res.status(404).json({ message: "Active ride not found for this driver." });
    }

    const currentStep = rideRequest.driverJourneyStep || "assigned";
    const allowedNextSteps = NEXT_STEP_BY_CURRENT[currentStep] || [];

    if (!allowedNextSteps.includes(nextStep)) {
      return res.status(400).json({
        message: `Invalid journey step transition: ${currentStep} → ${nextStep}`
      });
    }

    rideRequest.driverJourneyStep = nextStep;
    rideRequest.driverJourneyUpdatedAt = new Date();
    rideRequest.status = STATUS_BY_STEP[nextStep] || rideRequest.status;

    if (nextStep === "trip_started" && !rideRequest.startedAt) {
      rideRequest.startedAt = new Date();
    }

    if (nextStep === "completed") {
      rideRequest.completedAt = new Date();
      rideRequest.finalFare = Number(rideRequest.finalFare || rideRequest.estimatedFare || rideRequest.estimatedPrice || 0);
    }

    await rideRequest.save();

    if (nextStep === "completed") {
      await DriverAvailability.findOneAndUpdate(
        { driver: req.user._id, isOnline: true },
        { $set: { status: "online" } }
      );
      await creditRideEarningsIfNeeded(rideRequest);
    }

    const populated = await populateDriverRequestQuery(RideRequest.findById(rideRequest._id));

    res.json({ message: "Ride progress updated successfully.", rideRequest: populated });
  } catch (err) {
    next(err);
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
      const plainItem = item.toObject?.() ?? item;
      if (String(item.driver) === String(req.user._id) && item.status === "pending") {
        return { ...plainItem, status: "rejected", respondedAt: new Date() };
      }
      return plainItem;
    });

    if (!(rideRequest.rejectedByDrivers || []).some((driverId) => String(driverId) === String(req.user._id))) {
      rideRequest.rejectedByDrivers.push(req.user._id);
    }

    await rideRequest.save();
    await matchDriversForRideRequest(rideRequest._id);

    const refreshed = await populateDriverRequestQuery(RideRequest.findById(id));

    res.json({ message: "Ride request rejected.", rideRequest: refreshed });
  } catch (err) {
    next(err);
  }
}

export async function cancelAcceptedRide(req, res, next) {
  try {
    const { id } = req.params;

    const rideRequest = await RideRequest.findOne({
      _id: id,
      acceptedBy: req.user._id,
      status: { $in: ["accepted", "started"] }
    });

    if (!rideRequest) {
      return res.status(404).json({ message: "Accepted ride not found for this driver." });
    }

    rideRequest.status = "cancelled";
    rideRequest.matchingStatus = "expired";
    rideRequest.driverJourneyStep = "cancelled";
    rideRequest.driverJourneyUpdatedAt = new Date();
    rideRequest.cancelledAt = new Date();
    rideRequest.cancelledBy = "driver";
    await rideRequest.save();

    await DriverAvailability.findOneAndUpdate(
      { driver: req.user._id, isOnline: true },
      { $set: { status: "online" } }
    );

    const populated = await populateDriverRequestQuery(RideRequest.findById(rideRequest._id));
    res.json({ message: "Ride cancelled successfully.", rideRequest: populated });
  } catch (err) {
    next(err);
  }
}

export async function getAcceptedDriverRequests(req, res, next) {
  try {
    const rideRequests = await populateDriverRequestQuery(
      RideRequest.find({ acceptedBy: req.user._id }).sort({ acceptedAt: -1, createdAt: -1 })
    );

    res.json({ rideRequests });
  } catch (err) {
    next(err);
  }
}