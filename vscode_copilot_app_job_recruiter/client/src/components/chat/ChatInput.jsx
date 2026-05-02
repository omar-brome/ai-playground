import { useEffect, useRef, useState } from 'react'
import { Button } from '../ui'

function ChatInput({ onSend, isLoading }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue('')
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit(event)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-bg-secondary p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Type a message, e.g. 'Find senior product designers in Berlin'..."
          className="min-h-[64px] w-full resize-none rounded-3xl border border-border bg-bg-primary px-4 py-3 text-text-primary placeholder:text-text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />

        <Button type="submit" disabled={!value.trim() || isLoading} className="md:shrink-0">
          {isLoading ? 'Sending...' : 'Send'}
        </Button>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
        <span>Press Enter to send, Shift+Enter for newline</span>
        <span>{value.length}/500</span>
      </div>
    </form>
  )
}

export default ChatInput