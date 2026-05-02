import { useMemo } from 'react'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import TypingIndicator from './TypingIndicator'
import SuggestedPrompts from './SuggestedPrompts'

function ChatWindow({ messages, isLoading, onSend, onPromptSelect, onClear }) {
  const mainMessages = useMemo(() => messages.slice(-12), [messages])

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="rounded-3xl border border-border bg-bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-text-muted">AI Recruiting Chat</p>
            <h2 className="text-2xl font-semibold text-text-primary">Ask the assistant to find top talent</h2>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="rounded-2xl border border-border px-4 py-2 text-sm text-text-secondary hover:bg-bg-secondary transition"
          >
            New chat
          </button>
        </div>
      </div>

      <SuggestedPrompts onSelect={onPromptSelect} />

      <div className="flex-1 overflow-hidden rounded-3xl border border-border bg-bg-primary shadow-sm">
        <div className="flex h-full flex-col gap-4 overflow-hidden p-6">
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 flex flex-col">
            {mainMessages.length === 0 ? (
              <div className="grid h-full place-items-center text-text-secondary">
                Start a chat by selecting a suggested prompt or typing a query.
              </div>
            ) : (
              mainMessages.map((message) => <ChatMessage key={message.id} message={message} />)
            )}

            {isLoading && <TypingIndicator />}
          </div>

          <ChatInput onSend={onSend} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}

export default ChatWindow