import mongoose from "mongoose";

const OTPSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    otp: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: ["signup", "forgot-password"],
      required: true,
    },

    verified: {
      type: Boolean,
      default: false,
    },

    // Temporary user data (only for signup)
    userData: {
      fullName: String,
      password: String, // Hashed password
      phone: String,
      gender: {
        type: String,
        enum: ["male", "female"],
      },
      photo: {
        type: String,
        default: "",
      },
    },

    expiresAt: {
      type: Date,
      required: true,
      index: {
        expires: 0, // MongoDB TTL
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("OTP", OTPSchema);