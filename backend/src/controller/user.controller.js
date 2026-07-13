import mongoose from "mongoose";
import { imageKit } from "../config/imageKit.js";
import User from "../models/user.model.js";
import { errorResponse, successResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidName } from "../utils/validators.js";

export const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const skip = (page - 1) * limit;
  const filter = {
    $and: [
      { _id: { $ne: req.user._id } },
      { _id: { $nin: req.user.blockedUsers || [] } },
      { blockedUsers: { $ne: req.user._id } }
    ]
  };
  const totalUsers = await User.countDocuments(filter);

  const users = await User.find(filter, { password: 0, __v: 0 })
    .skip(skip)
    .limit(limit);
  return res.status(200).json(
    successResponse("Users fetched successfully", {
      users,
      pagination: {
        totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        limit,
      },
    }),
  );
});

export const getUserById = asyncHandler(async (req, res) => {
  const id = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid user id"));
  }

  const user = await User.findById(id, { password: 0, __v: 0 });

  if (!user) {
    return res.status(404).json(errorResponse("User not found"));
  }
  return res
    .status(200)
    .json(successResponse("Users fetched successfully", user));
});

export const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query || query.trim() === "") {
    return res.status(400).json(errorResponse("Search query is required"));
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const searchFilter = {
    $and: [
      { _id: { $ne: req.user._id } },
      { _id: { $nin: req.user.blockedUsers || [] } },
      { blockedUsers: { $ne: req.user._id } },
      {
        $or: [
          { fullName: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
      },
    ],
  };

  const totalUsers = await User.countDocuments(searchFilter);

  const users = await User.find(searchFilter)
    .select("fullName email photo")
    .skip(skip)
    .limit(limit);

  return res.status(200).json(
    successResponse("Users fetched successfully", {
      users,
      pagination: {
        totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        limit,
      },
    }),
  );
});

export const editUserProfile = asyncHandler(async (req, res) => {
  const id = req.user._id
 

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid user id"));
  }

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json(errorResponse("User not found"));
  }

  const { fullName, gender, bio } = req.body;
  const photo = req.file;

  if (!fullName && !gender && !bio && !photo) {
    return res
      .status(400)
      .json(errorResponse("At least one field is required to update"));
  }

  if (fullName) {
    if (!isValidName(fullName)) {
      return res
        .status(400)
        .json(errorResponse("Full name must be at least 3 characters long"));
    }
    user.fullName = fullName;
  }

  if (gender) {
    if (!["male", "female"].includes(gender.toLowerCase())) {
      return res
        .status(400)
        .json(errorResponse("Gender must be 'male' or 'female'"));
    }
    user.gender = gender.toLowerCase();
  }

  if (bio) {
    if (bio.length > 150) {
      return res
        .status(400)
        .json(errorResponse("Bio must be less than 150 characters long"));
    }
    user.bio = bio;
  }

  if (photo) {
    console.log('user.photoFileId ',user.photoFileId);
    
    if (user.photoFileId) {
      await imageKit.deleteFile(user.photoFileId);
    }

    const imageUrl = await imageKit.upload({
      file: photo.buffer,
      fileName: photo.originalname,
      folder: "Pingo/Profile",
    });
    user.photo = imageUrl.url;
    user.photoFileId = imageUrl.fileId;
  }

  await user.save();

  return res
    .status(200)
    .json(
      successResponse("User profile updated successfully", {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        bio: user.bio,
        photo: user.photo,
      }),
    );
});

export const blockUser = asyncHandler(async (req, res) => {
  const { blockedUserId } = req.body;

  if (!blockedUserId) {
    return res.status(400).json(errorResponse("Blocked user ID is required"));
  }

  if (!mongoose.Types.ObjectId.isValid(blockedUserId)) {
    return res.status(400).json(errorResponse("Invalid user ID"));
  }

  if (blockedUserId === req.user._id.toString()) {
    return res.status(400).json(errorResponse("You cannot block yourself"));
  }

  const userToBlock = await User.findById(blockedUserId);
  if (!userToBlock) {
    return res.status(404).json(errorResponse("User not found"));
  }

  const currentUser = await User.findById(req.user._id);

  if (currentUser.blockedUsers.includes(blockedUserId)) {
    return res.status(400).json(errorResponse("User already blocked"));
  }

  currentUser.blockedUsers.push(blockedUserId);
  await currentUser.save();

  return res.status(200).json(successResponse("User blocked successfully"));
});

export const unblockUser = asyncHandler(async (req, res) => {
  const { blockedUserId } = req.body;

  if (!blockedUserId) {
    return res.status(400).json(errorResponse("Blocked user ID is required"));
  }

  if (!mongoose.Types.ObjectId.isValid(blockedUserId)) {
    return res.status(400).json(errorResponse("Invalid user ID"));
  }

  const currentUser = await User.findById(req.user._id);

  if (!currentUser.blockedUsers.includes(blockedUserId)) {
    return res.status(400).json(errorResponse("User is not blocked"));
  }

  currentUser.blockedUsers = currentUser.blockedUsers.filter(
    (id) => id.toString() !== blockedUserId
  );
  await currentUser.save();

  return res.status(200).json(successResponse("User unblocked successfully"));
});

export const updatePrivacySettings = asyncHandler(async (req, res) => {
  const { lastSeen, profilePhoto, readReceipts } = req.body;

  const currentUser = await User.findById(req.user._id);
  if (!currentUser) {
    return res.status(404).json(errorResponse("User not found"));
  }

  if (lastSeen) {
    if (!["everyone", "contacts", "nobody"].includes(lastSeen)) {
      return res.status(400).json(errorResponse("Invalid value for lastSeen"));
    }
    currentUser.privacy.lastSeen = lastSeen;
  }

  if (profilePhoto) {
    if (!["everyone", "contacts", "nobody"].includes(profilePhoto)) {
      return res.status(400).json(errorResponse("Invalid value for profilePhoto"));
    }
    currentUser.privacy.profilePhoto = profilePhoto;
  }

  if (readReceipts !== undefined) {
    if (typeof readReceipts !== "boolean") {
      return res.status(400).json(errorResponse("readReceipts must be a boolean"));
    }
    currentUser.privacy.readReceipts = readReceipts;
  }

  await currentUser.save();

  return res.status(200).json(
    successResponse("Privacy settings updated successfully", currentUser.privacy)
  );
});
