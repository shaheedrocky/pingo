import mongoose, { model } from "mongoose";

const storySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  storyType: {
    type: String,
    enum: ["image", "video", "text"],
  },
  mediaUrl:{
    type:String,
    default:''
  },
  caption:{
        type:String,
    default:''
  },
  backgroundColor:{
    type: String,
    default: ''
  },
  expiresAt:{
    type:Date,
    default: ()=> new Date(Date.now + 24 * 60 * 60 *1000) 
  },

}, {
    timestamps: true
});


export default mongoose.model("Story", storySchema);