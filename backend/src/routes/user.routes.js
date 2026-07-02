import express from 'express';
import { protectedRoute } from '../middleware/auth.midleware.js';
import { getUserById, getUsers, searchUsers } from '../controller/user.controller.js';

const route = express.Router();
route.use(protectedRoute)

route.get('/all', getUsers)
route.get('/search', searchUsers)
route.get('/:id', getUserById)


export default route;