import { useEffect, useState } from 'react'
import { Button, Input } from '../components/ui'
import DashboardLayout from '../components/layout/DashboardLayout'
import ProfileGrid from '../components/results/ProfileGrid'
import useSearchStore from '../store/searchStore'

function Search() {
  const [searchText, setSearchText] = useState('')
  const [selectedProfile, setSelectedProfile] = useState(null)
  const query = useSearchStore((state) => state.query)
  const results = useSearchStore((state) => state.results)
  const filters = useSearchStore((state) => state.filters)
  const isSearching = useSearchStore((state) => state.isSearching)
  const error = useSearchStore((state) => state.error)
  const pagination = useSearchStore((state) => state.pagination)
  const setQuery = useSearchStore((state) => state.setQuery)
  const setFilters = useSearchStore((state) => state.setFilters)
  const search = useSearchStore((state) => state.search)
  const saveProfile = useSearchStore((state) => state.saveProfile)
  const unsaveProfile = useSearchStore((state) => state.unsaveProfile)
  const loadMore = useSearchStore((state) => state.loadMore)
  const clearFilters = useSearchStore((state) => state.clearFilters)

  useEffect(() => {
    setSearchText(query)
  }, [query])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setQuery(searchText)
    await search(searchText, 1)
  }

  const handleSave = async (profileId) => {
    const profile = results.find((item) => item.id === profileId)
    if (!profile) return

    if (profile.saved) {
      await unsaveProfile(profileId)
    } else {
      await saveProfile(profileId)
    }
  }

  const handleViewProfile = (profile) => {
    setSelectedProfile(profile)
  }

  const handleCloseProfile = () => {
    setSelectedProfile(null)
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in rounded-3xl border-2 border-neutral-200 dark:border-neutral-700 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-800 p-8 shadow-soft hover:shadow-medium transition-all duration-300">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="animate-slide-in">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">LinkedIn Search</h1>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">Search candidate profiles, apply filters, and export results from one place.</p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
            <Input
              fullWidth
              placeholder="Search by role, skill, or company"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
            <Button type="submit" disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </form>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <div className="animate-scale-in rounded-3xl border-2 border-neutral-200 dark:border-neutral-700 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-700 p-6 shadow-soft hover:shadow-medium transition-all duration-300">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Input
                  label="Title"
                  value={filters.title}
                  onChange={(event) => setFilters({ title: event.target.value })}
                  placeholder="e.g. Product Designer"
                />
                <Input
                  label="Location"
                  value={filters.location}
                  onChange={(event) => setFilters({ location: event.target.value })}
                  placeholder="e.g. Berlin"
                />
                <Input
                  label="Company"
                  value={filters.company}
                  onChange={(event) => setFilters({ company: event.target.value })}
                  placeholder="e.g. Google"
                />
                <Input
                  label="Experience"
                  value={filters.experience}
                  onChange={(event) => setFilters({ experience: event.target.value })}
                  placeholder="e.g. 5"
                  type="number"
                />
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button type="button" variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
                <Button type="button" onClick={() => search(searchText || query, 1)}>
                  Apply filters
                </Button>
              </div>
            </div>

            <div className="animate-scale-in rounded-3xl border-2 border-neutral-200 dark:border-neutral-700 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-700 p-6 shadow-soft hover:shadow-medium transition-all duration-300">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Search insights</h2>
              <p className="mt-3 text-neutral-600 dark:text-neutral-400">Use recruiting prompts like "find senior engineers in Seattle" to get better LinkedIn matches.</p>
            </div>
          </div>

          <div className="animate-bounce-in rounded-3xl border-2 border-neutral-200 dark:border-neutral-700 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-700 p-6 shadow-soft hover:shadow-medium transition-all duration-300">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Status</h2>
            <p className="mt-3 text-neutral-600 dark:text-neutral-400">{pagination.total} profiles found</p>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-500">{isSearching ? 'Searching profiles...' : 'Search and filter results from LinkedIn-style candidate data.'}</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {error && <div className="rounded-3xl border border-error bg-[#2B1010] p-4 text-sm text-error">{error}</div>}
        {results.length === 0 ? (
          <div className="rounded-3xl border border-border bg-bg-card p-10 text-center text-text-secondary">
            Start a search to load candidate profiles.
          </div>
        ) : (
          <>
            <ProfileGrid profiles={results} onView={handleViewProfile} onSave={handleSave} />
            {pagination.hasMore && (
              <div className="mt-6 flex justify-center">
                <Button onClick={loadMore} disabled={isSearching}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-bg-card p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-text-primary">{selectedProfile.name}</h2>
                <p className="text-text-secondary">{selectedProfile.currentRole} at {selectedProfile.currentCompany}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseProfile}
                className="rounded-2xl border border-border px-4 py-2 text-sm text-text-secondary hover:bg-bg-secondary transition"
              >
                Close
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="mb-5 rounded-3xl bg-bg-primary p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-text-muted">About</p>
                  <p className="mt-3 text-text-secondary">{selectedProfile.currentRole} with {selectedProfile.experienceYears} years experience in {selectedProfile.location}.</p>
                </div>
                <div className="rounded-3xl bg-bg-primary p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-text-muted">Skills</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedProfile.skills.map((skill) => (
                      <span key={skill} className="rounded-full bg-bg-secondary px-3 py-1 text-xs text-text-primary">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-3xl border border-border bg-bg-primary p-5">
                <div>
                  <p className="text-sm text-text-muted">Location</p>
                  <p className="mt-2 text-text-primary">{selectedProfile.location}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Connections</p>
                  <p className="mt-2 text-text-primary">{selectedProfile.connections}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Open to work</p>
                  <p className="mt-2 text-text-primary">{selectedProfile.openToWork ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Search
