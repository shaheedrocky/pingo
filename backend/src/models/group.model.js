import mongoose from 'mongoose';

const groupSchema = new mongoose({
    name:{
        type: String,
        required: true
    },
    image:{
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    admins:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    members:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
},{
    timeStamps: true
})

export default mongoose.model("Group", groupSchema);