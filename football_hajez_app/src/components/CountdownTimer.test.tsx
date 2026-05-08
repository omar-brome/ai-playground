import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CountdownTimer } from './CountdownTimer'

describe('CountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('fires onExpired once when expiresAt is already past', () => {
    const base = new Date('2026-05-10T12:00:00.000Z').getTime()
    vi.setSystemTime(base)
    const onExpired = vi.fn()
    render(<CountdownTimer expiresAt={new Date(base - 5000).toISOString()} onExpired={onExpired} />)
    expect(onExpired).toHaveBeenCalledTimes(1)
  })

  it('fires onExpired when countdown reaches zero', () => {
    const base = new Date('2026-05-10T12:00:00.000Z').getTime()
    vi.setSystemTime(base)
    const onExpired = vi.fn()
    const expiresAt = new Date(base + 2500).toISOString()
    render(<CountdownTimer expiresAt={expiresAt} onExpired={onExpired} />)
    expect(onExpired).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(onExpired).toHaveBeenCalledTimes(1)
  })
})
