/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Multiplayer Matchmaking
  let waitingPlayer: any = null;
  const activeRooms = new Map<string, any>();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_matchmaking", (userData) => {
      if (waitingPlayer && waitingPlayer.id !== socket.id) {
        // ... existing match logic ...
        const roomID = `room_${waitingPlayer.id}_${socket.id}`;
        const opponent = waitingPlayer;
        waitingPlayer = null;
        if (opponent.timeout) clearTimeout(opponent.timeout);

        socket.join(roomID);
        opponent.socket.join(roomID);

        const matchData = {
          roomID,
          players: [
            { id: opponent.id, name: opponent.name, level: opponent.level },
            { id: socket.id, name: userData.name, level: userData.level }
          ],
          seed: Math.random()
        };

        activeRooms.set(roomID, matchData);
        io.to(roomID).emit("match_found", matchData);
      } else {
        const timeout = setTimeout(() => {
          if (waitingPlayer?.id === socket.id) {
            const roomID = `bot_room_${socket.id}`;
            waitingPlayer = null;
            socket.join(roomID);
            
            const matchData = {
              roomID,
              players: [
                { id: "bot_123", name: "CandyBot 🤖", level: userData.level + 2, isBot: true },
                { id: socket.id, name: userData.name, level: userData.level }
              ],
              seed: Math.random()
            };
            socket.emit("match_found", matchData);
          }
        }, 5000); // 5 seconds wait for bot

        waitingPlayer = { id: socket.id, socket, timeout, ...userData };
        socket.emit("waiting_for_opponent");
      }
    });

    socket.on("game_update", (data) => {
      const { roomID, score, movesLeft, board } = data;
      // Store board state for validation if needed
      const room = activeRooms.get(roomID);
      if (room) {
        if (!room.states) room.states = new Map();
        room.states.set(socket.id, { score, movesLeft, board });
      }
      socket.to(roomID).emit("opponent_update", { score, movesLeft, board });
    });

    socket.on("chat_message", (data) => {
      const { roomID, message, senderName } = data;
      socket.to(roomID).emit("receive_chat", { message, senderName, timestamp: Date.now() });
    });

    socket.on("rematch_request", (data) => {
      const { roomID } = data;
      socket.to(roomID).emit("rematch_offered");
    });

    socket.on("rematch_accept", (data) => {
      const { roomID } = data;
      const newSeed = Math.random();
      io.to(roomID).emit("rematch_start", { seed: newSeed });
    });

    socket.on("leave_room", (data) => {
      const { roomID } = data;
      socket.to(roomID).emit("opponent_left");
      socket.leave(roomID);
      activeRooms.delete(roomID);
    });

    socket.on("disconnect", () => {
      if (waitingPlayer?.id === socket.id) {
        waitingPlayer = null;
      }
      // Find rooms where this socket was a participant
      for (const [roomID, room] of activeRooms.entries()) {
        const isParticipant = room.players.some((p: any) => p.id === socket.id);
        if (isParticipant) {
          socket.to(roomID).emit("opponent_disconnected");
          activeRooms.delete(roomID);
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
