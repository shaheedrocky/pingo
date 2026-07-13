import express from "express";
import {
  createConversation,
  getConversations,
  getConversationById,
  deleteConversationById,
  archiveConversation,
  muteConversation,
  pinConversation,
  clearConversation,
  markAsRead,
  markAsUnread,
} from "../controller/conversation.controller.js";
import { protectedRoute } from "../middleware/auth.midleware.js";

const router = express.Router();

router.use(protectedRoute);

router.post("/", createConversation);
router.get("/", getConversations);
router.get("/:id", getConversationById);
router.delete("/:id", deleteConversationById);
router.put("/:id/archive", archiveConversation);
router.put("/:id/mute", muteConversation);
router.put("/:id/pin", pinConversation);
router.delete("/:id/clear", clearConversation);
router.put("/:id/read", markAsRead);
router.put("/:id/unread", markAsUnread);

export default router;