import express from 'express';
import 'dotenv/config';
import { connectDB } from './config/db.js';
import cors from 'cors';
import AuthRoutes from './routes/auth.routes.js';
import UserRoutes from './routes/user.routes.js';

const app = express();
const PORT = process.env.PORT;

app.use(cors({
    origin: '*',
}));

app.get('/health', (req,res)=>{
    res.send('Server is working!')
})

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', AuthRoutes)
app.use('/api/user', UserRoutes)

app.listen(PORT, ()=>{
    console.log(`Server is listening on ${PORT}`);
    connectDB()
})