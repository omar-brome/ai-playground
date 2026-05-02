import { useEffect, useState } from 'react'
import { Button, Input } from '../components/ui'
import DashboardLayout from '../components/layout/DashboardLayout'
import ProfileGrid from '../components/results/ProfileGrid'
import useSearchStore from '../store/searchStore'

function Search() {
  const [searchText, setSearchText] = useState('')
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

  return (
    <DashboardLayout>
      <div className="rounded-3xl border border-border bg-bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">LinkedIn Search</h1>
            <p className="mt-2 text-text-secondary">Search candidate profiles, apply filters, and export results from one place.</p>
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
            <div className="rounded-3xl border border-border bg-bg-primary p-6">
              <h2 className="text-lg font-semibold text-text-primary">Filters</h2>
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

            <div className="rounded-3xl border border-border bg-bg-primary p-6">
              <h2 className="text-lg font-semibold text-text-primary">Search insights</h2>
              <p className="mt-3 text-text-secondary">Use recruiting prompts like “find senior engineers in Seattle” to get better LinkedIn matches.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-bg-primary p-6">
            <h2 className="text-lg font-semibold text-text-primary">Status</h2>
            <p className="mt-3 text-text-secondary">{pagination.total} profiles found</p>
            <p className="mt-2 text-sm text-text-muted">{isSearching ? 'Searching profiles...' : 'Search and filter results from LinkedIn-style candidate data.'}</p>
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
            <ProfileGrid profiles={results} onView={() => {}} onSave={handleSave} />
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
    </DashboardLayout>
  )
}

export default Search
