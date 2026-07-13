import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import Conversation from "../models/conversation.model.js";
import { errorResponse, successResponse } from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";

export const createConversation = asyncHandler(async (req, res) => {
  const { receiverId } = req.body;
  const loggedUserId = req.user._id;

  if (!receiverId) {
    return res.status(400).json(errorResponse("Receiver id is required"));
  }

  if (!mongoose.Types.ObjectId.isValid(receiverId)) {
    return res.status(400).json(errorResponse("Invalid receiver id"));
  }

  if (loggedUserId.toString() === receiverId) {
    return res
      .status(400)
      .json(errorResponse("You cannot create a conversation with yourself"));
  }

  const receiver = await User.findById(receiverId);

  if (!receiver) {
    return res.status(404).json(errorResponse("Receiver not found"));
  }

  const existingConversation = await Conversation.findOne({
    participants: {
      $all: [loggedUserId, receiverId],
    },
  })
    .populate("participants", "fullName email photo isOnline lastSeen")
    .populate("lastMessage");

  if (existingConversation) {
    return res
      .status(200)
      .json(
        successResponse("Conversation already exists", existingConversation),
      );
  }

  const conversation = await Conversation.create({
    participants: [loggedUserId, receiverId],
  });

  const populatedConversation = await Conversation.findById(conversation._id)
    .populate("participants", "fullName email photo isOnline lastSeen")
    .populate("lastMessage");

  return res
    .status(201)
    .json(
      successResponse(
        "Conversation created successfully",
        populatedConversation,
      ),
    );
});

export const getConversations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, showArchived = "false" } = req.query;
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const isArchivedQuery = showArchived === "true";
  const filter = {
    participants: req.user._id,
    archivedBy: isArchivedQuery ? req.user._id : { $ne: req.user._id },
  };

  const totalConversations = await Conversation.countDocuments(filter);

  const conversations = await Conversation.find(filter)
    .populate("participants", "fullName email photo")
    .populate("lastMessage")
    .sort({ lastMessageAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const enrichedConversations = await Promise.all(
    conversations.map(async (conv) => {
      const convObj = conv.toObject();
      const lastReadEntry = conv.lastRead ? conv.lastRead.find(
        (lr) => lr.userId.toString() === req.user._id.toString()
      ) : null;
      const lastReadAt = lastReadEntry ? lastReadEntry.lastReadAt : new Date(0);

      const unreadCount = await Message.countDocuments({
        conversation: conv._id,
        sender: { $ne: req.user._id },
        createdAt: { $gt: lastReadAt },
        deletedFor: { $ne: req.user._id },
        isDeleted: false,
      });

      convObj.isArchived = conv.archivedBy ? conv.archivedBy.some(id => id.toString() === req.user._id.toString()) : false;
      convObj.isMuted = conv.mutedBy ? conv.mutedBy.some(id => id.toString() === req.user._id.toString()) : false;
      convObj.isPinned = conv.pinnedBy ? conv.pinnedBy.some(id => id.toString() === req.user._id.toString()) : false;
      convObj.unreadCount = unreadCount;

      delete convObj.archivedBy;
      delete convObj.mutedBy;
      delete convObj.pinnedBy;
      delete convObj.lastRead;

      return convObj;
    })
  );

  // Sort pinned conversations to the top
  enrichedConversations.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
  });

  return res
    .status(200)
    .json(successResponse("Conversations fetched successfully", enrichedConversations));
});

export const getConversationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid conversation id"));
  }

  const conversation = await Conversation.findById(id)
    .populate("participants", "fullName email photo")
    .populate("lastMessage");

  if (!conversation) {
    return res.status(404).json(errorResponse("Conversation not found"));
  }

  const isParticipant = conversation.participants.some(
    (participant) => participant._id.toString() === req.user._id.toString(),
  );

  if (!isParticipant) {
    return res.status(403).json(errorResponse("Access denied"));
  }

  const convObj = conversation.toObject();
  const lastReadEntry = conversation.lastRead ? conversation.lastRead.find(
    (lr) => lr.userId.toString() === req.user._id.toString()
  ) : null;
  const lastReadAt = lastReadEntry ? lastReadEntry.lastReadAt : new Date(0);

  const unreadCount = await Message.countDocuments({
    conversation: conversation._id,
    sender: { $ne: req.user._id },
    createdAt: { $gt: lastReadAt },
    deletedFor: { $ne: req.user._id },
    isDeleted: false,
  });

  convObj.isArchived = conversation.archivedBy ? conversation.archivedBy.some(id => id.toString() === req.user._id.toString()) : false;
  convObj.isMuted = conversation.mutedBy ? conversation.mutedBy.some(id => id.toString() === req.user._id.toString()) : false;
  convObj.isPinned = conversation.pinnedBy ? conversation.pinnedBy.some(id => id.toString() === req.user._id.toString()) : false;
  convObj.unreadCount = unreadCount;

  delete convObj.archivedBy;
  delete convObj.mutedBy;
  delete convObj.pinnedBy;
  delete convObj.lastRead;

  return res
    .status(200)
    .json(successResponse("Conversation fetched successfully", convObj));
});

export const deleteConversationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid conversation id"));
  }

  const conversation = await Conversation.findById(id);

  if (!conversation) {
    return res.status(404).json(errorResponse("Conversation not found"));
  }

  const isParticipant = conversation.participants.some(
    (participant) => participant._id.toString() === req.user._id.toString(),
  );

  if (!isParticipant) {
    return res.status(403).json(errorResponse("Access denied"));
  }

  await conversation.deleteOne();

  return res
    .status(200)
    .json(successResponse("Conversation deleted successfully"));
});

export const archiveConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid conversation id"));
  }

  const conversation = await Conversation.findById(id);
  if (!conversation) {
    return res.status(404).json(errorResponse("Conversation not found"));
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === req.user._id.toString()
  );
  if (!isParticipant) {
    return res.status(403).json(errorResponse("Access denied"));
  }

  const isArchived = conversation.archivedBy.some(
    (uid) => uid.toString() === req.user._id.toString()
  );

  if (isArchived) {
    conversation.archivedBy = conversation.archivedBy.filter(
      (uid) => uid.toString() !== req.user._id.toString()
    );
  } else {
    conversation.archivedBy.push(req.user._id);
  }

  await conversation.save();

  return res.status(200).json(
    successResponse(
      isArchived
        ? "Conversation unarchived successfully"
        : "Conversation archived successfully",
      { isArchived: !isArchived }
    )
  );
});

export const muteConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid conversation id"));
  }

  const conversation = await Conversation.findById(id);
  if (!conversation) {
    return res.status(404).json(errorResponse("Conversation not found"));
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === req.user._id.toString()
  );
  if (!isParticipant) {
    return res.status(403).json(errorResponse("Access denied"));
  }

  const isMuted = conversation.mutedBy.some(
    (uid) => uid.toString() === req.user._id.toString()
  );

  if (isMuted) {
    conversation.mutedBy = conversation.mutedBy.filter(
      (uid) => uid.toString() !== req.user._id.toString()
    );
  } else {
    conversation.mutedBy.push(req.user._id);
  }

  await conversation.save();

  return res.status(200).json(
    successResponse(
      isMuted
        ? "Conversation unmuted successfully"
        : "Conversation muted successfully",
      { isMuted: !isMuted }
    )
  );
});

export const pinConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid conversation id"));
  }

  const conversation = await Conversation.findById(id);
  if (!conversation) {
    return res.status(404).json(errorResponse("Conversation not found"));
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === req.user._id.toString()
  );
  if (!isParticipant) {
    return res.status(403).json(errorResponse("Access denied"));
  }

  const isPinned = conversation.pinnedBy.some(
    (uid) => uid.toString() === req.user._id.toString()
  );

  if (isPinned) {
    conversation.pinnedBy = conversation.pinnedBy.filter(
      (uid) => uid.toString() !== req.user._id.toString()
    );
  } else {
    conversation.pinnedBy.push(req.user._id);
  }

  await conversation.save();

  return res.status(200).json(
    successResponse(
      isPinned
        ? "Conversation unpinned successfully"
        : "Conversation pinned successfully",
      { isPinned: !isPinned }
    )
  );
});

export const clearConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid conversation id"));
  }

  const conversation = await Conversation.findById(id);
  if (!conversation) {
    return res.status(404).json(errorResponse("Conversation not found"));
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === req.user._id.toString()
  );
  if (!isParticipant) {
    return res.status(403).json(errorResponse("Access denied"));
  }

  await Message.updateMany(
    { conversation: id, deletedFor: { $ne: req.user._id } },
    { $addToSet: { deletedFor: req.user._id } }
  );

  return res.status(200).json(successResponse("Conversation cleared successfully"));
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid conversation id"));
  }

  const conversation = await Conversation.findById(id);
  if (!conversation) {
    return res.status(404).json(errorResponse("Conversation not found"));
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === req.user._id.toString()
  );
  if (!isParticipant) {
    return res.status(403).json(errorResponse("Access denied"));
  }

  const lastReadEntry = conversation.lastRead.find(
    (lr) => lr.userId.toString() === req.user._id.toString()
  );

  if (lastReadEntry) {
    lastReadEntry.lastReadAt = new Date();
  } else {
    conversation.lastRead.push({
      userId: req.user._id,
      lastReadAt: new Date(),
    });
  }

  await conversation.save();

  await Message.updateMany(
    { conversation: id, receiver: req.user._id, status: { $ne: "seen" } },
    { status: "seen" }
  );

  return res.status(200).json(successResponse("Conversation marked as read"));
});

export const markAsUnread = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid conversation id"));
  }

  const conversation = await Conversation.findById(id);
  if (!conversation) {
    return res.status(404).json(errorResponse("Conversation not found"));
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === req.user._id.toString()
  );
  if (!isParticipant) {
    return res.status(403).json(errorResponse("Access denied"));
  }

  const lastReadEntry = conversation.lastRead.find(
    (lr) => lr.userId.toString() === req.user._id.toString()
  );

  let lastReadAt = new Date(0);
  if (conversation.lastMessage) {
    const lastMsg = await Message.findById(conversation.lastMessage);
    if (lastMsg) {
      lastReadAt = new Date(lastMsg.createdAt.getTime() - 1000);
    }
  }

  if (lastReadEntry) {
    lastReadEntry.lastReadAt = lastReadAt;
  } else {
    conversation.lastRead.push({
      userId: req.user._id,
      lastReadAt: lastReadAt,
    });
  }

  await conversation.save();

  return res.status(200).json(successResponse("Conversation marked as unread"));
});
