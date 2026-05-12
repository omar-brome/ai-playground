# Wavechat

Wavechat is a full-stack real-time chat learning project built with React, Vite, Tailwind CSS, Node.js, Express, and Socket.io.

It is intentionally database-free: rooms, users, typing state, and recent chat history are kept in memory on the server so the WebSocket concepts stay easy to follow.

## What It Demonstrates

- Lightweight username-based auth with `localStorage`
- Socket.io room join/leave flow
- One-room-at-a-time room switching
- Real-time messaging
- Online user presence per room
- Live "user is typing..." indicators
- System join/leave messages
- Last 50 real chat messages per room stored in memory
- Clean split between React UI components and socket logic

## Tech Stack

### Client

- React 19
- Vite 8
- Tailwind CSS 4 via `@tailwindcss/vite`
- Socket.io Client

### Server

- Node.js ES modules
- Express
- Socket.io
- In-memory state with `Map` and `Set`

## Project Structure

```text
wavechat/
  client/
    index.html
    vite.config.js
    src/
      App.jsx
      index.css
      main.jsx
      hooks/
        useSocket.js
      components/
        Sidebar.jsx
        RoomList.jsx
        UserList.jsx
        ChatWindow.jsx
        MessageList.jsx
        Message.jsx
        TypingIndicator.jsx
        InputBar.jsx
  server/
    server.js
    socketHandlers.js
```

## Features

### Auth

There are no accounts or passwords. On first load, the user enters a username. The client stores it in React state and persists it to `localStorage` as `wavechat.username`.

Signing out clears the stored username, returns to the username screen, and lets the socket cleanup leave the current room.

### Rooms

Rooms are hardcoded on the client and server:

- `General`
- `Tech`
- `Random`

A user can only be in one room at a time. Switching rooms emits `leave_room` for the previous room and `join_room` for the new room.

### Messaging

Messages include:

- Avatar initial
- Username
- Timestamp
- Message text

Your own messages render with a different alignment and accent color. The feed auto-scrolls to the newest message.

### Presence

The server tracks users by `socket.id` and room. Each room has an online list that updates when users join, leave, sign out, or disconnect.

### Typing Indicator

Typing state is room-scoped. When a user starts typing, the client emits `typing`; when the input is sent, cleared, or unmounted, it emits `stop_typing`.

The server broadcasts both individual typing events and a room-level `room_typing` state so newly joined clients and existing clients stay in sync.

### System Messages

Join and leave events show subtle system messages in the active chat feed:

```text
Omar joined the room
Omar left the room
```

System messages are live-only. They are not saved into message history, so signing in again does not replay old join/leave noise.

### In-Memory History

The server stores the last 50 real chat messages per room. Late joiners receive that recent history on `join_room`.

Because there is no database, all server state resets when the backend restarts.

## Socket Events

### Client Emits

| Event | Payload | Purpose |
| --- | --- | --- |
| `join_room` | `{ username, room }` | Join a room and receive users/history |
| `leave_room` | `{ username, room }` | Leave the current room |
| `send_message` | `{ username, room, text, timestamp }` | Send a chat message |
| `typing` | `{ username, room }` | Mark user as typing |
| `stop_typing` | `{ username, room }` | Clear typing state |

### Server Emits

| Event | Payload | Purpose |
| --- | --- | --- |
| `receive_message` | `{ id, type, username?, text, timestamp }` | Deliver chat or system message |
| `message_history` | `{ messages: [] }` | Send recent room messages on join |
| `user_joined` | `{ username, users: [] }` | Notify room of a join |
| `user_left` | `{ username, users: [] }` | Notify room of a leave |
| `room_users` | `{ users: [] }` | Sync online users in the active room |
| `user_typing` | `{ username }` | Notify others that a user started typing |
| `user_stop_typing` | `{ username }` | Notify others that a user stopped typing |
| `room_typing` | `{ users: [] }` | Sync current typing users in the room |

## Getting Started

Run the backend and frontend in separate terminals.

### Backend

```bash
cd /Users/omarbrome/Documents/Codes/ai-playground/wavechat/server
npm install
node server.js
```

The server runs on:

```text
http://localhost:3001
```

### Frontend

```bash
cd /Users/omarbrome/Documents/Codes/ai-playground/wavechat/client
npm install
npm run dev
```

The Vite app runs on:

```text
http://localhost:5173
```

The Vite dev server proxies `/socket.io` to `http://localhost:3001`, so the client can connect to Socket.io without browser CORS issues during development.

## Verification

Open two browser tabs at `http://localhost:5173`, sign in as two different usernames, then verify:

- Both users appear in the online list for the active room
- Messages appear instantly in both tabs
- Your own messages have distinct styling
- Typing indicators appear for the other user while draft text remains in the input
- Switching rooms updates presence and message history
- Signing out removes the user from the room

Build the client:

```bash
cd /Users/omarbrome/Documents/Codes/ai-playground/wavechat/client
npm run build
```

## Learning Notes

The main learning boundary is:

- `client/src/hooks/useSocket.js` owns all client-side Socket.io connection state and event subscriptions.
- `server/socketHandlers.js` owns all server-side room, message, presence, and typing behavior.
- UI components stay focused on rendering and user interaction.

This keeps WebSocket behavior visible without mixing it into every component.
