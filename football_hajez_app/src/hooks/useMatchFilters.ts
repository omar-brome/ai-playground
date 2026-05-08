import { useCallback, useState } from 'react'
import type { MatchListFilters } from '../utils/matchFilters'
import { defaultMatchListFilters } from '../utils/matchFilters'

const LS_KEY = 'malaab_match_filters'

function loadFilters(): MatchListFilters {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return defaultMatchListFilters
    const parsed = JSON.parse(raw) as Partial<MatchListFilters>
    return { ...defaultMatchListFilters, ...parsed }
  } catch {
    return defaultMatchListFilters
  }
}

function persistFilters(f: MatchListFilters) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(f))
  } catch {
    /* ignore */
  }
}

export function usePersistedMatchFilters() {
  const [filters, setFilters] = useState<MatchListFilters>(loadFilters)

  const updateFilters = useCallback((patch: Partial<MatchListFilters>) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch }
      persistFilters(next)
      return next
    })
  }, [])

  return { filters, updateFilters, setFilters }
}
