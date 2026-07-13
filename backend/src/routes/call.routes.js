import express from "express";
import {
  startCallLog,
  updateCallStatus,
  getCallHistory,
} from "../controller/call.controller.js";
import { protectedRoute } from "../middleware/auth.midleware.js";

const router = express.Router();

router.use(protectedRoute);

router.post("/", startCallLog);
router.put("/:id", updateCallStatus);
router.get("/history", getCallHistory);

export default router;
