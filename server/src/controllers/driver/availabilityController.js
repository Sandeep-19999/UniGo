import Vehicle from "../../models/vehicles/Vehicle.js";
import DriverAvailability from "../../models/drivers/DriverAvailability.js";
import { buildDriverOnboardingSummary } from "../../services/onboardingService.js";
import {
  toGeoPoint,
  normalizeLatLng,
  rematchPendingRideRequestsForDriver,
  expireDriverPendingMatches
} from "../../services/matchingService.js";

async function resolveVehicleForDriver(driverId, vehicleId) {
  if (vehicleId) {
    return Vehicle.findOne({ _id: vehicleId, driver: driverId });
  }

  return Vehicle.findOne({ driver: driverId }).sort({ isPrimary: -1, createdAt: -1 });
}

export async function getMyAvailability(req, res, next) {
  try {
    const availability = await DriverAvailability.findOne({ driver: req.user._id }).populate(
      "vehicle",
      "type plateNumber seatCapacity make model year"
    );

    res.json({ availability });
  } catch (err) {
    next(err);
  }
}

export async function goOnline(req, res, next) {
  try {
    const onboarding = await buildDriverOnboardingSummary(req.user._id);
    if (!onboarding.canAccessDashboard) {
      return res.status(403).json({
        message: "Complete and verify all required onboarding steps before going online.",
        onboarding
      });
    }

    const {
      vehicleId,
      currentLocation,
      destination,
      destinationLabel,
      seatsAvailable,
      maxPickupDistanceKm,
      maxDestinationDistanceKm,
      notes
    } = req.body;

    const normalizedCurrentLocation = normalizeLatLng(currentLocation);
    if (!normalizedCurrentLocation) {
      return res.status(400).json({ message: "currentLocation with valid lat/lng is required." });
    }

    const vehicle = await resolveVehicleForDriver(req.user._id, vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found for driver." });
    }

    const capacity = Number.isFinite(Number(seatsAvailable)) ? Number(seatsAvailable) : vehicle.seatCapacity;

    const availability = await DriverAvailability.findOneAndUpdate(
      { driver: req.user._id },
      {
        $set: {
          vehicle: vehicle._id,
          vehicleType: vehicle.type,
          seatsAvailable: capacity,
          maxPickupDistanceKm: Number(maxPickupDistanceKm || 8),
          maxDestinationDistanceKm: Number(maxDestinationDistanceKm || 10),
          currentLocation: toGeoPoint(normalizedCurrentLocation),
          destination: destination ? toGeoPoint(destination) : null,
          destinationLabel: String(destinationLabel || "").trim(),
          isOnline: true,
          status: "online",
          notes: String(notes || "").trim(),
          lastLocationAt: new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate("vehicle", "type plateNumber seatCapacity make model year");

    await rematchPendingRideRequestsForDriver(req.user._id);

    res.json({ message: "Driver is now online.", availability });
  } catch (err) {
    next(err);
  }
}

export async function updateAvailabilityLocation(req, res, next) {
  try {
    const { currentLocation, destination, destinationLabel, seatsAvailable } = req.body;
    const availability = await DriverAvailability.findOne({ driver: req.user._id, isOnline: true });

    if (!availability) {
      return res.status(404).json({ message: "Driver is not currently online." });
    }

    const normalizedCurrentLocation = normalizeLatLng(currentLocation);
    if (!normalizedCurrentLocation) {
      return res.status(400).json({ message: "currentLocation with valid lat/lng is required." });
    }

    availability.currentLocation = toGeoPoint(normalizedCurrentLocation);
    availability.lastLocationAt = new Date();

    if (destination !== undefined) {
      availability.destination = destination ? toGeoPoint(destination) : null;
    }
    if (destinationLabel !== undefined) {
      availability.destinationLabel = String(destinationLabel || "").trim();
    }
    if (seatsAvailable !== undefined) {
      availability.seatsAvailable = Number(seatsAvailable);
    }

    await availability.save();
    await rematchPendingRideRequestsForDriver(req.user._id);

    res.json({ message: "Driver live location updated.", availability });
  } catch (err) {
    next(err);
  }
}

export async function goOffline(req, res, next) {
  try {
    const availability = await DriverAvailability.findOneAndUpdate(
      { driver: req.user._id },
      {
        $set: {
          isOnline: false,
          status: "offline"
        }
      },
      { new: true }
    );

    await expireDriverPendingMatches(req.user._id);

    res.json({ message: "Driver is now offline.", availability });
  } catch (err) {
    next(err);
  }
}
