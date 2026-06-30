import mongoose from 'mongoose';

export const connectDB = async()=>{
    console.log('process.env.MONGO_URI ',process.env.MONGO_URI);
    
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`DB is connect ${conn.connection.name}`);
        
    } catch (error) {
        console.log('Error while on connecting DB with our server: ', error.message);
        
    }
}