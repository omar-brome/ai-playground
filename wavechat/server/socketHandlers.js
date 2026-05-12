import { randomUUID } from "node:crypto";

export const ROOMS = ["General", "Tech", "Random"];

const usersBySocket = new Map();
const roomUsers = new Map(ROOMS.map((room) => [room, new Map()]));
const roomMessages = new Map(ROOMS.map((room) => [room, []]));
const typingUsers = new Map(ROOMS.map((room) => [room, new Set()]));

function getRoomUsers(room) {
  return Array.from(roomUsers.get(room)?.values() ?? []);
}

function getRoomMessages(room) {
  return roomMessages.get(room) ?? [];
}

function getTypingUsers(room) {
  return Array.from(typingUsers.get(room) ?? []);
}

function addMessageToHistory(room, message) {
  const messages = roomMessages.get(room);

  if (!messages) {
    return;
  }

  messages.push(message);

  if (messages.length > 50) {
    messages.splice(0, messages.length - 50);
  }
}

function emitRoomUsers(io, room) {
  io.to(room).emit("room_users", { users: getRoomUsers(room) });
}

function emitRoomTypingUsers(io, room) {
  io.to(room).emit("room_typing", { users: getTypingUsers(room) });
}

function createSystemMessage(text) {
  return {
    id: randomUUID(),
    type: "system",
    text,
    timestamp: new Date().toISOString(),
  };
}

function leaveCurrentRoom(io, socket, { notify = true } = {}) {
  const currentUser = usersBySocket.get(socket.id);

  if (!currentUser) {
    return;
  }

  const { room, username } = currentUser;
  const users = roomUsers.get(room);

  users?.delete(socket.id);
  typingUsers.get(room)?.delete(username);
  socket.leave(room);
  usersBySocket.delete(socket.id);

  if (notify) {
    const systemMessage = createSystemMessage(`${username} left the room`);
    socket.to(room).emit("user_left", { username, users: getRoomUsers(room) });
    socket.to(room).emit("receive_message", systemMessage);
    socket.to(room).emit("user_stop_typing", { username });
  }

  emitRoomUsers(io, room);
  emitRoomTypingUsers(io, room);
}

export function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    // Handles joining a room, sends current users and recent history, and announces the join.
    socket.on("join_room", ({ username, room }) => {
      if (!username || !room || !ROOMS.includes(room)) {
        return;
      }

      leaveCurrentRoom(io, socket, { notify: false });

      const trimmedUsername = username.trim();
      const user = { id: socket.id, username: trimmedUsername };
      usersBySocket.set(socket.id, { ...user, room });
      roomUsers.get(room)?.set(socket.id, user);
      socket.join(room);

      const users = getRoomUsers(room);
      socket.emit("room_users", { users });
      socket.emit("message_history", { messages: getRoomMessages(room) });
      socket.emit("room_typing", { users: getTypingUsers(room) });

      const systemMessage = createSystemMessage(`${trimmedUsername} joined the room`);
      socket.to(room).emit("user_joined", { username: trimmedUsername, users });
      io.to(room).emit("receive_message", systemMessage);
      emitRoomUsers(io, room);
    });

    // Handles leaving the active room and updates everyone else's presence list.
    socket.on("leave_room", ({ username, room }) => {
      const currentUser = usersBySocket.get(socket.id);

      if (!currentUser || currentUser.username !== username || currentUser.room !== room) {
        return;
      }

      leaveCurrentRoom(io, socket);
    });

    // Broadcasts a chat message to everyone in the room and stores it in recent history.
    socket.on("send_message", ({ username, room, text, timestamp }) => {
      const currentUser = usersBySocket.get(socket.id);
      const trimmedText = text?.trim();

      if (!currentUser || currentUser.username !== username || currentUser.room !== room || !trimmedText) {
        return;
      }

      const message = {
        id: randomUUID(),
        type: "chat",
        username,
        text: trimmedText,
        timestamp: timestamp || new Date().toISOString(),
      };

      addMessageToHistory(room, message);
      io.to(room).emit("receive_message", message);
    });

    // Tells other people in the room that this user is currently typing.
    socket.on("typing", ({ username, room }) => {
      const currentUser = usersBySocket.get(socket.id);

      if (!currentUser || currentUser.username !== username || currentUser.room !== room) {
        return;
      }

      typingUsers.get(room)?.add(username);
      socket.to(room).emit("user_typing", { username });
      emitRoomTypingUsers(io, room);
    });

    // Tells other people in the room that this user stopped typing.
    socket.on("stop_typing", ({ username, room }) => {
      const currentUser = usersBySocket.get(socket.id);

      if (!currentUser || currentUser.username !== username || currentUser.room !== room) {
        return;
      }

      typingUsers.get(room)?.delete(username);
      socket.to(room).emit("user_stop_typing", { username });
      emitRoomTypingUsers(io, room);
    });

    // Cleans up presence and typing state if the browser tab closes unexpectedly.
    socket.on("disconnect", () => {
      leaveCurrentRoom(io, socket);
    });
  });
}
