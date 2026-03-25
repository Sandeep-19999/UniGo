import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    adminLevel: { type: String, enum: ["super_admin", "admin", "moderator"], default: "admin" },
    department: { type: String, trim: true, default: "Operations" },
    permissions: [{ type: String }],
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    loginCount: { type: Number, default: 0 },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
