import express from 'express';
import 'dotenv/config';
import { connectDB } from './config/db.js';

const app = express();
const PORT = process.env.PORT;

app.get('/health', (req,res)=>{
    res.send('Server is working!')
})

app.listen(PORT, ()=>{
    console.log(`Server is listening on ${PORT}`);
    connectDB()
})