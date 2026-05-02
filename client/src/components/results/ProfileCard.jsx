import { Button } from '../ui'

function ProfileCard({ profile, onView, onSave }) {
  return (
    <div className="rounded-3xl border border-border bg-bg-primary p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-bg-secondary text-xl font-semibold text-text-primary">
          {profile.avatar ? <img src={profile.avatar} alt={profile.name} className="h-16 w-16 rounded-3xl object-cover" /> : profile.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{profile.name}</h3>
          <p className="text-text-secondary">{profile.currentRole} at {profile.currentCompany}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-text-secondary">
        <p>{profile.location} · {profile.experienceYears} yrs · {profile.connections} connections</p>
        <div className="flex flex-wrap gap-2">
          {profile.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="rounded-full bg-bg-secondary px-3 py-1 text-xs text-text-primary">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="outline" size="sm" onClick={() => onView(profile)}>
          View Full Profile
        </Button>
        <Button variant={profile.saved ? 'secondary' : 'primary'} size="sm" onClick={() => onSave(profile.id)}>
          {profile.saved ? 'Saved' : 'Save Profile'}
        </Button>
      </div>
    </div>
  )
}

export default ProfileCard