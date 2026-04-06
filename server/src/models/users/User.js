import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address."]
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["admin", "driver", "user"], default: "user" },
    phone: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    paymentMethods: [
      {
        methodType: {
          type: String,
          enum: ["Credit Card", "Debit Card"],
          required: true,
        },
        cardBrand: { type: String, trim: true, default: "Card" },
        maskedCardNumber: { type: String, required: true },
        last4: { type: String, required: true },
        expiryDate: { type: String, required: true },
        holderName: { type: String, required: true, trim: true },
        isDefault: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      }
    ],
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null }
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model("User", userSchema);
