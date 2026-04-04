import mongoose from "mongoose";

export const DRIVER_DOCUMENT_TYPES = [
  "profile_photo",
  "driving_license",
  "vehicle_insurance",
  "revenue_license",
  "vehicle_registration_document"
];

const DOCUMENT_STATUSES = ["not_started", "submitted", "approved", "rejected"];

const driverDocumentSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null
    },
    documentType: {
      type: String,
      enum: DRIVER_DOCUMENT_TYPES,
      required: true
    },
    fileUrl: { type: String, trim: true, required: true },
    fileName: { type: String, trim: true, default: "" },
    mimeType: { type: String, trim: true, default: "" },
    fileSize: { type: Number, default: 0 },
    cloudinaryPublicId: { type: String, trim: true, default: "" },
    cloudinaryAssetId: { type: String, trim: true, default: "" },
    resourceType: { type: String, trim: true, default: "image" },
    documentNumber: { type: String, trim: true, default: "" },
    expiryDate: { type: Date, default: null },
    notes: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: DOCUMENT_STATUSES,
      default: "submitted",
      index: true
    },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, trim: true, default: "" },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

driverDocumentSchema.index({ driver: 1, documentType: 1 }, { unique: true });

export default mongoose.model("DriverDocument", driverDocumentSchema);
