import mongoose from "mongoose";
import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import { imageKit } from "../config/imageKit.js";
import { errorResponse, successResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import crypto from "crypto";

export const createGroup = asyncHandler(async (req, res) => {
  const { name, description, members = [] } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json(errorResponse("Group name is required"));
  }

  // Generate invite code
  const inviteCode = crypto.randomBytes(8).toString("hex");

  let image = "";
  if (req.file) {
    const uploadResult = await imageKit.upload({
      file: req.file.buffer,
      fileName: req.file.originalname,
      folder: "Pingo/Groups",
    });
    image = uploadResult.url;
  }

  // Ensure members is array of ObjectIds and doesn't include current user
  const uniqueMembers = Array.from(new Set([req.user._id.toString(), ...members]));

  const group = await Group.create({
    name,
    image,
    description: description || "",
    admins: [req.user._id],
    members: uniqueMembers,
    inviteCode,
  });

  const populatedGroup = await Group.findById(group._id)
    .populate("members", "fullName photo bio email")
    .populate("admins", "fullName photo");

  return res.status(201).json(successResponse("Group created successfully", populatedGroup));
});

export const getGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find({ members: req.user._id })
    .populate("members", "fullName photo bio")
    .populate("admins", "fullName photo");

  return res.status(200).json(successResponse("Groups fetched successfully", groups));
});

export const getGroupById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid group ID"));
  }

  const group = await Group.findById(id)
    .populate("members", "fullName photo bio email")
    .populate("admins", "fullName photo");

  if (!group) {
    return res.status(404).json(errorResponse("Group not found"));
  }

  const isMember = group.members.some((m) => m._id.toString() === req.user._id.toString());
  if (!isMember) {
    return res.status(403).json(errorResponse("Access denied. You are not a member of this group."));
  }

  return res.status(200).json(successResponse("Group details fetched successfully", group));
});

export const addMembers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { members = [] } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid group ID"));
  }

  if (members.length === 0) {
    return res.status(400).json(errorResponse("Members array is required"));
  }

  const group = await Group.findById(id);
  if (!group) {
    return res.status(404).json(errorResponse("Group not found"));
  }

  const isAdmin = group.admins.some((a) => a.toString() === req.user._id.toString());
  if (!isAdmin) {
    return res.status(403).json(errorResponse("Only group admins can add members"));
  }

  // Push new members and prevent duplicates
  members.forEach((mId) => {
    if (mongoose.Types.ObjectId.isValid(mId)) {
      if (!group.members.some((m) => m.toString() === mId)) {
        group.members.push(mId);
      }
    }
  });

  await group.save();

  const populatedGroup = await Group.findById(id)
    .populate("members", "fullName photo bio email")
    .populate("admins", "fullName photo");

  return res.status(200).json(successResponse("Members added successfully", populatedGroup));
});

export const removeMember = asyncHandler(async (req, res) => {
  const { id, memberId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(memberId)) {
    return res.status(400).json(errorResponse("Invalid group or member ID"));
  }

  const group = await Group.findById(id);
  if (!group) {
    return res.status(404).json(errorResponse("Group not found"));
  }

  const isAdmin = group.admins.some((a) => a.toString() === req.user._id.toString());
  if (!isAdmin) {
    return res.status(403).json(errorResponse("Only group admins can remove members"));
  }

  if (memberId === req.user._id.toString()) {
    return res.status(400).json(errorResponse("To leave group, please use the leave-group endpoint"));
  }

  group.members = group.members.filter((m) => m.toString() !== memberId);
  group.admins = group.admins.filter((a) => a.toString() !== memberId);

  await group.save();

  const populatedGroup = await Group.findById(id)
    .populate("members", "fullName photo bio email")
    .populate("admins", "fullName photo");

  return res.status(200).json(successResponse("Member removed successfully", populatedGroup));
});

export const promoteAdmin = asyncHandler(async (req, res) => {
  const { id, memberId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(memberId)) {
    return res.status(400).json(errorResponse("Invalid group or member ID"));
  }

  const group = await Group.findById(id);
  if (!group) {
    return res.status(404).json(errorResponse("Group not found"));
  }

  const isAdmin = group.admins.some((a) => a.toString() === req.user._id.toString());
  if (!isAdmin) {
    return res.status(403).json(errorResponse("Only group admins can promote other members to admin"));
  }

  const isMember = group.members.some((m) => m.toString() === memberId);
  if (!isMember) {
    return res.status(400).json(errorResponse("User is not a member of this group"));
  }

  if (group.admins.some((a) => a.toString() === memberId)) {
    return res.status(400).json(errorResponse("Member is already an admin"));
  }

  group.admins.push(memberId);
  await group.save();

  const populatedGroup = await Group.findById(id)
    .populate("members", "fullName photo bio email")
    .populate("admins", "fullName photo");

  return res.status(200).json(successResponse("Member promoted to admin successfully", populatedGroup));
});

export const demoteAdmin = asyncHandler(async (req, res) => {
  const { id, memberId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(memberId)) {
    return res.status(400).json(errorResponse("Invalid group or member ID"));
  }

  const group = await Group.findById(id);
  if (!group) {
    return res.status(404).json(errorResponse("Group not found"));
  }

  const isAdmin = group.admins.some((a) => a.toString() === req.user._id.toString());
  if (!isAdmin) {
    return res.status(403).json(errorResponse("Only group admins can demote other admins"));
  }

  const isCurrentAdmin = group.admins.some((a) => a.toString() === memberId);
  if (!isCurrentAdmin) {
    return res.status(400).json(errorResponse("Member is not an admin"));
  }

  if (group.admins.length === 1) {
    return res.status(400).json(errorResponse("There must be at least one admin left in the group"));
  }

  group.admins = group.admins.filter((a) => a.toString() !== memberId);
  await group.save();

  const populatedGroup = await Group.findById(id)
    .populate("members", "fullName photo bio email")
    .populate("admins", "fullName photo");

  return res.status(200).json(successResponse("Admin demoted successfully", populatedGroup));
});

export const leaveGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid group ID"));
  }

  const group = await Group.findById(id);
  if (!group) {
    return res.status(404).json(errorResponse("Group not found"));
  }

  const isMember = group.members.some((m) => m.toString() === req.user._id.toString());
  if (!isMember) {
    return res.status(400).json(errorResponse("You are not a member of this group"));
  }

  const wasAdmin = group.admins.some((a) => a.toString() === req.user._id.toString());

  group.members = group.members.filter((m) => m.toString() !== req.user._id.toString());
  group.admins = group.admins.filter((a) => a.toString() !== req.user._id.toString());

  // Promote a member to admin if the leaving admin was the last admin, and members remain
  if (wasAdmin && group.admins.length === 0 && group.members.length > 0) {
    group.admins.push(group.members[0]);
  }

  await group.save();

  return res.status(200).json(successResponse("You have left the group successfully"));
});

export const deleteGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid group ID"));
  }

  const group = await Group.findById(id);
  if (!group) {
    return res.status(404).json(errorResponse("Group not found"));
  }

  const isAdmin = group.admins.some((a) => a.toString() === req.user._id.toString());
  if (!isAdmin) {
    return res.status(403).json(errorResponse("Only group admins can delete the group"));
  }

  await group.deleteOne();

  return res.status(200).json(successResponse("Group deleted successfully"));
});

export const updateGroupProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid group ID"));
  }

  const group = await Group.findById(id);
  if (!group) {
    return res.status(404).json(errorResponse("Group not found"));
  }

  const isAdmin = group.admins.some((a) => a.toString() === req.user._id.toString());
  if (!isAdmin) {
    return res.status(403).json(errorResponse("Only group admins can edit the group profile"));
  }

  if (name) group.name = name;
  if (description !== undefined) group.description = description;

  if (req.file) {
    const uploadResult = await imageKit.upload({
      file: req.file.buffer,
      fileName: req.file.originalname,
      folder: "Pingo/Groups",
    });
    group.image = uploadResult.url;
  }

  await group.save();

  const populatedGroup = await Group.findById(id)
    .populate("members", "fullName photo bio email")
    .populate("admins", "fullName photo");

  return res.status(200).json(successResponse("Group profile updated successfully", populatedGroup));
});

export const getInviteLink = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid group ID"));
  }

  const group = await Group.findById(id);
  if (!group) {
    return res.status(404).json(errorResponse("Group not found"));
  }

  const isMember = group.members.some((m) => m.toString() === req.user._id.toString());
  if (!isMember) {
    return res.status(403).json(errorResponse("Only group members can get invite link"));
  }

  if (!group.inviteCode) {
    group.inviteCode = crypto.randomBytes(8).toString("hex");
    await group.save();
  }

  return res.status(200).json(successResponse("Invite code fetched", { inviteCode: group.inviteCode }));
});

export const joinByInviteCode = asyncHandler(async (req, res) => {
  const { inviteCode } = req.params;

  if (!inviteCode) {
    return res.status(400).json(errorResponse("Invite code is required"));
  }

  const group = await Group.findOne({ inviteCode });
  if (!group) {
    return res.status(404).json(errorResponse("Group with this invite code not found"));
  }

  const isMember = group.members.some((m) => m.toString() === req.user._id.toString());
  if (isMember) {
    return res.status(400).json(errorResponse("You are already a member of this group"));
  }

  group.members.push(req.user._id);
  await group.save();

  const populatedGroup = await Group.findById(group._id)
    .populate("members", "fullName photo bio email")
    .populate("admins", "fullName photo");

  return res.status(200).json(successResponse("Joined group successfully", populatedGroup));
});
