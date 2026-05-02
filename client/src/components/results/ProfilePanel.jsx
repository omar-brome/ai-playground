import ProfileCard from './ProfileCard'

function ProfilePanel({ profiles, onView, onSave }) {
  return (
    <aside className="hidden xl:block w-full max-w-md rounded-3xl border border-border bg-bg-card p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-sm uppercase tracking-[0.25em] text-text-muted">Profile results</p>
        <h3 className="text-2xl font-semibold text-text-primary">Recent matches</h3>
      </div>

      <div className="space-y-4">
        {profiles.slice(0, 2).map((profile) => (
          <ProfileCard key={profile.id} profile={profile} onView={onView} onSave={onSave} />
        ))}
      </div>
    </aside>
  )
}

export default ProfilePanel