import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        min: 3,
    },
    email:{
        type: String,
        required: true,
    },
    password:{
        type: String,
        required: true,
    },
    phone:{
        type: String,
        required: true,
    },
    gender:{
        type: String,
        required: true,
    },
    photo:{
        type: String,
        default: ''
    },
    bio:{
        type: String,
        default: ''
    },
    isOnline:{
        type: Boolean,
        default: false
    },
    lastSeen:{
        type: Boolean,
        default: false
    },
    pushToken:{
        type: String,
      default: "",
    }
},{
    timestamps: true
});

export default mongoose.model("User", userSchema);