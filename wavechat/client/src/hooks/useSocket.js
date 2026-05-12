import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export function useSocket(username, activeRoom) {
  const socketRef = useRef(null);
  const currentRoomRef = useRef(null);
  const usernameRef = useRef(username);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  const removeTypingUser = useCallback((typingUsername) => {
    setTypingUsers((currentTypingUsers) =>
      currentTypingUsers.filter((currentUsername) => currentUsername !== typingUsername),
    );
  }, []);

  useEffect(() => {
    if (!username) {
      setIsConnected(false);
      setMessages([]);
      setUsers([]);
      setTypingUsers([]);
      currentRoomRef.current = null;
      return undefined;
    }

    const socket = io();
    socketRef.current = socket;

    const handleConnect = () => {
      setIsConnected(true);

      if (currentRoomRef.current) {
        socket.emit("join_room", {
          username: usernameRef.current,
          room: currentRoomRef.current,
        });
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setUsers([]);
      setTypingUsers([]);
    };

    const handleMessageHistory = ({ messages: roomMessages = [] }) => {
      setMessages(roomMessages);
    };

    const handleReceiveMessage = (message) => {
      setMessages((currentMessages) => [...currentMessages, message]);
    };

    const handleRoomUsers = ({ users: roomUsers = [] }) => {
      setUsers(roomUsers);
    };

    const handleUserJoined = ({ users: roomUsers = [] }) => {
      setUsers(roomUsers);
    };

    const handleUserLeft = ({ username: leavingUsername, users: roomUsers = [] }) => {
      setUsers(roomUsers);
      removeTypingUser(leavingUsername);
    };

    const handleUserTyping = ({ username: typingUsername }) => {
      if (!typingUsername || typingUsername === usernameRef.current) {
        return;
      }

      setTypingUsers((currentTypingUsers) =>
        currentTypingUsers.includes(typingUsername)
          ? currentTypingUsers
          : [...currentTypingUsers, typingUsername],
      );
    };

    const handleUserStopTyping = ({ username: typingUsername }) => {
      removeTypingUser(typingUsername);
    };

    const handleRoomTyping = ({ users: roomTypingUsers = [] }) => {
      const otherTypingUsers = roomTypingUsers.filter(
        (typingUsername) => typingUsername !== usernameRef.current,
      );

      setTypingUsers(otherTypingUsers);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("message_history", handleMessageHistory);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("room_users", handleRoomUsers);
    socket.on("user_joined", handleUserJoined);
    socket.on("user_left", handleUserLeft);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);
    socket.on("room_typing", handleRoomTyping);

    return () => {
      if (currentRoomRef.current) {
        socket.emit("leave_room", {
          username: usernameRef.current,
          room: currentRoomRef.current,
        });
      }

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("message_history", handleMessageHistory);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("room_users", handleRoomUsers);
      socket.off("user_joined", handleUserJoined);
      socket.off("user_left", handleUserLeft);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
      socket.off("room_typing", handleRoomTyping);
      socket.disconnect();
      socketRef.current = null;
      currentRoomRef.current = null;
    };
  }, [removeTypingUser, username]);

  useEffect(() => {
    const socket = socketRef.current;

    if (!socket || !username || !activeRoom) {
      return;
    }

    const previousRoom = currentRoomRef.current;

    if (previousRoom === activeRoom) {
      return;
    }

    if (previousRoom) {
      socket.emit("leave_room", { username, room: previousRoom });
    }

    setMessages([]);
    setUsers([]);
    setTypingUsers([]);
    currentRoomRef.current = activeRoom;

    if (socket.connected) {
      socket.emit("join_room", { username, room: activeRoom });
    }
  }, [activeRoom, username]);

  const joinRoom = useCallback(
    (room) => {
      if (!socketRef.current || !username || !room) {
        return;
      }

      socketRef.current.emit("join_room", { username, room });
      currentRoomRef.current = room;
    },
    [username],
  );

  const leaveRoom = useCallback(
    (room = currentRoomRef.current) => {
      if (!socketRef.current || !username || !room) {
        return;
      }

      socketRef.current.emit("leave_room", { username, room });

      if (currentRoomRef.current === room) {
        currentRoomRef.current = null;
      }
    },
    [username],
  );

  const sendMessage = useCallback(
    (text) => {
      const room = currentRoomRef.current;

      if (!socketRef.current || !username || !room || !text.trim()) {
        return;
      }

      socketRef.current.emit("send_message", {
        username,
        room,
        text,
        timestamp: new Date().toISOString(),
      });
    },
    [username],
  );

  const sendTyping = useCallback(() => {
    const room = currentRoomRef.current;

    if (!socketRef.current || !username || !room) {
      return;
    }

    socketRef.current.emit("typing", { username, room });
  }, [username]);

  const sendStopTyping = useCallback(() => {
    const room = currentRoomRef.current;

    if (!socketRef.current || !username || !room) {
      return;
    }

    socketRef.current.emit("stop_typing", { username, room });
  }, [username]);

  return {
    isConnected,
    messages,
    users,
    typingUsers,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
    sendStopTyping,
  };
}
