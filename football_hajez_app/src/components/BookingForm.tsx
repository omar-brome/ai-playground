import { useState } from 'react'

type Props = {
  onClose: () => void
  onSubmit: (input: { playerName: string; phone: string }) => void
  error?: string
}

export function BookingForm({ onClose, onSubmit, error }: Props) {
  const [playerName, setPlayerName] = useState('')
  const [phone, setPhone] = useState('+961')

  return (
    <div className="fixed inset-0 z-30 bg-black/60">
      <div className="absolute right-0 bottom-0 left-0 rounded-t-3xl border-t border-white/15 bg-bg-navy p-5">
        <p className="text-lg font-black">Book This Spot</p>
        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded-xl border border-white/20 bg-white/5 p-3 outline-none"
            placeholder="Full Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <input
            className="w-full rounded-xl border border-white/20 bg-white/5 p-3 outline-none"
            placeholder="+961 XX XXX XXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button
            type="button"
            className="w-full rounded-xl bg-accent-green p-3 font-bold text-black"
            onClick={() => onSubmit({ playerName: playerName.trim(), phone: phone.trim() })}
          >
            Confirm
          </button>
          <button type="button" className="w-full rounded-xl border border-white/20 p-3" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
