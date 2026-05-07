import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BookingForm } from '../components/BookingForm'
import { SoccerField } from '../components/SoccerField'
import { useBooking } from '../context/BookingContext'
import { venues } from '../data/mockData'
import type { MiniPosition, TeamSide } from '../types/domain'
import { checkBookingConflict } from '../utils/conflictCheck'
import { formatDateTime, formatLbp } from '../utils/format'

export default function MatchPage() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { bookings, matches, getMatchById, createPendingBooking } = useBooking()
  const match = getMatchById(matchId)
  const venue = venues.find((v) => v.id === match?.venueId)
  const [selectedTeam, setSelectedTeam] = useState<TeamSide | null>(null)
  const [selectedRole, setSelectedRole] = useState<MiniPosition | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [shareCopied, setShareCopied] = useState(false)

  if (!match || !venue) return <div className="p-6">Match not found.</div>

  const selectedSpot = selectedTeam ? match.spots[selectedTeam] : undefined
  const team1Left = Math.max(0, match.spots.team1.total - match.spots.team1.booked.length)
  const team2Left = Math.max(0, match.spots.team2.total - match.spots.team2.booked.length)
  const totalLeft = team1Left + team2Left

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/match/${match.id}`
    const shareData = {
      title: `Malaab Match at ${venue.name}`,
      text: `Join our 5v5 game on ${match.date} at ${match.time}`,
      url: shareUrl,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
        return
      }
      await navigator.clipboard.writeText(shareUrl)
      setShareCopied(true)
      window.setTimeout(() => setShareCopied(false), 2000)
    } catch {
      // Do nothing if user cancels share
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <p className="text-sm text-white/70">{venue.name}</p>
      <button
        type="button"
        className="mb-2 rounded-lg border border-white/20 px-3 py-1 text-xs font-bold text-white/85"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>
      <h1 className="text-2xl font-black">{formatDateTime(match.date, match.time)}</h1>
      <p className="text-accent-green">
        {match.type} • {formatLbp(match.price)}
      </p>
      <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="text-sm font-bold">{totalLeft} players left</p>
        <p className="mt-1 text-xs text-white/70">
          Team 1: {team1Left}/5 left • Team 2: {team2Left}/5 left
        </p>
      </div>
      <button
        type="button"
        className="mt-3 w-full rounded-xl border border-white/20 bg-white/5 p-3 text-sm font-bold"
        onClick={handleShare}
      >
        Share Match With Friends
      </button>
      {shareCopied ? <p className="mt-1 text-xs text-accent-green">Link copied to clipboard.</p> : null}

      <div className="mt-4">
        <SoccerField
          match={match}
          selectedTeam={selectedTeam}
          selectedRole={selectedRole}
          onSelectTeam={(team) => {
            setSelectedTeam(team as TeamSide)
            setSelectedRole(null)
          }}
          onSelectTeamRole={(team, role) => {
            setSelectedTeam(team)
            setSelectedRole(role)
          }}
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          className={`rounded-xl border p-3 text-sm font-bold ${
            selectedTeam === 'team1'
              ? 'border-accent-green bg-accent-green/20'
              : 'border-white/20 bg-white/5'
          }`}
          onClick={() => {
            setSelectedTeam('team1')
            setSelectedRole(null)
          }}
          disabled={team1Left <= 0}
        >
          Join Team 1 ({team1Left} left)
        </button>
        <button
          type="button"
          className={`rounded-xl border p-3 text-sm font-bold ${
            selectedTeam === 'team2'
              ? 'border-accent-green bg-accent-green/20'
              : 'border-white/20 bg-white/5'
          }`}
          onClick={() => {
            setSelectedTeam('team2')
            setSelectedRole(null)
          }}
          disabled={team2Left <= 0}
        >
          Join Opposite Team ({team2Left} left)
        </button>
      </div>

      <p className="mt-3 text-xs text-white/70">
        Tap a blue/red formation circle on the field to choose role directly.
      </p>

      {selectedTeam && selectedRole && selectedSpot && selectedSpot.booked.length < selectedSpot.total ? (
        <div className="fixed right-0 bottom-20 left-0 z-10 px-4">
          <div className="mx-auto max-w-md rounded-2xl border border-white/15 bg-bg-navy p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-bold">{selectedTeam === 'team1' ? 'Team 1' : 'Opposite Team'}</p>
              <button
                type="button"
                className="rounded border border-white/25 px-2 py-0.5 text-xs font-bold text-white/80"
                onClick={() => {
                  setSelectedRole(null)
                  setError('')
                }}
                aria-label="Close booking popup"
              >
                [x]
              </button>
            </div>
            <p className="text-sm text-white/80">
              Role:{' '}
              {selectedRole === 'goalkeeper'
                ? 'Goalkeeper'
                : selectedRole === 'midfielder'
                  ? 'Midfielder'
                  : 'Attacker'}
            </p>
            <p className="text-sm text-white/70">{formatLbp(match.price)}</p>
            <button
              type="button"
              className="mt-3 w-full rounded-xl bg-accent-green p-3 font-bold text-black"
              onClick={() => setShowForm(true)}
            >
              Book This Spot
            </button>
          </div>
        </div>
      ) : null}

      {showForm ? (
        <BookingForm
          error={error}
          onClose={() => setShowForm(false)}
          onSubmit={({ playerName, phone }) => {
            if (!playerName || !phone || !selectedTeam || !selectedRole) {
              setError('Please fill in all fields.')
              return
            }
            const conflict = checkBookingConflict(phone, match, bookings, matches)
            if (!conflict.ok) {
              setError(conflict.reason)
              return
            }
            try {
              const bookingId = createPendingBooking({
                matchId: match.id,
                venueId: match.venueId,
                team: selectedTeam,
                position: selectedRole,
                playerName,
                phone,
                amount: match.price,
              })
              navigate(`/payment/${bookingId}`)
            } catch (createError) {
              setError(createError instanceof Error ? createError.message : 'Unable to create booking.')
            }
          }}
        />
      ) : null}
    </div>
  )
}
