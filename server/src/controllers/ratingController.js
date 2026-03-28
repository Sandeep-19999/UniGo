import Rating from "../models/Rating.js";
import RideRequest from "../models/rides/RideRequest.js";
import User from "../models/users/User.js";

// Create a rating for a completed booking
export async function createRating(req, res, next) {
  try {
    const { bookingId, rating, comment, isAnonymous } = req.body;
    const passengerId = req.user.id;

    // Validate required fields
    if (!bookingId || rating === undefined) {
      return res.status(400).json({ message: "bookingId and rating are required" });
    }

    // Validate rating value
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Validate comment (required, min 3 chars, max 300 chars)
    if (!comment) {
      return res.status(400).json({ message: "Comment is required" });
    }

    const trimmedComment = String(comment).trim();
    if (trimmedComment.length < 3) {
      return res.status(400).json({ message: "Comment must be at least 3 characters" });
    }

    if (trimmedComment.length > 300) {
      return res.status(400).json({ message: "Comment cannot exceed 300 characters" });
    }

    // Check if ride request exists and is completed
    const rideRequest = await RideRequest.findById(bookingId);
    if (!rideRequest) {
      return res.status(404).json({ message: "Ride request not found" });
    }

    if (rideRequest.status !== "completed") {
      return res.status(400).json({ message: "Can only rate completed rides" });
    }

    if (rideRequest.passenger.toString() !== passengerId) {
      return res.status(403).json({ message: "Can only rate your own rides" });
    }

    if (!rideRequest.acceptedBy) {
      return res.status(400).json({ message: "No driver accepted this ride" });
    }

    // Check if rating already exists and update it
    let existingRating = await Rating.findOne({ rideRequest: bookingId });
    
    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      existingRating.comment = trimmedComment;
      await existingRating.save();
      
      await existingRating.populate([
        { path: "passenger", select: "name email" },
        { path: "driver", select: "name email" },
        { path: "rideRequest", select: "_id status" }
      ]);

      return res.status(200).json({ message: "Rating updated successfully", rating: existingRating });
    }

    // Create new rating if doesn't exist
    try {
      const newRating = await Rating.create({
        rideRequest: bookingId,
        passenger: passengerId,
        driver: rideRequest.acceptedBy,
        rating,
        comment: trimmedComment
      });

      await newRating.populate([
        { path: "passenger", select: "name email" },
        { path: "driver", select: "name email" },
        { path: "rideRequest", select: "_id status" }
      ]);

      res.status(201).json({ message: "Rating created successfully", rating: newRating });
    } catch (mongoErr) {
      // Handle E11000 duplicate key error
      if (mongoErr.code === 11000) {
        return res.status(409).json({ message: "You have already rated this booking" });
      }
      throw mongoErr;
    }
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
      .populate("rideRequest", "_id status")
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

// Get rating for a specific ride request
export async function getRatingByBooking(req, res, next) {
  try {
    const { bookingId } = req.params;

    const rating = await Rating.findOne({ rideRequest: bookingId }).populate([
      { path: "passenger", select: "name email" },
      { path: "driver", select: "name email" },
      { path: "rideRequest", select: "_id status" }
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

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Validate comment if provided
    if (comment !== undefined) {
      const trimmedComment = String(comment).trim();
      if (trimmedComment.length < 3) {
        return res.status(400).json({ message: "Comment must be at least 3 characters" });
      }
      if (trimmedComment.length > 300) {
        return res.status(400).json({ message: "Comment cannot exceed 300 characters" });
      }
      existingRating.comment = trimmedComment;
    }

    if (rating) existingRating.rating = rating;

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

// Check if passenger can rate this ride request
export async function canRateBooking(req, res, next) {
  try {
    const { bookingId } = req.params;
    const passengerId = req.user.id;

    const rideRequest = await RideRequest.findById(bookingId);
    if (!rideRequest) {
      return res.status(404).json({ message: "Ride request not found" });
    }

    if (rideRequest.passenger.toString() !== passengerId) {
      return res.json({ canRate: false, reason: "Not your ride" });
    }

    if (rideRequest.status !== "completed") {
      return res.json({ canRate: false, reason: "Ride not completed" });
    }

    if (!rideRequest.acceptedBy) {
      return res.json({ canRate: false, reason: "No driver accepted this ride" });
    }

    const existingRating = await Rating.findOne({ rideRequest: bookingId });
    if (existingRating) {
      return res.json({ canRate: false, reason: "Already rated" });
    }

    res.json({ canRate: true });
  } catch (err) {
    next(err);
  }
}

// Get all ratings - Admin only
// DEPRECATED: Rating management feature removed from admin dashboard
// export async function getAllRatings(req, res, next) {
//   try {
//     const ratings = await Rating.find()
//       .populate("passenger", "name email")
//       .populate("driver", "name email")
//       .populate("rideRequest", "pickupLocation dropLocation status")
//       .sort({ createdAt: -1 });

//     res.json({
//       message: "All ratings retrieved successfully",
//       total: ratings.length,
//       ratings
//     });
//   } catch (err) {
//     next(err);
//   }
// }

// Delete a rating - Admin only
// DEPRECATED: Rating management feature removed from admin dashboard
// export async function deleteRating(req, res, next) {
//   try {
//     const { ratingId } = req.params;

//     // Validate ratingId
//     if (!ratingId) {
//       return res.status(400).json({ message: "Rating ID is required" });
//     }

//     // Find and delete the rating
//     const rating = await Rating.findByIdAndDelete(ratingId);

//     if (!rating) {
//       return res.status(404).json({ message: "Rating not found" });
//     }

//     res.json({
//       message: "Rating deleted successfully",
//       ratingId: ratingId
//     });
//   } catch (err) {
//     next(err);
//   }
// }
