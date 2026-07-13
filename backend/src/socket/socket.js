import { Server } from "socket.io";
import registerSocketHandlers from "./socketHandlers.js";

const onlineUsers = new Map();

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket Connection: ", socket.id);

    registerSocketHandlers(io, socket);
  });
};

export const getIO = () => io;


export default onlineUsers;
