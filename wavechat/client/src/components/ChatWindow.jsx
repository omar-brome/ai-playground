import InputBar from "./InputBar.jsx";
import MessageList from "./MessageList.jsx";
import TypingIndicator from "./TypingIndicator.jsx";

function ChatWindow({
  activeRoom,
  username,
  messages,
  typingUsers,
  isConnected,
  onSendMessage,
  onTyping,
  onStopTyping,
  onSignOut,
}) {
  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-5 py-4 backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Room</p>
          <h2 className="text-2xl font-bold"># {activeRoom}</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300">
            <span
              className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-emerald-400" : "bg-amber-400"}`}
            />
            {isConnected ? "Connected" : "Connecting"}
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-full border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-400 transition hover:border-rose-400/50 hover:bg-rose-400/10 hover:text-rose-200 md:hidden"
          >
            Sign out
          </button>
        </div>
      </header>

      <MessageList messages={messages} username={username} />
      <div className="border-t border-slate-800 bg-slate-950 px-5 py-4">
        <TypingIndicator typingUsers={typingUsers} />
        <InputBar
          disabled={!isConnected}
          onSendMessage={onSendMessage}
          onTyping={onTyping}
          onStopTyping={onStopTyping}
        />
      </div>
    </section>
  );
}

export default ChatWindow;
