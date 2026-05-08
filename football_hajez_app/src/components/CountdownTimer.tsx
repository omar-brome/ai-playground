import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

type Props = {
  expiresAt: string
  onExpired: () => void
}

export function CountdownTimer({ expiresAt, onExpired }: Props) {
  const [now, setNow] = useState(0)
  const expiredFired = useRef(false)
  const target = useMemo(() => new Date(expiresAt).getTime(), [expiresAt])

  useLayoutEffect(() => {
    expiredFired.current = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one wall-clock seed per expiresAt
    setNow(Date.now())
  }, [expiresAt])

  const remaining = Math.max(0, target - now)

  useEffect(() => {
    if (now === 0) return
    if (remaining <= 0) {
      if (!expiredFired.current) {
        expiredFired.current = true
        onExpired()
      }
      return
    }
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [expiresAt, now, onExpired, remaining])

  if (now === 0) {
    return <p className="font-mono text-2xl font-bold text-yellow-300">--:--</p>
  }

  const mm = String(Math.floor(remaining / 60000)).padStart(2, '0')
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')

  return <p className="font-mono text-2xl font-bold text-yellow-300">{mm}:{ss}</p>
}
