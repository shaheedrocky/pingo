import express from "express";
import {
  createGroup,
  getGroups,
  getGroupById,
  addMembers,
  removeMember,
  promoteAdmin,
  demoteAdmin,
  leaveGroup,
  deleteGroup,
  updateGroupProfile,
  getInviteLink,
  joinByInviteCode,
} from "../controller/group.controller.js";
import { protectedRoute } from "../middleware/auth.midleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.use(protectedRoute);

router.post("/", upload.single("image"), createGroup);
router.get("/", getGroups);
router.get("/:id", getGroupById);
router.post("/:id/members", addMembers);
router.delete("/:id/members/:memberId", removeMember);
router.put("/:id/admins/:memberId/promote", promoteAdmin);
router.put("/:id/admins/:memberId/demote", demoteAdmin);
router.post("/:id/leave", leaveGroup);
router.delete("/:id", deleteGroup);
router.put("/:id/profile", upload.single("image"), updateGroupProfile);
router.get("/:id/invite", getInviteLink);
router.post("/join/:inviteCode", joinByInviteCode);

export default router;
