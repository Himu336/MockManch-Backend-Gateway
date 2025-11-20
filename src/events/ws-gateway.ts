import { Server } from "socket.io";

let io: Server;

export const initWebSocket = (httpServer: any) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*", // later restrict this to your frontend domain
      methods: ["GET", "POST"],
    },
  });

  console.log("⚡ WebSocket server initialized");

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // USER JOINS ROOM
    socket.on("joinRoom", ({ room_id, user_id }) => {
      socket.join(room_id);

      console.log(`🟢 User ${user_id} joined room ${room_id}`);

      // Notify others
      socket.to(room_id).emit("userJoined", {
        user_id,
        socket_id: socket.id,
      });
    });

    // USER LEAVES ROOM
    socket.on("leaveRoom", ({ room_id, user_id }) => {
      socket.leave(room_id);

      console.log(`🔴 User ${user_id} left room ${room_id}`);

      socket.to(room_id).emit("userLeft", {
        user_id,
        socket_id: socket.id,
      });
    });

    // DISCONNECT
    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
};

export const getIO = () => io;
