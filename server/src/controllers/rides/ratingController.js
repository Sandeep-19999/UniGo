import Rating from "../../models/rides/Rating.js";
import Booking from "../../models/rides/Booking.js";
import User from "../../models/users/User.js";

export async function submitRating(req, res, next) {
  try {
    const { bookingId, ratedUserId, stars, comment, ratingType } = req.body;
    const ratedByUserId = req.user._id;

    if (!bookingId || !ratedUserId || !stars || !ratingType) {
      return res.status(400).json({
        message: "bookingId, ratedUserId, stars, and ratingType are required.",
      });
    }

    const starsNum = Number(stars);
    if (!Number.isInteger(starsNum) || starsNum < 1 || starsNum > 5) {
      return res.status(400).json({
        message: "Stars must be an integer between 1 and 5.",
      });
    }

    if (!["driver", "passenger"].includes(ratingType)) {
      return res.status(400).json({
        message: "ratingType must be 'driver' or 'passenger'.",
      });
    }

    const booking = await Booking.findById(bookingId).populate("ride");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    // Verify user is either passenger or driver of the ride
    const isPassenger = booking.passenger.toString() === ratedByUserId.toString();
    const isDriver = booking.ride.driver.toString() === ratedByUserId.toString();

    if (!isPassenger && !isDriver) {
      return res.status(403).json({
        message: "You are not involved in this booking.",
      });
    }

    // Verify the rated user is the opposite party
    if (ratingType === "driver" && !isPassenger) {
      return res.status(400).json({
        message: "Only passengers can rate drivers.",
      });
    }

    if (ratingType === "passenger" && !isDriver) {
      return res.status(400).json({
        message: "Only drivers can rate passengers.",
      });
    }

    // Verify rated user exists
    const ratedUser = await User.findById(ratedUserId);
    if (!ratedUser) {
      return res.status(404).json({ message: "Rated user not found." });
    }

    // Check if rating already exists
    const existingRating = await Rating.findOne({
      booking: bookingId,
      ratedBy: ratedByUserId,
      ratedUser: ratedUserId,
    });

    if (existingRating) {
      return res.status(400).json({
        message: "You have already rated this user for this booking.",
      });
    }

    const rating = await Rating.create({
      ratedBy: ratedByUserId,
      ratedUser: ratedUserId,
      booking: bookingId,
      stars: starsNum,
      comment: comment || "",
      ratingType,
    });

    const populatedRating = await Rating.findById(rating._id)
      .populate("ratedBy", "name email")
      .populate("ratedUser", "name email")
      .populate("booking");

    res.status(201).json(populatedRating);
  } catch (err) {
    next(err);
  }
}

export async function getUserRatings(req, res, next) {
  try {
    const { userId } = req.params;
    const { ratingType } = req.query;

    const query = { ratedUser: userId };
    if (ratingType && ["driver", "passenger"].includes(ratingType)) {
      query.ratingType = ratingType;
    }

    const ratings = await Rating.find(query)
      .populate("ratedBy", "name email")
      .populate("booking")
      .sort({ createdAt: -1 });

    const averageStars =
      ratings.length > 0
        ? (ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length).toFixed(1)
        : 0;

    res.json({
      user: userId,
      averageStars,
      totalRatings: ratings.length,
      ratings,
    });
  } catch (err) {
    next(err);
  }
}

export async function getRatingForBooking(req, res, next) {
  try {
    const { bookingId } = req.params;

    const ratings = await Rating.find({ booking: bookingId })
      .populate("ratedBy", "name email")
      .populate("ratedUser", "name email");

    res.json({ bookingId, ratings });
  } catch (err) {
    next(err);
  }
}

export async function deleteRating(req, res, next) {
  try {
    const { ratingId } = req.params;

    const rating = await Rating.findById(ratingId);
    if (!rating) {
      return res.status(404).json({ message: "Rating not found." });
    }

    // Only the person who submitted the rating can delete it
    if (rating.ratedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    await Rating.findByIdAndDelete(ratingId);

    res.json({ message: "Rating deleted." });
  } catch (err) {
    next(err);
  }
}
