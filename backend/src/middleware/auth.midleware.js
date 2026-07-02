import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { errorResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const protectedRoute = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json(errorResponse("Unauthorized. Token missing."));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res
        .status(401)
        .json(errorResponse("User not found."));
    }

    req.user = user;

    next();
  } catch (error) {
    console.log('error ', error.message);
    
    return res
      .status(401)
      .json(errorResponse("Invalid or expired token."));
  }
});