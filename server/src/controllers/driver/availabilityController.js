import Vehicle from "../../models/vehicles/Vehicle.js";
import DriverAvailability from "../../models/drivers/DriverAvailability.js";
import DriverProfile from "../../models/drivers/DriverProfile.js";
import RideRequest from "../../models/rides/RideRequest.js";
import { buildDriverOnboardingSummary } from "../../services/onboardingService.js";
import {
  toGeoPoint,
  normalizeLatLng,
  normalizeDestinationText,
  rematchPendingRideRequestsForDriver,
  expireDriverPendingMatches
} from "../../services/matchingService.js";

async function resolveVehicleForDriver(driverId, vehicleId) {
  if (vehicleId) {
    return Vehicle.findOne({ _id: vehicleId, driver: driverId });
  }

  return Vehicle.findOne({ driver: driverId }).sort({ isPrimary: -1, createdAt: -1 });
}

function serializeProfile(profile) {
  return profile
    ? {
        driverCurrentDestination: profile.driverCurrentDestination || "",
        driverCurrentDestinationUpdatedAt: profile.driverCurrentDestinationUpdatedAt || null
      }
    : {
        driverCurrentDestination: "",
        driverCurrentDestinationUpdatedAt: null
      };
}

export async function getMyAvailability(req, res, next) {
  try {
    const [availability, profile] = await Promise.all([
      DriverAvailability.findOne({ driver: req.user._id }).populate(
        "vehicle",
        "type plateNumber seatCapacity make model year"
      ),
      DriverProfile.findOne({ user: req.user._id }).select(
        "driverCurrentDestination driverCurrentDestinationUpdatedAt"
      )
    ]);

    res.json({ availability, profile: serializeProfile(profile) });
  } catch (err) {
    next(err);
  }
}

export async function saveDriverDestination(req, res, next) {
  try {
    const destinationLabel = String(req.body?.destinationLabel || "").trim();

    if (destinationLabel.length < 3) {
      return res.status(400).json({ message: "Destination must be at least 3 characters long." });
    }

    const normalizedDestination = normalizeDestinationText(destinationLabel);

    const profile = await DriverProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          driverCurrentDestination: destinationLabel,
          driverCurrentDestinationNormalized: normalizedDestination,
          driverCurrentDestinationUpdatedAt: new Date()
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const availability = await DriverAvailability.findOne({ driver: req.user._id });
    if (availability) {
      availability.destinationLabel = destinationLabel;
      availability.destinationLabelNormalized = normalizedDestination;
      await availability.save();

      if (availability.isOnline) {
        await rematchPendingRideRequestsForDriver(req.user._id);
      }
    }

    res.json({
      message: "Driver destination saved successfully.",
      profile: serializeProfile(profile),
      availability
    });
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

    const { vehicleId, currentLocation, seatsAvailable, maxPickupDistanceKm, maxDestinationDistanceKm, notes } = req.body;

    const normalizedCurrentLocation = normalizeLatLng(currentLocation);
    if (!normalizedCurrentLocation) {
      return res.status(400).json({ message: "currentLocation with valid lat/lng is required." });
    }

    const profile = await DriverProfile.findOne({ user: req.user._id });
    const savedDestination = String(profile?.driverCurrentDestination || "").trim();
    const normalizedDestination = normalizeDestinationText(savedDestination);

    if (savedDestination.length < 3 || !normalizedDestination) {
      return res.status(400).json({
        message: "Save your current destination before going online."
      });
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
          destination: null,
          destinationLabel: savedDestination,
          destinationLabelNormalized: normalizedDestination,
          isOnline: true,
          status: "online",
          notes: String(notes || "").trim(),
          lastLocationAt: new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate("vehicle", "type plateNumber seatCapacity make model year");

    await rematchPendingRideRequestsForDriver(req.user._id);

    res.json({
      message: "Driver is now online.",
      availability,
      profile: serializeProfile(profile)
    });
  } catch (err) {
    next(err);
  }
}

export async function updateAvailabilityLocation(req, res, next) {
  try {
    const { currentLocation, seatsAvailable } = req.body;
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
    const activeRide = await RideRequest.findOne({
      acceptedBy: req.user._id,
      status: { $in: ["accepted", "started"] }
    }).select("_id status driverJourneyStep");

    if (activeRide) {
      return res.status(400).json({
        message: "Complete the active ride before going offline.",
        activeRideId: activeRide._id
      });
    }

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