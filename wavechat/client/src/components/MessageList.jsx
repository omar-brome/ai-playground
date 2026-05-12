import { useEffect, useRef } from "react";
import Message from "./Message.jsx";

function MessageList({ messages, username }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center text-center">
          <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/60 p-8">
            <p className="text-lg font-semibold text-slate-200">No messages yet</p>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Send the first message or wait for someone else to join the room.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <Message key={message.id} message={message} isOwn={message.username === username} />
          ))}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;
