import express from "express";
import {
  sendMessage,
  getmessages,
  editMessage,
  deleteMessage,
  reactToMessage,
  deleteForMe,
  toggleStarMessage,
  togglePinMessage,
  forwardMessage,
} from "../controller/message.controller.js";
import { protectedRoute } from "../middleware/auth.midleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.use(protectedRoute);

router.post("/send", upload.single("media"), sendMessage);
router.get("/:id", getmessages);
router.put("/:id", editMessage);
router.delete("/delete-message/:id", deleteMessage);
router.patch("/react-message/:id", reactToMessage);
router.delete("/delete-for-me/:id", deleteForMe);
router.patch("/star-message/:id", toggleStarMessage);
router.patch("/pin-message/:id", togglePinMessage);
router.post("/forward", forwardMessage);

export default router;
