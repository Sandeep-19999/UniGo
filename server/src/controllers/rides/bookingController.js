import Booking from "../../models/rides/Booking.js";
import Ride from "../../models/rides/Ride.js";

export async function createBooking(req, res, next) {
  try {
    const { rideId, seatsBooked, paymentMethod, notes } = req.body;
    const passengerId = req.user._id;

    if (!rideId || !seatsBooked || !paymentMethod) {
      return res.status(400).json({
        message: "rideId, seatsBooked, and paymentMethod are required.",
      });
    }

    const seats = Number(seatsBooked);
    if (!Number.isFinite(seats) || seats < 1) {
      return res.status(400).json({ message: "Invalid seatsBooked." });
    }

    if (!["cash", "online"].includes(paymentMethod)) {
      return res
        .status(400)
        .json({ message: "Payment method must be 'cash' or 'online'." });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found." });
    }

    if (ride.status !== "pending") {
      return res.status(400).json({
        message: "Can only book seats on pending rides.",
      });
    }

    if (seats > ride.availableSeats) {
      return res.status(400).json({
        message: `Only ${ride.availableSeats} seats available.`,
      });
    }

    // Check if passenger already has a booking on this ride
    const existingBooking = await Booking.findOne({
      passenger: passengerId,
      ride: rideId,
      status: { $ne: "cancelled" },
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "You have already booked a seat on this ride.",
      });
    }

    const totalPrice = seats * ride.pricePerSeat;

    const booking = await Booking.create({
      passenger: passengerId,
      ride: rideId,
      seatsBooked: seats,
      totalPrice,
      paymentMethod,
      notes: notes || "",
      status: "pending",
    });

    // Update ride booked seats
    ride.bookedSeats += seats;
    ride.availableSeats -= seats;
    await ride.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("passenger", "name email")
      .populate("ride");

    res.status(201).json(populatedBooking);
  } catch (err) {
    next(err);
  }
}

export async function listPassengerBookings(req, res, next) {
  try {
    const bookings = await Booking.find({ passenger: req.user._id })
      .populate({
        path: "ride",
        populate: {
          path: "vehicle",
          select: "type plateNumber seatCapacity",
        },
      })
      .populate("ride", "origin destination departureTime status pricePerSeat")
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (err) {
    next(err);
  }
}

export async function listRideBookings(req, res, next) {
  try {
    const { rideId } = req.params;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found." });
    }

    // Only driver can view their ride's bookings
    if (ride.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    const bookings = await Booking.find({
      ride: rideId,
      status: { $ne: "cancelled" },
    })
      .populate("passenger", "name email")
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (err) {
    next(err);
  }
}

export async function updateBookingStatus(req, res, next) {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required." });
    }

    if (!["pending", "confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({
        message: "Status must be 'pending', 'confirmed', or 'cancelled'.",
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    // Only passenger can cancel, only driver can confirm
    if (status === "cancelled" && booking.passenger.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Only passenger can cancel booking.",
      });
    }

    if (status === "confirmed") {
      const ride = await Ride.findById(booking.ride);
      if (ride.driver.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "Only driver can confirm booking.",
        });
      }
    }

    // Handle status transitions
    if (booking.status === "cancelled") {
      return res.status(400).json({
        message: "Cannot modify cancelled booking.",
      });
    }

    const oldStatus = booking.status;
    booking.status = status;
    await booking.save();

    // If cancelled, refund seats to ride
    if (status === "cancelled" && oldStatus !== "cancelled") {
      const ride = await Ride.findById(booking.ride);
      ride.bookedSeats -= booking.seatsBooked;
      ride.availableSeats += booking.seatsBooked;
      await ride.save();
    }

    const updatedBooking = await Booking.findById(bookingId)
      .populate("passenger", "name email")
      .populate("ride");

    res.json(updatedBooking);
  } catch (err) {
    next(err);
  }
}

export async function deleteBooking(req, res, next) {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    // Only passenger can delete their booking
    if (booking.passenger.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    // Only allow deletion if pending
    if (booking.status !== "pending") {
      return res.status(400).json({
        message: "Can only delete pending bookings.",
      });
    }

    // Refund seats to ride
    const ride = await Ride.findById(booking.ride);
    ride.bookedSeats -= booking.seatsBooked;
    ride.availableSeats += booking.seatsBooked;
    await ride.save();

    await Booking.findByIdAndDelete(bookingId);

    res.json({ message: "Booking deleted." });
  } catch (err) {
    next(err);
  }
}

export async function getBooking(req, res, next) {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate("passenger", "name email")
      .populate({
        path: "ride",
        populate: {
          path: "vehicle",
          select: "type plateNumber seatCapacity",
        },
      });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    // Only passenger or driver of the ride can view
    if (
      booking.passenger._id.toString() !== req.user._id.toString() &&
      booking.ride.driver.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    res.json(booking);
  } catch (err) {
    next(err);
  }
}
