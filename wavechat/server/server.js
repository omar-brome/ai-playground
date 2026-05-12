import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./socketHandlers.js";

const PORT = process.env.PORT || 3001;

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.get("/", (_req, res) => {
  res.json({ status: "Wavechat server is running" });
});

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`Wavechat server listening on http://localhost:${PORT}`);
});
