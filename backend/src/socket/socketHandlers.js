import User from "../models/user.model.js";
import onlineUsers from "./socket.js";

export default function registerSocketHandlers(io, socket) {
  socket.on("join", async (userId) => {
    try {
      onlineUsers.set(userId, socket.id);

      const user = await User.findByIdAndUpdate(userId, {
        isOnline: true,
      },{new: true});

      io.emit("user-online", userId);

      console.log(`${user.fullName} - ${userId} Connected`);
    } catch (error) {
      console.log("connect - socket: ", error);
    }
  });

  socket.on("disconnect", async () => {
    try {
      let disconnectedUserId = null;

      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          onlineUsers.delete(userId);
          break;
        }
      }

      if (disconnectedUserId) {
        await User.findByIdAndUpdate(disconnectedUserId, {
          isOnline: false,
          lastSeen: new Date(),
        });
      }

      io.emit("user-offline", disconnectedUserId);
      console.log(`${disconnectedUserId} disconnected`);
    } catch (error) {
      console.log("disconnect - socket: ", error);
    }
  });
}
