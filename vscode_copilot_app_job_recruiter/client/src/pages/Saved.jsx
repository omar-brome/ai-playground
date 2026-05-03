import { useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import ProfileGrid from '../components/results/ProfileGrid'
import useSearchStore from '../store/searchStore'

function Saved() {
  const [selectedProfile, setSelectedProfile] = useState(null)
  const getSavedProfiles = useSearchStore((state) => state.getSavedProfiles)
  const savedProfiles = getSavedProfiles()

  const handleViewProfile = (profile) => {
    setSelectedProfile(profile)
  }

  const handleCloseProfile = () => {
    setSelectedProfile(null)
  }

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
          <ProfileGrid profiles={savedProfiles} onView={handleViewProfile} onSave={() => {}} />
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

export default Saved
