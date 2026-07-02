import User from "../models/user.model.js";
import { errorResponse, successResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}, { password: 0, __v: 0 });
  return res
    .status(200)
    .json(successResponse("Users fetched successfully", users));
});

export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid user id"));
  }

  const user = await User.findById(id, { password: 0, __v: 0 });

  if(!user) {
    return res.status(404).json(errorResponse("User not found"))
  }
  return res
    .status(200)
    .json(successResponse("Users fetched successfully", user));
});


export const searchUsers = asyncHandler(async (req, res) => {
    const {query} = req.query; 

    const users = await User.find({
        $or: [
            { fullName: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } }
        ]
    }, { password: 0, __v: 0 }).select('fullName email photo');

    return res
        .status(200)
        .json(successResponse("Users fetched successfully", users));
});