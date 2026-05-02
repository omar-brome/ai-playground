function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 rounded-3xl bg-bg-card px-4 py-3 text-text-secondary">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-3 w-3 animate-bounce rounded-full bg-primary" />
        <span className="inline-flex h-3 w-3 animate-bounce animation-delay-100 rounded-full bg-primary" />
        <span className="inline-flex h-3 w-3 animate-bounce animation-delay-200 rounded-full bg-primary" />
      </div>
      <span>Searching LinkedIn...</span>
    </div>
  )
}

export default TypingIndicator