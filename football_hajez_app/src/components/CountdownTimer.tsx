import { useEffect, useMemo, useState } from 'react'

type Props = {
  expiresAt: string
  onExpired: () => void
}

export function CountdownTimer({ expiresAt, onExpired }: Props) {
  const [now, setNow] = useState(Date.now())
  const target = useMemo(() => new Date(expiresAt).getTime(), [expiresAt])
  const remaining = Math.max(0, target - now)

  useEffect(() => {
    if (remaining <= 0) {
      onExpired()
      return
    }
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [onExpired, remaining])

  const mm = String(Math.floor(remaining / 60000)).padStart(2, '0')
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')

  return <p className="font-mono text-2xl font-bold text-yellow-300">{mm}:{ss}</p>
}
