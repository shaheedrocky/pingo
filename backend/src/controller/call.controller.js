import mongoose from "mongoose";
import Call from "../models/call.model.js";
import User from "../models/user.model.js";
import { errorResponse, successResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const startCallLog = asyncHandler(async (req, res) => {
  const { receiverId, type } = req.body;

  if (!receiverId || !type) {
    return res.status(400).json(errorResponse("Receiver ID and call type (voice/video) are required"));
  }

  if (!mongoose.Types.ObjectId.isValid(receiverId)) {
    return res.status(400).json(errorResponse("Invalid receiver ID"));
  }

  if (!["voice", "video"].includes(type)) {
    return res.status(400).json(errorResponse("Invalid call type. Must be voice or video"));
  }

  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return res.status(404).json(errorResponse("Receiver not found"));
  }

  const call = await Call.create({
    callerId: req.user._id,
    receiverId,
    type,
    status: "ringing",
  });

  const populatedCall = await Call.findById(call._id)
    .populate("callerId", "fullName photo")
    .populate("receiverId", "fullName photo");

  return res.status(201).json(successResponse("Call log started successfully", populatedCall));
});

export const updateCallStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, duration } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid call log ID"));
  }

  const allowedStatus = ["ringing", "answered", "missed", "rejected", "ended"];
  if (!status || !allowedStatus.includes(status)) {
    return res.status(400).json(errorResponse("Invalid or missing call status"));
  }

  const call = await Call.findById(id);
  if (!call) {
    return res.status(404).json(errorResponse("Call log not found"));
  }

  const isParticipant =
    call.callerId.toString() === req.user._id.toString() ||
    call.receiverId.toString() === req.user._id.toString();

  if (!isParticipant) {
    return res.status(403).json(errorResponse("Access denied. You are not a participant in this call."));
  }

  call.status = status;
  if (duration !== undefined) {
    call.duration = Number(duration) || 0;
  }

  await call.save();

  const populatedCall = await Call.findById(id)
    .populate("callerId", "fullName photo")
    .populate("receiverId", "fullName photo");

  return res.status(200).json(successResponse("Call status updated successfully", populatedCall));
});

export const getCallHistory = asyncHandler(async (req, res) => {
  const calls = await Call.find({
    $or: [{ callerId: req.user._id }, { receiverId: req.user._id }],
  })
    .populate("callerId", "fullName photo")
    .populate("receiverId", "fullName photo")
    .sort({ createdAt: -1 });

  return res.status(200).json(successResponse("Call history fetched successfully", calls));
});
