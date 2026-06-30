import mongoose from "mongoose";

const callSchema = new mongoose.Schema({
    callerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reciverId:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type:{
        type:String,
        enum:['voice', 'video']
    },
    status:{
        type:String,
        enum:['ringing', 'answered', 'missed' , 'rejected', 'ended'],
        default: 'ringing'
    },
    duration:{
        type: Number,
        default: 0
    }
},{
    timestamps: true
})

export default mongoose.model("Call", callSchema);