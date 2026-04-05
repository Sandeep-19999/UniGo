import mongoose from "mongoose";
import RideRequest from "../models/rides/RideRequest.js";
import DriverAvailability from "../models/drivers/DriverAvailability.js";

function normalizeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function normalizeDestinationText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeLatLng(input) {
  if (!input) return null;

  const lat = normalizeNumber(input.lat ?? input.latitude ?? input.coordinates?.[1]);
  const lng = normalizeNumber(input.lng ?? input.longitude ?? input.coordinates?.[0]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
}

export function toGeoPoint(input) {
  const point = normalizeLatLng(input);
  if (!point) return null;
  return {
    type: "Point",
    coordinates: [point.lng, point.lat]
  };
}

function haversineKm(a, b) {
  if (!a || !b) return Number.POSITIVE_INFINITY;

  const lat1 = Number(a.lat);
  const lon1 = Number(a.lng);
  const lat2 = Number(b.lat);
  const lon2 = Number(b.lng);

  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function pointFromGeo(geoPoint) {
  if (!geoPoint?.coordinates?.length) return null;
  return { lng: geoPoint.coordinates[0], lat: geoPoint.coordinates[1] };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function computeScore({ pickupDistanceKm }) {
  return Math.round(clamp(100 - pickupDistanceKm * 7, 10, 100));
}

function requestedSeatCount(numberOfSeats) {
  if (!Number.isFinite(numberOfSeats) || numberOfSeats <= 0) return 1;
  return numberOfSeats;
}

export async function matchDriversForRideRequest(rideRequestId, { session } = {}) {
  const rideRequest = await RideRequest.findById(rideRequestId).session(session || null);
  if (!rideRequest || rideRequest.status !== "pending" || rideRequest.acceptedBy) {
    return null;
  }

  const pickup = normalizeLatLng(rideRequest.pickupCoords);
  const seatsNeeded = requestedSeatCount(rideRequest.numberOfSeats);
  const normalizedDropLocation = normalizeDestinationText(rideRequest.dropLocation);

  const availabilityQuery = {
    isOnline: true,
    status: { $in: ["online", "matched"] },
    seatsAvailable: { $gte: seatsNeeded },
    destinationLabelNormalized: normalizedDropLocation
  };

  if (rideRequest.vehicleType) {
    availabilityQuery.vehicleType = rideRequest.vehicleType;
  }

  const availabilities = await DriverAvailability.find(availabilityQuery)
    .populate("vehicle", "type plateNumber seatCapacity make model year")
    .session(session || null);

  const rejectedDriverIds = new Set((rideRequest.rejectedByDrivers || []).map((id) => String(id)));
  const candidates = [];

  for (const availability of availabilities) {
    const driverId = String(availability.driver);
    if (rejectedDriverIds.has(driverId)) continue;

    const driverPoint = pointFromGeo(availability.currentLocation);
    const pickupDistanceKm = pickup ? haversineKm(driverPoint, pickup) : 0;

    candidates.push({
      driver: availability.driver,
      vehicle: availability.vehicle?._id || availability.vehicle || null,
      availability: availability._id,
      pickupDistanceKm: Number.isFinite(pickupDistanceKm) ? Number(pickupDistanceKm.toFixed(2)) : 0,
      destinationDistanceKm: 0,
      score: computeScore({ pickupDistanceKm }),
      matchedAt: new Date(),
      status: "pending"
    });
  }

  candidates.sort((a, b) => b.score - a.score || a.pickupDistanceKm - b.pickupDistanceKm);
  const topCandidates = candidates.slice(0, 5);

  const existingByDriver = new Map(
    (rideRequest.matchedDrivers || []).map((item) => [String(item.driver), item])
  );

  rideRequest.matchedDrivers = topCandidates.map((candidate) => {
    const existing = existingByDriver.get(String(candidate.driver));
    return {
      ...candidate,
      status: existing?.status === "rejected" ? "rejected" : candidate.status,
      respondedAt: existing?.respondedAt || null,
      matchedAt: existing?.matchedAt || candidate.matchedAt
    };
  });

  rideRequest.matchingStatus = rideRequest.matchedDrivers.length ? "matched" : "unmatched";
  await rideRequest.save({ session });

  return rideRequest;
}

export async function rematchPendingRideRequestsForDriver(driverId) {
  const pendingRequests = await RideRequest.find({
    status: "pending",
    acceptedBy: null,
    rejectedByDrivers: { $ne: new mongoose.Types.ObjectId(driverId) }
  }).select("_id");

  for (const request of pendingRequests) {
    await matchDriversForRideRequest(request._id);
  }
}

export async function expireDriverPendingMatches(driverId) {
  await RideRequest.updateMany(
    {
      status: "pending",
      "matchedDrivers.driver": driverId,
      "matchedDrivers.status": "pending"
    },
    {
      $set: {
        "matchedDrivers.$[elem].status": "expired",
        "matchedDrivers.$[elem].respondedAt": new Date()
      }
    },
    {
      arrayFilters: [{ "elem.driver": new mongoose.Types.ObjectId(driverId), "elem.status": "pending" }]
    }
  );
}