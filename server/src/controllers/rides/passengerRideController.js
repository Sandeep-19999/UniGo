import RideRequest from "../../models/rides/RideRequest.js";
import Ride from "../../models/rides/Ride.js";
import DriverAvailability from "../../models/drivers/DriverAvailability.js";
import { matchDriversForRideRequest, normalizeLatLng } from "../../services/matchingService.js";

// Helper function to calculate distance between two points using Haversine formula
function haversineKm(point1, point2) {
  if (!point1 || !point2) return Number.POSITIVE_INFINITY;

  const lat1 = Number(point1.lat);
  const lon1 = Number(point1.lng);
  const lat2 = Number(point2.lat);
  const lon2 = Number(point2.lng);

  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function browseAvailableRides(req, res, next) {
  try {
    const { lat, lng, radiusKm, dropLocation } = req.query;

    // Get all available rides with FUTURE departure times only
    // Filter: status is pending, has available seats, AND departure time is in the future
    const now = new Date();
    const rides = await Ride.find({
      status: "pending",
      availableSeats: { $gt: 0 },
      departureTime: { $gte: now } // Only future departures
    })
      .populate("driver", "name email phone rating")
      .populate("vehicle", "type plateNumber seatCapacity make model year")
      .sort({ departureTime: 1 }); // Sort by earliest departure first

    // Location filtering - prioritize by coordinates, then by text location
    if (lat && lng) {
      // Coordinate-based filtering with distance calculation
      const dropCoords = normalizeLatLng({ lat: parseFloat(lat), lng: parseFloat(lng) });
      const radius = radiusKm ? Math.max(1, Math.min(parseFloat(radiusKm), 50)) : 10; // Default 10km, max 50km

      if (dropCoords) {
        // Filter rides based on distance to destination
        const filteredRides = rides
          .filter((ride) => {
            if (ride.destination && ride.destination.lat && ride.destination.lng) {
              const destCoords = { lat: ride.destination.lat, lng: ride.destination.lng };
              const distance = haversineKm(dropCoords, destCoords);
              return distance <= radius;
            }
            return false;
          })
          // Sort by distance (nearest first)
          .sort((rideA, rideB) => {
            const distA = haversineKm(dropCoords, {
              lat: rideA.destination.lat,
              lng: rideA.destination.lng
            });
            const distB = haversineKm(dropCoords, {
              lat: rideB.destination.lat,
              lng: rideB.destination.lng
            });
            return distA - distB;
          });

        res.json({ 
          rides: filteredRides, 
          filterApplied: true, 
          radiusKm: radius,
          currentTime: now.toISOString()
        });
      } else {
        res.json({ 
          rides, 
          filterApplied: false,
          currentTime: now.toISOString()
        });
      }
    } else if (dropLocation) {
      // Text-based location filtering
      const locationText = String(dropLocation).toLowerCase().trim();

      const filteredRides = rides.filter((ride) => {
        // Check if destination label contains the search location
        const destLabel = ride.destination?.label?.toLowerCase() || "";
        if (destLabel.includes(locationText)) {
          return true;
        }

        // Also check if the first part (city/area) matches
        const locations = [
          ride.destination?.label?.toLowerCase() || "",
          ride.origin?.label?.toLowerCase() || "",
        ];

        return locations.some((loc) => loc.includes(locationText.split(",")[0]));
      });

      res.json({ 
        rides: filteredRides, 
        filterApplied: true, 
        filterType: "location",
        currentTime: now.toISOString()
      });
    } else {
      // No filtering - return all rides
      res.json({ 
        rides, 
        filterApplied: false,
        currentTime: now.toISOString()
      });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Get matching drivers for a passenger's selected drop location
 * Filters by coordinates (priority) or text location
 * Excludes drivers with past departure times
 */
export async function getMatchingDrivers(req, res, next) {
  try {
    const { lat, lng, radiusKm, dropLocation } = req.query;

    // Get all available rides with FUTURE departure times only
    const now = new Date();
    const rides = await Ride.find({
      status: "pending",
      availableSeats: { $gt: 0 },
      departureTime: { $gte: now } // Only future departures
    })
      .populate("driver", "name email phone rating")
      .populate("vehicle", "type plateNumber seatCapacity make model year")
      .sort({ departureTime: 1 }); // Sort by earliest departure first

    let matchedRides = [];

    // Coordinate-based filtering (priority)
    if (lat && lng) {
      const dropCoords = normalizeLatLng({ lat: parseFloat(lat), lng: parseFloat(lng) });
      const radius = radiusKm ? Math.max(1, Math.min(parseFloat(radiusKm), 50)) : 10;

      if (dropCoords) {
        // Filter rides within radius of destination
        matchedRides = rides
          .filter((ride) => {
            if (ride.destination && ride.destination.lat && ride.destination.lng) {
              const destCoords = { lat: ride.destination.lat, lng: ride.destination.lng };
              const distance = haversineKm(dropCoords, destCoords);
              return distance <= radius;
            }
            return false;
          })
          // Sort by distance (nearest first)
          .sort((rideA, rideB) => {
            const distA = haversineKm(dropCoords, {
              lat: rideA.destination.lat,
              lng: rideA.destination.lng
            });
            const distB = haversineKm(dropCoords, {
              lat: rideB.destination.lat,
              lng: rideB.destination.lng
            });
            return distA - distB;
          });
      }
    }
    // Text-based filtering (fallback)
    else if (dropLocation) {
      const locationText = String(dropLocation).toLowerCase().trim();

      matchedRides = rides.filter((ride) => {
        // Check destination label
        const destLabel = ride.destination?.label?.toLowerCase() || "";
        if (destLabel.includes(locationText)) return true;

        // Check if city/area matches
        const locationParts = locationText.split(",")[0];
        return destLabel.includes(locationParts);
      });
    }

    res.json({
      rides: matchedRides,
      filterApplied: !!(lat && lng) || !!dropLocation,
      filterType: lat && lng ? "coordinates" : "text",
      currentTime: now.toISOString(),
      pastDriversExcluded: true
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all available drivers/rides (no location filtering)
 * Excludes drivers with past departure times
 */
export async function getAvailableDrivers(req, res, next) {
  try {
    // Get all available rides with FUTURE departure times only
    const now = new Date();
    const rides = await Ride.find({
      status: "pending",
      availableSeats: { $gt: 0 },
      departureTime: { $gte: now } // Only future departures
    })
      .populate("driver", "name email phone rating")
      .populate("vehicle", "type plateNumber seatCapacity make model year")
      .sort({ departureTime: 1 }); // Sort by earliest departure first

    res.json({
      rides,
      filterApplied: false,
      totalCount: rides.length,
      currentTime: now.toISOString(),
      pastDriversExcluded: true
    });
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

export async function updatePassengerRideLocation(req, res, next) {
  try {
    const { id } = req.params;
    const raw = req.body?.currentLocation || {};
    const coords = normalizeLatLng(raw);

    if (!coords) {
      return res.status(400).json({ message: "Valid currentLocation with lat/lng is required." });
    }

    const rideRequest = await RideRequest.findOne({
      _id: id,
      passenger: req.user._id,
      status: { $in: ["pending", "accepted", "started"] }
    });

    if (!rideRequest) {
      return res.status(404).json({ message: "Active ride request not found for this passenger." });
    }

    rideRequest.passengerLiveLocation = coords;
    rideRequest.passengerLiveLocationUpdatedAt = new Date();
    await rideRequest.save();

    res.json({
      message: "Passenger live location updated successfully.",
      rideRequest
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
    rideRequest.cancelledAt = new Date();
    rideRequest.cancelledBy = "passenger";
    await rideRequest.save();
    await rideRequest.populate("acceptedBy", "name email phone");

    res.json({ message: "Ride request cancelled", rideRequest });
  } catch (err) {
    next(err);
  }
}

export async function getRideTracking(req, res, next) {
  try {
    const { id } = req.params;

    const rideRequest = await RideRequest.findOne({
      _id: id,
      passenger: req.user._id,
      status: { $in: ["accepted", "started"] }
    })
      .populate("acceptedBy", "name email phone")
      .populate("acceptedVehicle", "type plateNumber make model year");

    if (!rideRequest) {
      return res.status(404).json({ message: "Active ride request not found" });
    }

    if (!rideRequest.acceptedBy) {
      return res.status(400).json({ message: "No driver has accepted this ride yet" });
    }

    const driverAvailability = await DriverAvailability.findOne({
      driver: rideRequest.acceptedBy._id
    });

    const driverLat = driverAvailability?.currentLocation?.coordinates?.[1];
    const driverLng = driverAvailability?.currentLocation?.coordinates?.[0];

    const passengerLat = rideRequest.passengerLiveLocation?.lat;
    const passengerLng = rideRequest.passengerLiveLocation?.lng;

    res.json({
      bookingId: rideRequest._id,
      status: rideRequest.status,
      driver: {
        id: rideRequest.acceptedBy._id,
        name: rideRequest.acceptedBy.name,
        phone: rideRequest.acceptedBy.phone,
        currentLocation: {
          lat: driverLat,
          lng: driverLng
        },
        vehicle: rideRequest.acceptedVehicle
      },
      passenger: {
        id: req.user._id,
        currentLocation: {
          lat: passengerLat,
          lng: passengerLng
        }
      },
      pickup: {
        location: rideRequest.pickupLocation,
        coords: rideRequest.pickupCoords
      },
      drop: {
        location: rideRequest.dropLocation,
        coords: rideRequest.dropCoords
      },
      lastUpdated: new Date()
    });
  } catch (err) {
    next(err);
  }
}