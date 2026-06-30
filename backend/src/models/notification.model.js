import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: String,
    body: String,
    notificationType: {
      type: String,
      enum: ["message", "story", "call"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Notification", notificationSchema);
