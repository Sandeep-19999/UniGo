import Booking from "../../models/rides/Booking.js";
import Ride from "../../models/rides/Ride.js";
import mongoose from "mongoose";

export async function createBooking(req, res, next) {
  try {
    const { rideId, seatsBooked, notes } = req.body;

    // Validate rideId exists and is a valid ObjectId
    if (!rideId) {
      return res.status(400).json({ message: "rideId is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(rideId)) {
      return res.status(400).json({ message: "rideId must be a valid ObjectId" });
    }

    // Validate seatsBooked
    if (seatsBooked === undefined || seatsBooked === null) {
      return res.status(400).json({ message: "seatsBooked is required" });
    }

    // Check if seatsBooked is a valid integer
    if (!Number.isInteger(seatsBooked)) {
      return res.status(400).json({ message: "seatsBooked must be an integer" });
    }

    // Check minimum seats
    if (seatsBooked < 1) {
      return res.status(400).json({ message: "seatsBooked must be at least 1" });
    }

    // Check if ride exists
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Check if ride has enough available seats
    if (ride.availableSeats < seatsBooked) {
      return res.status(400).json({
        message: `Not enough seats available. Available: ${ride.availableSeats}, Requested: ${seatsBooked}`
      });
    }

    // Check if seatsBooked exceeds maximum allowed (safety check)
    if (seatsBooked > ride.availableSeats) {
      return res.status(400).json({
        message: `Cannot book more than ${ride.availableSeats} seats`
      });
    }

    // Check if ride status allows booking
    if (ride.status !== "pending") {
      return res.status(400).json({ message: `Cannot book ride with status: ${ride.status}` });
    }

    // Calculate total price
    const totalPrice = ride.pricePerSeat * seatsBooked;

    // Create booking
    const booking = await Booking.create({
      passenger: req.user._id,
      ride: rideId,
      seatsBooked,
      totalPrice,
      notes: notes ? notes.trim() : ""
    });

    // Populate booking details
    await booking.populate([
      { path: "passenger", select: "name email phone" },
      { path: "ride", populate: { path: "driver vehicle" } }
    ]);

    res.status(201).json({
      message: "Booking created successfully",
      booking
    });
  } catch (err) {
    next(err);
  }
}

export async function getPassengerBookings(req, res, next) {
  try {
    const bookings = await Booking.find({ passenger: req.user._id })
      .populate("ride", "origin destination departureTime pricePerSeat status vehicle")
      .populate("ride", { path: "driver", select: "name email phone" })
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (err) {
    next(err);
  }
}

export async function getBookingById(req, res, next) {
  try {
    const { id } = req.params;

    const booking = await Booking.findOne({ _id: id, passenger: req.user._id })
      .populate([
        { path: "passenger", select: "name email phone" },
        {
          path: "ride",
          select: "origin destination departureTime pricePerSeat status",
          populate: [
            { path: "driver", select: "name email phone" },
            { path: "vehicle", select: "type plateNumber seatCapacity" }
          ]
        }
      ]);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ booking });
  } catch (err) {
    next(err);
  }
}

export async function updateBookingStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "status is required" });
    }

    const booking = await Booking.findOne({ _id: id, passenger: req.user._id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = status;
    await booking.save();

    await booking.populate([
      { path: "passenger", select: "name email phone" },
      { path: "ride" }
    ]);

    res.json({ message: "Booking updated", booking });
  } catch (err) {
    next(err);
  }
}

export async function cancelBooking(req, res, next) {
  try {
    const { id } = req.params;

    const booking = await Booking.findOne({ _id: id, passenger: req.user._id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status === "completed") {
      return res.status(400).json({ message: "Cannot cancel a completed booking" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    booking.status = "cancelled";
    await booking.save();

    await booking.populate([
      { path: "passenger", select: "name email phone" },
      { path: "ride" }
    ]);

    res.json({ message: "Booking cancelled", booking });
  } catch (err) {
    next(err);
  }
}
