type Props = {
  onPick: (role: 'player' | 'pitch_host') => void
}

export function RolePicker({ onPick }: Props) {
  return (
    <div className="mt-6 space-y-4">
      <button
        type="button"
        className="card-glow w-full rounded-2xl border border-white/15 bg-white/5 p-5 text-left"
        onClick={() => onPick('player')}
      >
        <p className="text-xl font-bold">Player</p>
        <p className="text-sm text-white/70">Book your spot on a match.</p>
      </button>
      <button
        type="button"
        className="card-glow w-full rounded-2xl border border-white/15 bg-white/5 p-5 text-left"
        onClick={() => onPick('pitch_host')}
      >
        <p className="text-xl font-bold">Pitch Host</p>
        <p className="text-sm text-white/70">You have the field, gather your squad.</p>
      </button>
    </div>
  )
}
