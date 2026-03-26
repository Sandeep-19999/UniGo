import Booking from "../../models/rides/Booking.js";
import Ride from "../../models/rides/Ride.js";
import mongoose from "mongoose";

export async function createBooking(req, res, next) {
  try {
    const { rideId, seatsBooked, notes } = req.body;

    if (!rideId) {
      return res.status(400).json({ message: "rideId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(rideId)) {
      return res.status(400).json({ message: "rideId must be a valid ObjectId" });
    }

    if (seatsBooked === undefined || seatsBooked === null) {
      return res.status(400).json({ message: "seatsBooked is required" });
    }

    if (!Number.isInteger(seatsBooked)) {
      return res.status(400).json({ message: "seatsBooked must be an integer" });
    }

    if (seatsBooked < 1) {
      return res.status(400).json({ message: "seatsBooked must be at least 1" });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.status !== "pending") {
      return res
        .status(400)
        .json({ message: `Cannot book ride with status: ${ride.status}` });
    }

    if (ride.availableSeats < seatsBooked) {
      return res.status(400).json({
        message: `Not enough seats available. Available: ${ride.availableSeats}, Requested: ${seatsBooked}`
      });
    }

    const totalPrice = Number(ride.pricePerSeat || 0) * seatsBooked;

    const booking = await Booking.create({
      passenger: req.user._id,
      ride: rideId,
      seatsBooked,
      totalPrice,
      notes: notes ? notes.trim() : ""
    });

    ride.bookedSeats += seatsBooked;
    ride.availableSeats = ride.totalSeats - ride.bookedSeats;
    await ride.save();

    await booking.populate([
      { path: "passenger", select: "name email" },
      {
        path: "ride",
        populate: [
          { path: "driver", select: "name email" },
          { path: "vehicle", select: "type plateNumber seatCapacity" }
        ]
      }
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
      .populate("ride", { path: "driver", select: "name email" })
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
        { path: "passenger", select: "name email" },
        {
          path: "ride",
          select: "origin destination departureTime pricePerSeat status",
          populate: [
            { path: "driver", select: "name email" },
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
      { path: "passenger", select: "name email" },
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

    const booking = await Booking.findOne({ _id: id, passenger: req.user._id }).populate("ride");

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

    if (booking.ride) {
      booking.ride.bookedSeats = Math.max(0, booking.ride.bookedSeats - booking.seatsBooked);
      booking.ride.availableSeats = booking.ride.totalSeats - booking.ride.bookedSeats;
      await booking.ride.save();
    }

    await booking.populate([
      { path: "passenger", select: "name email" },
      { path: "ride" }
    ]);

    res.json({ message: "Booking cancelled", booking });
  } catch (err) {
    next(err);
  }
}