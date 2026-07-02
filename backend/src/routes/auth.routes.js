import express from 'express';
import { upload } from '../middleware/upload.middleware.js';
import { checkUser, passwordChange, resendOTP, signIn, signup, verifyOTP } from '../controller/auth.controller.js';

const route = express.Router();

route.post('/signup', upload.single('profile-photo'), signup);
route.post('/verify-otp', verifyOTP);
route.post('/resend-otp', resendOTP);
route.post('/check-user', checkUser);
route.post('/signin', signIn);
route.post('/change-password', passwordChange);

export default route;