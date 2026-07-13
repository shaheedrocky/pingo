import { imageKit } from "../config/imageKit.js";
import OTP from "../models/otp.model.js";
import User from "../models/user.model.js";
import { sendOTPToEmail } from "../service/mail.service.js";
import { errorResponse, successResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateOTP } from "../utils/generateOTP.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  verifyPassword,
} from "../utils/generateToken.js";
import {
  isValidName,
  isValidPassword,
  isValidPhoneNumber,
} from "../utils/validators.js";
import jwt from "jsonwebtoken";

export const signup = asyncHandler(async (req, res) => {
  const { email, fullName, password, phone, gender } = req.body;

  if (!email || !fullName || !password || !phone || !gender) {
    return res.status(400).json(errorResponse("Missing required fields"));
  }

  if (!isValidPassword(password)) {
    return res
      .status(400)
      .json(errorResponse("Password must be at least 8 characters long"));
  }

  if (!isValidName(fullName)) {
    return res
      .status(400)
      .json(errorResponse("Full name must be at least 3 characters long"));
  }

  if (!isValidPhoneNumber(phone)) {
    return res.status(400).json(errorResponse("Invalid phone number"));
  }

  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });

  if (existingUser) {
    return res
      .status(409)
      .json(errorResponse("Email or phone number already exists"));
  }

  let photo = "";
  let photoFileId = "";
  if (req.file) {
    const imageKitResponse = await imageKit.upload({
      file: req.file.buffer,
      fileName: req.file.originalname,
      folder: "Pingo/Profile",
    });

    photo = imageKitResponse.url;
    photoFileId = imageKitResponse.fileId;
  }

  const hashedPassword = await hashPassword(password);

  const otp = generateOTP();

  await OTP.deleteMany({ email, purpose: "signup" });

  await OTP.create({
    email,
    otp,
    purpose: "signup",
    userData: {
      fullName,
      password: hashedPassword,
      phone,
      gender,
      photo,
      photoFileId,
    },
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  await sendOTPToEmail(email, otp);

  return res.status(200).json(successResponse("OTP sent successfully"));
});

export const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp, purpose = "signup" } = req.body;

  if (!["signup", "forgot-password"].includes(purpose)) {
    return res.status(400).json(errorResponse("Invalid purpose"));
  }

  if (!email || !otp) {
    return res.status(400).json(errorResponse("Email and OTP are required"));
  }

  const otpRecord = await OTP.findOne({
    email,
    otp,
    purpose,
  });

  if (!otpRecord) {
    return res.status(400).json(errorResponse("Invalid OTP"));
  }

  if (otpRecord.expiresAt < new Date()) {
    await OTP.deleteOne({ _id: otpRecord._id });

    return res.status(400).json(errorResponse("OTP has expired"));
  }

  if (purpose === "signup") {
    const existingUser = await User.findOne({
      $or: [{ email: otpRecord.email }, { phone: otpRecord.userData.phone }],
    });

    if (existingUser) {
      await OTP.deleteOne({ _id: otpRecord._id });

      return res.status(409).json(errorResponse("User already exists"));
    }

    const newUser = await User.create({
      email: otpRecord.email,
      ...otpRecord.userData.toObject(),
    });

    await OTP.deleteOne({ _id: otpRecord._id });

    return res.status(201).json(
      successResponse("Account created successfully", {
        id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        phone: newUser.phone,
        gender: newUser.gender,
        photo: newUser.photo,
      }),
    );
  }

  if (purpose === "forgot-password") {
    otpRecord.verified = true;
    await otpRecord.save();

    return res.status(200).json(successResponse("OTP verified successfully"));
  }

  return res.status(400).json(errorResponse("Invalid purpose"));
});

export const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json(errorResponse("Email is required"));
  }

  const otpRecord = await OTP.findOne({
    email,
    purpose: "signup",
  });

  if (!otpRecord) {
    return res.status(404).json(errorResponse("No signup request found"));
  }

  otpRecord.otp = generateOTP();
  otpRecord.expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await otpRecord.save();

  await sendOTPToEmail(email, otpRecord.otp);

  return res.status(200).json(successResponse("OTP resent successfully"));
});

export const checkUser = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json(errorResponse("Email is required"));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json(errorResponse("User not found"));
  }

  return res
    .status(200)
    .json(successResponse("User found", { email: user.email }));
});

export const signIn = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json(errorResponse("Missing required fields"));
  }

  if (!isValidPassword(password)) {
    return res
      .status(400)
      .json(errorResponse("Password must be at least 8 characters long"));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res
      .status(404)
      .json(errorResponse("User not found"));
  }

  const verifyPass = await verifyPassword(password, user.password);

  if (!verifyPass) {
    return res
      .status(401)
      .json(errorResponse("Invalid password"));
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save();

  // Remove password from response
  const userData = user.toObject();
  delete userData.password;
  delete userData.refreshToken;

  return res.status(200).json(
    successResponse("Sign in successful", {
      user: userData,
      accessToken,
      refreshToken,
    })
  );
});

export const passwordChange = asyncHandler(async (req, res) => {
  const { email, newPassword, oldPassword } = req.body;

  if (!email || !newPassword || !oldPassword) {
    return res.status(400).json(errorResponse("All fields are required"));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json(errorResponse("User not found"));
  }

  const isNewPasswordValid = isValidPassword(newPassword);

  const isOldPasswordCorrect = await verifyPassword(oldPassword, user.password);

  if (!isOldPasswordCorrect) {
    return res.status(401).json(errorResponse("Old password is incorrect"));
  }

  const isSamePassword = await verifyPassword(newPassword, user.password);

  if (isSamePassword) {
    return res
      .status(400)
      .json(
        errorResponse("New password cannot be the same as the old password"),
      );
  }

  if (!isNewPasswordValid) {
    return res
      .status(400)
      .json(errorResponse("New password must be at least 8 characters long"));
  }

  const hashedNewPassword = await hashPassword(newPassword);

  user.password = hashedNewPassword;

  await user.save();

  return res.status(200).json(successResponse("Password changed successfully"));
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json(errorResponse("Refresh token is required"));
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json(errorResponse("Invalid refresh token"));
    }

    const accessToken = generateAccessToken(user._id);

    return res
      .status(200)
      .json(successResponse("Access token generated", { accessToken }));
  } catch (error) {
    return res.status(401).json(errorResponse("Invalid or expired refresh token"));
  }
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json(errorResponse("Email is required"));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json(errorResponse("User not found"));
  }

  const otp = generateOTP();

  await OTP.deleteMany({ email, purpose: "forgot-password" });

  await OTP.create({
    email,
    otp,
    purpose: "forgot-password",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  await sendOTPToEmail(email, otp);

  return res.status(200).json(successResponse("OTP sent successfully"));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json(errorResponse("Email, OTP, and new password are required"));
  }

  if (!isValidPassword(newPassword)) {
    return res.status(400).json(errorResponse("Password must be at least 8 characters long"));
  }

  const otpRecord = await OTP.findOne({ email, otp, purpose: "forgot-password" });

  if (!otpRecord) {
    return res.status(400).json(errorResponse("Invalid OTP"));
  }

  if (!otpRecord.verified) {
    return res.status(400).json(errorResponse("OTP has not been verified yet"));
  }

  if (otpRecord.expiresAt < new Date()) {
    await OTP.deleteOne({ _id: otpRecord._id });
    return res.status(400).json(errorResponse("OTP has expired"));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json(errorResponse("User not found"));
  }

  const hashedPassword = await hashPassword(newPassword);
  user.password = hashedPassword;
  user.refreshToken = ""; // Invalidate refresh tokens on password reset
  await user.save();

  await OTP.deleteOne({ _id: otpRecord._id });

  return res.status(200).json(successResponse("Password reset successfully"));
});

export const logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.refreshToken = "";
    await user.save();
  }

  return res.status(200).json(successResponse("Logout successful"));
});
