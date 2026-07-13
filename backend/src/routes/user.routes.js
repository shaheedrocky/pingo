import express from 'express';
import { protectedRoute } from '../middleware/auth.midleware.js';
import { editUserProfile, getUserById, getUsers, searchUsers, blockUser, unblockUser, updatePrivacySettings } from '../controller/user.controller.js';
import { upload } from '../middleware/upload.middleware.js';

const route = express.Router();
route.use(protectedRoute)

route.get('/all', getUsers)
route.get('/search', searchUsers)
route.get('/', getUserById)
route.put('/edit-user-profile',upload.single('profile-photo'), editUserProfile)
route.post('/block', blockUser)
route.post('/unblock', unblockUser)
route.put('/privacy', updatePrivacySettings)


export default route;