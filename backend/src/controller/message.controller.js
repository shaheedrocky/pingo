import mongoose from "mongoose";
import { imageKit } from "../config/imageKit.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { errorResponse, successResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import onlineUsers, { getIO } from "../socket/socket.js";

export const sendMessage = asyncHandler(async (req, res) => {
  const {
    conversationId,
    receiverId,
    type = "text",
    text,
    replyTo,
    duration,
  } = req.body;
  const MAX_FILE_SIZE = 25 * 1024 * 1024;
  const io = getIO();
  const receiverSocketId = onlineUsers.get(receiverId);

  const sender = req.user._id;

  if (!conversationId || !receiverId) {
    return res
      .status(400)
      .json(errorResponse("Conversation and receiver are required"));
  }

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return res.status(400).json(errorResponse("Invalid conversation id"));
  }

  if (!mongoose.Types.ObjectId.isValid(receiverId)) {
    return res.status(400).json(errorResponse("Invalid receiver id"));
  }

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    return res.status(404).json(errorResponse("Conversation not found"));
  }

  const receiver = await User.findById(receiverId);

  if (!receiver) {
    return res.status(404).json(errorResponse("Receiver not found"));
  }

  const receiverInConversation = conversation.participants.some(
    (p) => p.toString() === receiverId,
  );

  if (!receiverInConversation) {
    return res
      .status(400)
      .json(errorResponse("Receiver is not part of this conversation"));
  }

  const senderInConversation = conversation.participants.some(
    (p) => p.toString() === sender.toString(),
  );

  if (!senderInConversation) {
    return res
      .status(403)
      .json(errorResponse("You are not a participant in this conversation"));
  }

  const allowedTypes = [
    "text",
    "image",
    "video",
    "audio",
    "document",
    "gif",
    "sticker",
    "location",
    "contact",
  ];

  const mediaTypes = allowedTypes.filter(
    (type) => !["text", "location", "contact"].includes(type),
  );

  if (!allowedTypes.includes(type)) {
    return res.status(400).json(errorResponse("Invalid message type"));
  }

  if (type === "text" && (!text || !text.trim())) {
    return res.status(400).json(errorResponse("Message text is required"));
  }

  if (mediaTypes.includes(type) && !req.file) {
    return res.status(400).json(errorResponse(`${type} file is required`));
  }

  if (replyTo) {
    if (!mongoose.Types.ObjectId.isValid(replyTo)) {
      return res.status(400).json(errorResponse("Invalid replyTo message id"));
    }
    const replyMessage = await Message.findById(replyTo);
    if (!replyMessage) {
      return res.status(404).json(errorResponse("Reply message not found"));
    }
  }

  let mediaUrl = "";
  let thumbnail = "";
  let fileName = "";
  let fileSize = 0;

  if (req.file) {
    if (req.file.size > MAX_FILE_SIZE) {
      return res
        .status(400)
        .json(errorResponse("File size should not exceed 25MB"));
    }
    const uploadResult = await imageKit.upload({
      file: req.file.buffer,
      fileName: req.file.originalname,
      folder: `Pingo/Messages/${type}`,
    });

    mediaUrl = uploadResult.url;
    thumbnail = uploadResult.thumbnailUrl || "";
    fileName = req.file.originalname;
    fileSize = req.file.size;
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: sender,
    receiver: receiverId,
    type,
    text: text || "",
    mediaUrl,
    thumbnail,
    fileName,
    fileSize,
    duration: Number(duration) || 0,
    replyTo: replyTo || undefined,
    status: "pending",
  });

  conversation.lastMessage = message._id;
  conversation.lastMessageAt = new Date();

  await conversation.save();

  const populatedMessage = await Message.findById(message._id)
    .populate("sender", "fullName email photo")
    .populate("receiver", "fullName email photo")
    .populate({
      path: "replyTo",
      populate: {
        path: "sender",
        select: "fullName photo",
      },
    });

  if (receiverSocketId) {
    message.status = "delivered";
    await message.save();
    populatedMessage.status = "delivered";

    io.to(receiverSocketId).emit("new-message", populatedMessage);
  }
  return res
    .status(201)
    .json(successResponse("Message sent successfully", populatedMessage));
});

export const getmessages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid conversation id"));
  }

  const conversation = await Conversation.findById(id);

  if (!conversation) {
    return res.status(404).json(errorResponse("Conversation not found"));
  }

  const isParticipant = conversation.participants.some(
    (participant) => participant.toString() === req.user._id.toString(),
  );

  if (!isParticipant) {
    return res
      .status(403)
      .json(errorResponse("You are not a participant in this conversation"));
  }

  const skip = (Number(page) - 1) * Number(limit);

  const filter = {
    conversation: id,
    isDeleted: false,
    deletedFor: { $ne: req.user._id },
  };

  const totalMessages = await Message.countDocuments(filter);

  const messages = await Message.find(filter)
    .populate("sender", "fullName photo")
    .populate("receiver", "fullName photo")
    .populate({
      path: "replyTo",
      populate: {
        path: "sender",
        select: "fullName photo",
      },
    })
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(Number(limit));

  const enrichedMessages = messages.map((msg) => {
    const msgObj = msg.toObject();
    msgObj.isStarred = msg.starredBy ? msg.starredBy.some(
      (uid) => uid.toString() === req.user._id.toString()
    ) : false;
    delete msgObj.starredBy;
    return msgObj;
  });

  return res.status(200).json(
    successResponse("Messages fetched successfully", {
      messages: enrichedMessages,
      pagination: {
        totalMessages,
        currentPage: Number(page),
        totalPages: Math.ceil(totalMessages / Number(limit)),
        limit: Number(limit),
      },
    }),
  );
});

export const editMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const fifteenMinutes = 15 * 60 * 1000;
  const oneDay = 24 * 60 * 60 * 1000;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid message id"));
  }

  if (!text || !text.trim()) {
    return res.status(400).json(errorResponse("Message text is required"));
  }

  const message = await Message.findById(id);

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json(errorResponse("User not found"));
  }

  if (!message) {
    return res.status(404).json(errorResponse("Message not found"));
  }

  if (message.isDeleted) {
    return res.status(400).json(errorResponse("Cannot edit a deleted message"));
  }

  if (message.sender.toString() !== user._id.toString()) {
    return res
      .status(403)
      .json(errorResponse("You can edit only your own messages"));
  }

  if (message.type !== "text") {
    return res
      .status(400)
      .json(errorResponse("Only text messages can be edited"));
  }

  const editLimit = user.isPremiumUser ? oneDay : fifteenMinutes;

  if (Date.now() - message.createdAt.getTime() > editLimit) {
    return res.status(400).json(errorResponse("Edit time has expired"));
  }

  message.text = text;
  message.isEdited = true;

  await message.save();

  return res
    .status(200)
    .json(successResponse("Message updated successfully", message));
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid message id"));
  }

  const message = await Message.findById(id);

  if (!message) {
    return res.status(404).json(errorResponse("Message not found"));
  }

  if (message.sender.toString() !== req.user._id.toString()) {
    return res
      .status(403)
      .json(errorResponse("You can delete only your own messages"));
  }

  if (message.isDeleted) {
    return res.status(400).json(errorResponse("Message already deleted"));
  }
  message.isDeleted = true;
  message.text = "This message was deleted";

  message.mediaUrl = "";
  message.thumbnail = "";
  message.fileName = "";
  message.fileSize = 0;
  message.duration = 0;
  message.replyTo = undefined;

  await message.save();

  return res
    .status(200)
    .json(successResponse("Message deleted successfully", message));
});

export const reactToMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { emoji } = req.body;
  const io = getIO();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid message id"));
  }

  if (!emoji) {
    return res.status(400).json(errorResponse("Emoji is required"));
  }

  const message = await Message.findById(id);

  if (!message) {
    return res.status(404).json(errorResponse("Message not found"));
  }

  const existingReaction = message.reactions.find(
    (reaction) => reaction.userId.toString() === req.user._id.toString(),
  );

  if (existingReaction) {
    if (existingReaction.emoji === emoji) {
      // Toggle off reaction if the same emoji is clicked again
      message.reactions = message.reactions.filter(
        (r) => r.userId.toString() !== req.user._id.toString()
      );
    } else {
      existingReaction.emoji = emoji;
    }
  } else {
    message.reactions.push({
      userId: req.user._id,
      emoji,
    });
  }

  await message.save();

  const receiverSocketId = onlineUsers.get(message.receiver.toString());
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("reaction-updated", { messageId: id, reactions: message.reactions });
  }

  const updatedMessage = await Message.findById(id).populate(
    "reactions.userId",
    "fullName photo",
  );

  return res
    .status(200)
    .json(successResponse("Reaction updated successfully", updatedMessage));
});

export const deleteForMe = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid message id"));
  }

  const message = await Message.findById(id);
  if (!message) {
    return res.status(404).json(errorResponse("Message not found"));
  }

  if (!message.deletedFor.some((uid) => uid.toString() === req.user._id.toString())) {
    message.deletedFor.push(req.user._id);
    await message.save();
  }

  return res.status(200).json(successResponse("Message deleted for me successfully"));
});

export const toggleStarMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid message id"));
  }

  const message = await Message.findById(id);
  if (!message) {
    return res.status(404).json(errorResponse("Message not found"));
  }

  const isStarred = message.starredBy.some(
    (uid) => uid.toString() === req.user._id.toString()
  );

  if (isStarred) {
    message.starredBy = message.starredBy.filter(
      (uid) => uid.toString() !== req.user._id.toString()
    );
  } else {
    message.starredBy.push(req.user._id);
  }

  await message.save();

  return res.status(200).json(
    successResponse(
      isStarred ? "Message unstarred successfully" : "Message starred successfully",
      { isStarred: !isStarred }
    )
  );
});

export const togglePinMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid message id"));
  }

  const message = await Message.findById(id);
  if (!message) {
    return res.status(404).json(errorResponse("Message not found"));
  }

  const isPinned = message.isPinned;
  message.isPinned = !isPinned;
  message.pinnedAt = !isPinned ? new Date() : null;

  await message.save();

  return res.status(200).json(
    successResponse(
      isPinned ? "Message unpinned successfully" : "Message pinned successfully",
      { isPinned: !isPinned, pinnedAt: message.pinnedAt }
    )
  );
});

export const forwardMessage = asyncHandler(async (req, res) => {
  const { messageIds, conversationId } = req.body;

  if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
    return res.status(400).json(errorResponse("Message IDs array is required"));
  }

  if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
    return res.status(400).json(errorResponse("Invalid target conversation ID"));
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json(errorResponse("Target conversation not found"));
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === req.user._id.toString()
  );
  if (!isParticipant) {
    return res.status(403).json(errorResponse("Access denied"));
  }

  const receiverId = conversation.participants.find(
    (p) => p.toString() !== req.user._id.toString()
  );

  const messagesToForward = await Message.find({
    _id: { $in: messageIds },
    isDeleted: false,
  });

  if (messagesToForward.length === 0) {
    return res.status(404).json(errorResponse("No valid messages found to forward"));
  }

  const forwardedMessages = [];
  for (const msg of messagesToForward) {
    const newMsg = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      receiver: receiverId,
      type: msg.type,
      text: msg.text,
      mediaUrl: msg.mediaUrl,
      thumbnail: msg.thumbnail,
      fileName: msg.fileName,
      fileSize: msg.fileSize,
      duration: msg.duration,
      status: "pending",
    });
    forwardedMessages.push(newMsg);
  }

  const lastMsg = forwardedMessages[forwardedMessages.length - 1];
  conversation.lastMessage = lastMsg._id;
  conversation.lastMessageAt = new Date();
  await conversation.save();

  const io = getIO();
  const receiverSocketId = onlineUsers.get(receiverId.toString());
  if (receiverSocketId) {
    forwardedMessages.forEach((msg) => {
      io.to(receiverSocketId).emit("new-message", msg);
    });
  }

  return res.status(201).json(
    successResponse("Messages forwarded successfully", forwardedMessages)
  );
});
