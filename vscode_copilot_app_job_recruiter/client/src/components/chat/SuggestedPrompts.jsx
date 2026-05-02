const prompts = [
  'Find React developers in Dubai',
  'Show me UX designers with 5+ years experience',
  'Find marketing managers in London',
  'Show me Python developers open to work',
  'Find HR managers in Fortune 500 companies',
]

function SuggestedPrompts({ onSelect }) {
  return (
    <div className="rounded-3xl border border-border bg-bg-card p-5">
      <h3 className="text-sm font-semibold text-text-primary">Suggested prompts</h3>
      <div className="mt-4 flex flex-wrap gap-3">
        {prompts.map((prompt) => (
          <button
            type="button"
            key={prompt}
            onClick={() => onSelect(prompt)}
            className="rounded-2xl border border-border bg-bg-primary px-4 py-2 text-sm text-text-secondary hover:border-primary hover:text-white hover:bg-bg-secondary transition"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}

export default SuggestedPrompts