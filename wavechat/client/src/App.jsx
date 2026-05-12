import { useMemo, useState } from "react";
import ChatWindow from "./components/ChatWindow.jsx";
import Sidebar from "./components/Sidebar.jsx";
import { useSocket } from "./hooks/useSocket.js";

const ROOMS = ["General", "Tech", "Random"];
const DEFAULT_ROOM = "General";
const STORAGE_KEY = "wavechat.username";

function App() {
  const [savedUsername, setSavedUsername] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || "";
  });
  const [usernameInput, setUsernameInput] = useState(savedUsername);
  const [activeRoom, setActiveRoom] = useState(DEFAULT_ROOM);
  const username = savedUsername.trim();

  const {
    isConnected,
    messages,
    users,
    typingUsers,
    sendMessage,
    sendTyping,
    sendStopTyping,
  } = useSocket(username, activeRoom);

  const trimmedInput = usernameInput.trim();
  const canJoin = trimmedInput.length > 0;

  const typingTextUsers = useMemo(() => {
    return typingUsers.filter((typingUsername) => typingUsername !== username);
  }, [typingUsers, username]);

  function handleUsernameSubmit(event) {
    event.preventDefault();

    if (!canJoin) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, trimmedInput);
    setSavedUsername(trimmedInput);
  }

  function handleRoomSelect(room) {
    setActiveRoom(room);
  }

  function handleSignOut() {
    localStorage.removeItem(STORAGE_KEY);
    setSavedUsername("");
    setUsernameInput("");
    setActiveRoom(DEFAULT_ROOM);
  }

  if (!username) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-cyan-950/40">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400 text-2xl font-black text-slate-950">
              W
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome to Wavechat</h1>
            <p className="mt-2 text-sm text-slate-400">
              Pick a username to join the real-time chat rooms.
            </p>
          </div>

          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-300" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              value={usernameInput}
              onChange={(event) => setUsernameInput(event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              placeholder="Enter your username"
              autoComplete="off"
              autoFocus
            />
            <button
              type="submit"
              disabled={!canJoin}
              className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              Join chat
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar
        rooms={ROOMS}
        activeRoom={activeRoom}
        users={users}
        isConnected={isConnected}
        username={username}
        onRoomSelect={handleRoomSelect}
        onSignOut={handleSignOut}
      />
      <ChatWindow
        activeRoom={activeRoom}
        username={username}
        messages={messages}
        typingUsers={typingTextUsers}
        isConnected={isConnected}
        onSendMessage={sendMessage}
        onTyping={sendTyping}
        onStopTyping={sendStopTyping}
        onSignOut={handleSignOut}
      />
    </main>
  );
}

export default App;
