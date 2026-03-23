import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    ratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ratedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
    ratingType: {
      type: String,
      enum: ["driver", "passenger"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one rating per booking per person
ratingSchema.index({ booking: 1, ratedBy: 1 }, { unique: true });
ratingSchema.index({ ratedUser: 1, ratingType: 1 });

const Rating = mongoose.model("Rating", ratingSchema);

export default Rating;
