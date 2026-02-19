import Ride from "../../models/rides/Ride.js";
import Vehicle from "../../models/vehicles/Vehicle.js";

function isFuture(d) {
  return new Date(d).getTime() > Date.now();
}

export async function listRides(req, res, next) {
  try {
    const rides = await Ride.find({ driver: req.user._id })
      .populate("vehicle", "type plateNumber seatCapacity")
      .sort({ createdAt: -1 });
    res.json({ rides });
  } catch (err) {
    next(err);
  }
}

export async function createRide(req, res, next) {
  try {
    const { vehicleId, origin, destination, departureTime, pricePerSeat, totalSeats } = req.body;

    if (!vehicleId || !origin?.label || !destination?.label || !departureTime) {
      return res.status(400).json({ message: "vehicleId, origin, destination, departureTime required." });
    }

    const vehicle = await Vehicle.findOne({ _id: vehicleId, driver: req.user._id });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found." });

    const seats = Number(totalSeats);
    if (!Number.isFinite(seats) || seats < 1) return res.status(400).json({ message: "Invalid totalSeats." });
    if (seats > vehicle.seatCapacity) return res.status(400).json({ message: "Seats exceed vehicle capacity." });

    const dep = new Date(departureTime);
    if (!isFuture(dep)) return res.status(400).json({ message: "departureTime must be in the future." });

    const ride = await Ride.create({
      driver: req.user._id,
      vehicle: vehicle._id,
      origin,
      destination,
      departureTime: dep,
      pricePerSeat: Number(pricePerSeat || 0),
      totalSeats: seats,
      bookedSeats: 0,
      availableSeats: seats,
      status: "pending"
    });

    const populated = await Ride.findById(ride._id).populate("vehicle", "type plateNumber seatCapacity");
    res.status(201).json({ ride: populated });
  } catch (err) {
    next(err);
  }
}

export async function updateRide(req, res, next) {
  try {
    const { id } = req.params;
    const ride = await Ride.findOne({ _id: id, driver: req.user._id }).populate("vehicle", "seatCapacity");
    if (!ride) return res.status(404).json({ message: "Ride not found." });

    if (ride.status !== "pending") return res.status(400).json({ message: "Edit allowed only while Pending." });
    if (!isFuture(ride.departureTime)) return res.status(400).json({ message: "Edit allowed only before departure." });

    const { origin, destination, departureTime, pricePerSeat, totalSeats } = req.body;

    if (origin?.label) ride.origin = origin;
    if (destination?.label) ride.destination = destination;

    if (departureTime) {
      const dep = new Date(departureTime);
      if (!isFuture(dep)) return res.status(400).json({ message: "departureTime must be in the future." });
      ride.departureTime = dep;
    }

    if (pricePerSeat !== undefined) ride.pricePerSeat = Number(pricePerSeat);

    if (totalSeats !== undefined) {
      const seats = Number(totalSeats);
      if (!Number.isFinite(seats) || seats < 1) return res.status(400).json({ message: "Invalid totalSeats." });
      if (seats > ride.vehicle.seatCapacity) return res.status(400).json({ message: "Seats exceed vehicle capacity." });
      if (seats < ride.bookedSeats) return res.status(400).json({ message: "totalSeats < bookedSeats not allowed." });
      ride.totalSeats = seats;
      ride.availableSeats = seats - ride.bookedSeats;
    }

    await ride.save();
    const populated = await Ride.findById(ride._id).populate("vehicle", "type plateNumber seatCapacity");
    res.json({ ride: populated });
  } catch (err) {
    next(err);
  }
}

export async function deleteRide(req, res, next) {
  try {
    const { id } = req.params;
    const ride = await Ride.findOne({ _id: id, driver: req.user._id });
    if (!ride) return res.status(404).json({ message: "Ride not found." });

    if (ride.bookedSeats > 0) return res.status(400).json({ message: "Cannot delete ride with booked seats." });
    if (ride.status !== "pending") return res.status(400).json({ message: "Only pending rides can be deleted." });
    if (!isFuture(ride.departureTime)) return res.status(400).json({ message: "Cannot delete after departure." });

    await ride.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function setRideStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "ongoing", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const ride = await Ride.findOne({ _id: id, driver: req.user._id });
    if (!ride) return res.status(404).json({ message: "Ride not found." });

    const allowed = {
      pending: ["ongoing", "cancelled"],
      ongoing: ["completed", "cancelled"],
      completed: [],
      cancelled: []
    };

    if (!allowed[ride.status].includes(status)) {
      return res.status(400).json({ message: `Invalid transition: ${ride.status} → ${status}` });
    }

    ride.status = status;
    await ride.save();
    res.json({ ride });
  } catch (err) {
    next(err);
  }
}

export async function bookOneSeat(req, res, next) {
  try {
    const { id } = req.params;
    const ride = await Ride.findOne({ _id: id, driver: req.user._id });
    if (!ride) return res.status(404).json({ message: "Ride not found." });

    if (ride.status !== "pending") return res.status(400).json({ message: "Booking allowed only while Pending." });
    if (ride.availableSeats <= 0) return res.status(400).json({ message: "No seats left." });

    ride.bookedSeats += 1;
    ride.availableSeats = ride.totalSeats - ride.bookedSeats;

    await ride.save();
    res.json({ ride });
  } catch (err) {
    next(err);
  }
}

export async function history(req, res, next) {
  try {
    const rides = await Ride.find({
      driver: req.user._id,
      status: { $in: ["completed", "cancelled"] }
    })
      .populate("vehicle", "type plateNumber seatCapacity")
      .sort({ departureTime: -1 });

    res.json({ rides });
  } catch (err) {
    next(err);
  }
}

export async function earningsSummary(req, res, next) {
  try {
    const completed = await Ride.find({ driver: req.user._id, status: "completed" });

    let totalEarnings = 0;
    const items = completed.map((r) => {
      const earnings = (r.bookedSeats || 0) * (r.pricePerSeat || 0);
      totalEarnings += earnings;
      return {
        rideId: r._id,
        departureTime: r.departureTime,
        from: r.origin?.label,
        to: r.destination?.label,
        bookedSeats: r.bookedSeats,
        pricePerSeat: r.pricePerSeat,
        earnings
      };
    });

    res.json({ totalEarnings, totalCompletedRides: completed.length, items });
  } catch (err) {
    next(err);
  }
}
