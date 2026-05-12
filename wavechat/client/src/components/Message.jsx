function formatTime(timestamp) {
  return new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function Message({ message, isOwn }) {
  if (message.type === "system") {
    return (
      <div className="flex justify-center">
        <p className="rounded-full border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs text-slate-500">
          {message.text}
        </p>
      </div>
    );
  }

  const initial = message.username?.charAt(0).toUpperCase() || "?";

  return (
    <article className={`flex gap-3 ${isOwn ? "justify-end" : "justify-start"}`}>
      {!isOwn && (
        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-800 font-bold text-cyan-300">
          {initial}
        </div>
      )}

      <div className={`max-w-[min(70%,42rem)] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`mb-1 flex items-center gap-2 text-xs ${
            isOwn ? "justify-end text-cyan-200" : "text-slate-500"
          }`}
        >
          <span className="font-semibold">{isOwn ? "You" : message.username}</span>
          <span>{formatTime(message.timestamp)}</span>
        </div>

        <div
          className={`rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-lg ${
            isOwn
              ? "rounded-br-lg bg-cyan-400 text-slate-950 shadow-cyan-950/30"
              : "rounded-bl-lg bg-slate-900 text-slate-100 shadow-black/20"
          }`}
        >
          {message.text}
        </div>
      </div>

      {isOwn && (
        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-400 font-bold text-slate-950">
          {initial}
        </div>
      )}
    </article>
  );
}

export default Message;
