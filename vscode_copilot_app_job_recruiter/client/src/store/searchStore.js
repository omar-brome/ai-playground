import { create } from 'zustand'

const useSearchStore = create((set, get) => ({
  // State
  query: '',
  results: [],
  filters: {
    location: '',
    company: '',
    title: '',
    experience: '',
    sortBy: 'relevance',
  },
  isSearching: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  },

  // Actions
  setQuery: (query) => {
    set({ query })
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }))
  },

  clearFilters: () => {
    set({
      filters: {
        location: '',
        company: '',
        title: '',
        experience: '',
        sortBy: 'relevance',
      },
    })
  },

  search: async (searchQuery, page = 1) => {
    set({ isSearching: true, error: null })

    try {
      const params = new URLSearchParams({
        q: searchQuery || get().query,
        page: page.toString(),
        limit: get().pagination.limit.toString(),
        ...get().filters,
      })

      // TODO: Replace with actual API call
      const response = await fetch(`/api/linkedin/search?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const result = await response.json()

      set((state) => ({
        results: page === 1 ? result.profiles : [...state.results, ...result.profiles],
        pagination: {
          ...state.pagination,
          page,
          total: result.total,
          hasMore: result.hasMore,
        },
        isSearching: false,
      }))

      return { success: true, data: result }
    } catch (error) {
      set({
        error: error.message,
        isSearching: false,
      })
      return { success: false, error: error.message }
    }
  },

  loadMore: async () => {
    const { pagination } = get()
    if (!pagination.hasMore || get().isSearching) return

    await get().search(get().query, pagination.page + 1)
  },

  saveProfile: async (profileId) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/profiles/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileId }),
      })

      if (!response.ok) {
        throw new Error('Failed to save profile')
      }

      // Update profile in results
      set((state) => ({
        results: state.results.map(profile =>
          profile.id === profileId
            ? { ...profile, saved: true }
            : profile
        ),
      }))

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  unsaveProfile: async (profileId) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/profiles/unsave', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileId }),
      })

      if (!response.ok) {
        throw new Error('Failed to unsave profile')
      }

      // Update profile in results
      set((state) => ({
        results: state.results.map(profile =>
          profile.id === profileId
            ? { ...profile, saved: false }
            : profile
        ),
      }))

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  exportProfiles: async (profileIds, format = 'csv') => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/profiles/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileIds, format }),
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `profiles.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  clearResults: () => {
    set({
      results: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false,
      },
    })
  },

  clearError: () => {
    set({ error: null })
  },

  // Getters
  getFilteredResults: () => {
    const { results, filters } = get()

    return results.filter(profile => {
      if (filters.location && !profile.location?.toLowerCase().includes(filters.location.toLowerCase())) {
        return false
      }
      if (filters.company && !profile.company?.toLowerCase().includes(filters.company.toLowerCase())) {
        return false
      }
      if (filters.title && !profile.title?.toLowerCase().includes(filters.title.toLowerCase())) {
        return false
      }
      return true
    })
  },

  getSavedProfiles: () => {
    return get().results.filter(profile => profile.saved)
  },
}))

export default useSearchStore