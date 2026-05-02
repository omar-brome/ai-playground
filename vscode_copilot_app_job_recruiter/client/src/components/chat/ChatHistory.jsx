function ChatHistory({ conversations, onSelect, onNewChat }) {
  return (
    <div className="rounded-3xl border border-border bg-bg-card p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-text-muted">Chat history</p>
          <h3 className="text-lg font-semibold text-text-primary">Recent conversations</h3>
        </div>
        <button
          type="button"
          onClick={onNewChat}
          className="rounded-2xl border border-border px-3 py-2 text-sm text-text-secondary hover:bg-bg-secondary transition"
        >
          New Chat
        </button>
      </div>

      <div className="space-y-3">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            type="button"
            onClick={() => onSelect(conversation.id)}
            className="w-full rounded-3xl border border-border bg-bg-primary p-4 text-left transition hover:border-primary hover:bg-bg-secondary"
          >
            <p className="font-semibold text-text-primary">{conversation.title}</p>
            <p className="mt-1 text-sm text-text-muted">{conversation.lastMessage}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export default ChatHistory