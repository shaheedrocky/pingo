import mongoose from 'mongoose';

const groupMessageSchema = new mongoose.Schema({
    groupId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    senderId:{
         type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    messageType:{
        type:String,
        enum:[
            "text",
            "video",
            'audio',
            'document',
            'image'
        ],
        default: 'text'
    },
    message:{
        type: String,
        default: ''
    },
    mediaUrl:{
        type: String,
        default: ''
    },
    status:{
        type:String,
        enum:['pending', 'delivered' , 'seen'],
        default: 'pending'
    },

},{
    timestamps: true
});

export default mongoose.model("GroupMessage", groupMessageSchema);