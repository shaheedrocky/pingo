import mongoose from "mongoose";

const storyViewSchema = new mongoose.Schema({
  type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Story",
  },
  viewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
},{
    timestamps: true
});

export default mongoose.model("StoryView", storyViewSchema);