import { useNavigate } from 'react-router-dom'
import { useRole } from '../context/RoleContext'
import { RolePicker } from '../components/RolePicker'

export default function Welcome() {
  const { setRole } = useRole()
  const navigate = useNavigate()

  const chooseRole = (role: 'player' | 'pitch_host') => {
    setRole(role)
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <p className="text-3xl font-black">ملاعب</p>
      <p className="mt-1 text-white/75">Choose how you use Malaab</p>
      <img
        src="/images/switch-role-hero.png"
        alt="Football on grass"
        className="mt-4 h-44 w-full rounded-2xl object-cover"
      />
      <RolePicker onPick={chooseRole} />
    </div>
  )
}
