import mongoose from "mongoose";

const ONBOARDING_STATUSES = ["not_started", "in_progress", "under_review", "approved", "rejected"];

const driverProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    firstName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    onboardingStatus: {
      type: String,
      enum: ONBOARDING_STATUSES,
      default: "not_started",
      index: true
    },
    recommendedNextStep: { type: String, trim: true, default: "vehicle_information" },
    progressPercent: { type: Number, min: 0, max: 100, default: 0 },
    approvedAt: { type: Date, default: null },

    driverCurrentDestination: {
      type: String,
      trim: true,
      default: ""
    },
    driverCurrentDestinationNormalized: {
      type: String,
      trim: true,
      default: "",
      index: true
    },
    driverCurrentDestinationUpdatedAt: {
      type: Date,
      default: null
    },
    bankAccount: {
      accountHolderName: { type: String, trim: true, default: "" },
      accountNumber: { type: String, trim: true, default: "" },
      bankName: { type: String, trim: true, default: "" },
      accountType: {
        type: String,
        enum: ["savings", "checking"],
        default: "savings"
      },
      routingNumber: { type: String, trim: true, default: "" },
      isVerified: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

driverProfileSchema.virtual("fullName").get(function () {
  return [this.firstName, this.lastName].filter(Boolean).join(" ").trim();
});

export default mongoose.model("DriverProfile", driverProfileSchema);