import express from 'express';
import 'dotenv/config';
import { connectDB } from './config/db.js';
import cors from 'cors';
import AuthRoutes from './routes/auth.routes.js';
import UserRoutes from './routes/user.routes.js';
import ConversationRoutes from './routes/conversation.routes.js';
import MessageRoutes from './routes/message.routes.js';
import GroupRoutes from './routes/group.routes.js';
import CallRoutes from './routes/call.routes.js';

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
app.use('/conversation', ConversationRoutes)
app.use('/message', MessageRoutes)
app.use('/group', GroupRoutes)
app.use('/call', CallRoutes)

app.listen(PORT, ()=>{
    console.log(`Server is listening on ${PORT}`);
    connectDB()
})