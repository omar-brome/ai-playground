import ProfileCard from './ProfileCard'

function ProfileGrid({ profiles, onView = () => {}, onSave = () => {} }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {profiles.map((profile) => (
        <ProfileCard key={profile.id} profile={profile} onView={onView} onSave={onSave} />
      ))}
    </div>
  )
}

export default ProfileGrid