import RideRequest from "../../models/rides/RideRequest.js";
import Ride from "../../models/rides/Ride.js";
import { matchDriversForRideRequest, normalizeLatLng } from "../../services/matchingService.js";

export async function browseAvailableRides(req, res, next) {
  try {
    const rides = await Ride.find({ status: "pending", availableSeats: { $gt: 0 } })
      .populate("driver", "name email phone")
      .populate("vehicle", "type plateNumber seatCapacity make model year")
      .sort({ departureTime: 1 });

    res.json({ rides });
  } catch (err) {
    next(err);
  }
}

export async function createRideRequest(req, res, next) {
  try {
    const {
      pickupLocation,
      dropLocation,
      pickupCoords,
      dropCoords,
      numberOfSeats,
      vehicleType,
      paymentMethod,
      notes,
      distanceKm,
      timeMin,
      estimatedFare
    } = req.body;

    if (!pickupLocation || !pickupLocation.trim()) {
      return res.status(400).json({ message: "Pickup location is required" });
    }
    if (pickupLocation.trim().length < 3) {
      return res.status(400).json({ message: "Pickup location must be at least 3 characters" });
    }

    if (!dropLocation || !dropLocation.trim()) {
      return res.status(400).json({ message: "Drop location is required" });
    }
    if (dropLocation.trim().length < 3) {
      return res.status(400).json({ message: "Drop location must be at least 3 characters" });
    }
    if (pickupLocation.trim().toLowerCase() === dropLocation.trim().toLowerCase()) {
      return res.status(400).json({ message: "Drop location must be different from pickup location" });
    }

    if (numberOfSeats === undefined || numberOfSeats === null) {
      return res.status(400).json({ message: "Number of seats is required" });
    }
    if (!Number.isInteger(numberOfSeats)) {
      return res.status(400).json({ message: "Number of seats must be an integer" });
    }
    if (numberOfSeats < 0 || numberOfSeats > 3) {
      return res.status(400).json({ message: "Number of seats must be 0 (any), 1 (1+), 2 (2+), or 3 (3+)" });
    }

    if (vehicleType && !["bike", "car", "van", "mini_van"].includes(vehicleType)) {
      return res.status(400).json({ message: "Vehicle type must be bike, car, van, or mini_van" });
    }

    if (paymentMethod && !["cash", "online"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Payment method must be cash or online" });
    }

    if (notes && notes.length > 300) {
      return res.status(400).json({ message: "Notes cannot exceed 300 characters" });
    }

    if (distanceKm !== undefined && (!Number.isFinite(distanceKm) || distanceKm < 0)) {
      return res.status(400).json({ message: "Distance must be a non-negative number" });
    }
    if (timeMin !== undefined && (!Number.isFinite(timeMin) || timeMin < 0)) {
      return res.status(400).json({ message: "Estimated time must be a non-negative number" });
    }
    if (estimatedFare !== undefined && (!Number.isFinite(estimatedFare) || estimatedFare < 0)) {
      return res.status(400).json({ message: "Estimated fare must be a non-negative number" });
    }

    const rideRequest = await RideRequest.create({
      passenger: req.user._id,
      pickupLocation: pickupLocation.trim(),
      dropLocation: dropLocation.trim(),
      pickupCoords: normalizeLatLng(pickupCoords),
      dropCoords: normalizeLatLng(dropCoords),
      numberOfSeats,
      vehicleType: vehicleType || "car",
      paymentMethod: paymentMethod || "cash",
      notes: notes ? notes.trim() : "",
      distanceKm: Number((distanceKm || 0).toFixed(2)),
      timeMin: Math.round(timeMin || 0),
      estimatedFare: Number((estimatedFare || 0).toFixed(2)),
      estimatedPrice: Number((estimatedFare || 0).toFixed(2))
    });

    await matchDriversForRideRequest(rideRequest._id);

    const populatedRideRequest = await RideRequest.findById(rideRequest._id)
      .populate("passenger", "name email phone")
      .populate("acceptedBy", "name email phone")
      .populate("acceptedVehicle", "type plateNumber make model year");

    res.status(201).json({
      message: "Ride request created successfully",
      rideRequest: populatedRideRequest
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyRideRequests(req, res, next) {
  try {
    const rideRequests = await RideRequest.find({ passenger: req.user._id })
      .populate("acceptedBy", "name email phone")
      .populate("acceptedVehicle", "type plateNumber make model year")
      .sort({ createdAt: -1 });

    res.json({ rideRequests });
  } catch (err) {
    next(err);
  }
}

export async function getRideRequestById(req, res, next) {
  try {
    const { id } = req.params;
    const rideRequest = await RideRequest.findOne({ _id: id, passenger: req.user._id })
      .populate("passenger", "name email phone")
      .populate("acceptedBy", "name email phone")
      .populate("acceptedVehicle", "type plateNumber make model year")
      .populate("matchedDrivers.driver", "name email phone");

    if (!rideRequest) {
      return res.status(404).json({ message: "Ride request not found" });
    }

    res.json({ rideRequest });
  } catch (err) {
    next(err);
  }
}

export async function cancelRideRequest(req, res, next) {
  try {
    const { id } = req.params;
    const rideRequest = await RideRequest.findOne({ _id: id, passenger: req.user._id });

    if (!rideRequest) {
      return res.status(404).json({ message: "Ride request not found" });
    }

    if (rideRequest.status === "completed") {
      return res.status(400).json({ message: "Cannot cancel a completed ride" });
    }

    if (rideRequest.status === "cancelled") {
      return res.status(400).json({ message: "Ride is already cancelled" });
    }

    rideRequest.status = "cancelled";
    rideRequest.matchingStatus = "expired";
    await rideRequest.save();
    await rideRequest.populate("acceptedBy", "name email phone");

    res.json({ message: "Ride request cancelled", rideRequest });
  } catch (err) {
    next(err);
  }
}
