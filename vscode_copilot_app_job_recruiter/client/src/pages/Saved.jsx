import DashboardLayout from '../components/layout/DashboardLayout'
import ProfileGrid from '../components/results/ProfileGrid'
import useSearchStore from '../store/searchStore'

function Saved() {
  const getSavedProfiles = useSearchStore((state) => state.getSavedProfiles)
  const savedProfiles = getSavedProfiles()

  return (
    <DashboardLayout>
      <div className="rounded-3xl border border-border bg-bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Saved Profiles</h1>
            <p className="mt-2 text-text-secondary">Your saved candidate profiles appear here for easy review.</p>
          </div>
        </div>

        {savedProfiles.length === 0 ? (
          <div className="rounded-3xl border border-border bg-bg-primary p-10 text-center text-text-secondary">
            No saved profiles yet. Save matches from the search results or chat to keep them here.
          </div>
        ) : (
          <ProfileGrid profiles={savedProfiles} onView={() => {}} onSave={() => {}} />
        )}
      </div>
    </DashboardLayout>
  )
}

export default Saved
