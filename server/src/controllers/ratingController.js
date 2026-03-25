import Rating from "../models/Rating.js";
import Booking from "../models/rides/Booking.js";
import User from "../models/users/User.js";

// Create a rating for a completed booking
export async function createRating(req, res, next) {
  try {
    const { bookingId, rating, comment, isAnonymous } = req.body;
    const passengerId = req.user.id;

    if (!bookingId || rating === undefined) {
      return res.status(400).json({ message: "bookingId and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Check if booking exists and is completed
    const booking = await Booking.findById(bookingId).populate("ride");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({ message: "Can only rate completed bookings" });
    }

    if (booking.passenger.toString() !== passengerId) {
      return res.status(403).json({ message: "Can only rate your own bookings" });
    }

    // Check if rating already exists
    const existingRating = await Rating.findOne({ booking: bookingId });
    if (existingRating) {
      return res.status(409).json({ message: "Booking already has a rating" });
    }

    // Get driver from ride
    const ride = booking.ride;
    if (!ride || !ride.driver) {
      return res.status(400).json({ message: "Ride or driver not found" });
    }

    // Create rating
    const newRating = await Rating.create({
      booking: bookingId,
      passenger: passengerId,
      driver: ride.driver,
      ride: ride._id,
      rating,
      comment: comment ? String(comment).trim() : "",
      isAnonymous: isAnonymous || false
    });

    await newRating.populate([
      { path: "passenger", select: "name email" },
      { path: "driver", select: "name email" },
      { path: "booking" }
    ]);

    res.status(201).json({ message: "Rating created successfully", rating: newRating });
  } catch (err) {
    next(err);
  }
}

// Get all ratings for a driver
export async function getDriverRatings(req, res, next) {
  try {
    const { driverId } = req.params;

    const ratings = await Rating.find({ driver: driverId })
      .populate("passenger", "name")
      .populate("booking")
      .sort({ createdAt: -1 });

    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0 
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1)
      : 0;

    res.json({
      driverId,
      totalRatings,
      averageRating,
      ratings
    });
  } catch (err) {
    next(err);
  }
}

// Get rating for a specific booking
export async function getRatingByBooking(req, res, next) {
  try {
    const { bookingId } = req.params;

    const rating = await Rating.findOne({ booking: bookingId }).populate([
      { path: "passenger", select: "name email" },
      { path: "driver", select: "name email" },
      { path: "booking" }
    ]);

    if (!rating) {
      return res.json({ exists: false, message: "No rating for this booking" });
    }

    res.json({ exists: true, rating });
  } catch (err) {
    next(err);
  }
}

// Update a rating
export async function updateRating(req, res, next) {
  try {
    const { ratingId } = req.params;
    const { rating, comment } = req.body;
    const passengerId = req.user.id;

    const existingRating = await Rating.findById(ratingId);
    if (!existingRating) {
      return res.status(404).json({ message: "Rating not found" });
    }

    if (existingRating.passenger.toString() !== passengerId) {
      return res.status(403).json({ message: "Can only update your own ratings" });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    if (rating) existingRating.rating = rating;
    if (comment !== undefined) existingRating.comment = String(comment).trim();

    await existingRating.save();
    await existingRating.populate([
      { path: "passenger", select: "name email" },
      { path: "driver", select: "name email" }
    ]);

    res.json({ message: "Rating updated successfully", rating: existingRating });
  } catch (err) {
    next(err);
  }
}

// Check if passenger can rate this booking
export async function canRateBooking(req, res, next) {
  try {
    const { bookingId } = req.params;
    const passengerId = req.user.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.passenger.toString() !== passengerId) {
      return res.json({ canRate: false, reason: "Not your booking" });
    }

    if (booking.status !== "completed") {
      return res.json({ canRate: false, reason: "Booking not completed" });
    }

    const existingRating = await Rating.findOne({ booking: bookingId });
    if (existingRating) {
      return res.json({ canRate: false, reason: "Already rated" });
    }

    res.json({ canRate: true });
  } catch (err) {
    next(err);
  }
}
