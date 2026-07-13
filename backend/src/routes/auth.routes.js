import express from 'express';
import { upload } from '../middleware/upload.middleware.js';
import { checkUser, passwordChange, resendOTP, signIn, signup, verifyOTP, refreshToken, forgotPassword, resetPassword, logout } from '../controller/auth.controller.js';
import { protectedRoute } from '../middleware/auth.midleware.js';

const route = express.Router();

route.post('/signup', upload.single('profile-photo'), signup);
route.post('/verify-otp', verifyOTP);
route.post('/resend-otp', resendOTP);
route.post('/check-user', checkUser);
route.post('/signin', signIn);
route.post('/change-password', passwordChange);
route.post('/refresh-token', refreshToken);
route.post('/forgot-password', forgotPassword);
route.post('/reset-password', resetPassword);
route.post('/logout', protectedRoute, logout);

export default route;