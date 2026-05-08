import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BookingForm } from '../components/BookingForm'
import { SoccerField } from '../components/SoccerField'
import { useAuth } from '../context/AuthContext'
import { useBooking } from '../context/BookingContext'
import { useLocale } from '../context/LocaleContext'
import { venues } from '../data/mockData'
import type { MessageId } from '../i18n/strings'
import { isSupabaseBackend } from '../config/env'
import { getSupabaseClient } from '../lib/supabase'
import type { MatchWaitlistEntry, MiniPosition, TeamSide } from '../types/domain'
import { checkBookingConflict } from '../utils/conflictCheck'
import { formatDateTime, formatLbp } from '../utils/format'
import { SessionStatusBadge } from '../components/SessionStatusBadge'
import { buildMatchShareUrl, parseInviteSearchParams } from '../utils/matchInviteUrl'
import { aggregateRoleNeeds } from '../utils/matchRecruitment'
import { toast } from '../utils/toast'
import { track } from '../analytics/track'

function upsertHeadMeta(attr: 'property' | 'name', key: string, content: string) {
  const attrName = attr === 'property' ? 'property' : 'name'
  let el = document.querySelector(`meta[${attrName}="${key}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attrName, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function formatRecruitLine(t: (id: MessageId) => string, role: MiniPosition, n: number): string {
  const id: MessageId =
    role === 'attacker'
      ? 'match.recruitAttackers'
      : role === 'midfielder'
        ? 'match.recruitMidfielders'
        : 'match.recruitGoalkeepers'
  return t(id).replace(/\{\{\s*n\s*\}\}/g, String(n))
}

export default function MatchPage() {
  const { matchId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useLocale()
  const { user } = useAuth()
  const fieldAnchorRef = useRef<HTMLDivElement>(null)
  const inviteAppliedRef = useRef(false)
  const initialDocTitleRef = useRef(document.title)
  const {
    bookings,
    matches,
    getMatchById,
    createPendingBooking,
    joinMatchWaitlist,
    leaveMatchWaitlist,
    fetchMyWaitlistForMatch,
  } = useBooking()
  const match = getMatchById(matchId)
  const venue = venues.find((v) => v.id === match?.venueId)
  const team1Left = match ? Math.max(0, match.spots.team1.total - match.spots.team1.booked.length) : 0
  const team2Left = match ? Math.max(0, match.spots.team2.total - match.spots.team2.booked.length) : 0
  const totalLeft = team1Left + team2Left

  const [selectedTeam, setSelectedTeam] = useState<TeamSide | null>(null)
  const [selectedRole, setSelectedRole] = useState<MiniPosition | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [myWaitlist, setMyWaitlist] = useState<MatchWaitlistEntry[]>([])
  const [waitlistPrompt, setWaitlistPrompt] = useState<{ team: TeamSide; role: MiniPosition } | null>(null)

  useEffect(() => {
    inviteAppliedRef.current = false
  }, [matchId])

  useEffect(() => {
    if (!match) return
    const { team, role } = parseInviteSearchParams(searchParams)
    if (!team && !role) return
    if (inviteAppliedRef.current) return
    inviteAppliedRef.current = true
    queueMicrotask(() => {
      if (team) setSelectedTeam(team)
      if (role) setSelectedRole(role)
      window.requestAnimationFrame(() => {
        fieldAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    })
  }, [match, searchParams])

  useEffect(() => {
    if (!matchId) return
    void fetchMyWaitlistForMatch(matchId).then(setMyWaitlist)
  }, [matchId, user, bookings, matches, fetchMyWaitlistForMatch])

  useEffect(() => {
    if (!matchId || !isSupabaseBackend()) return
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRe.test(matchId)) return
    const supabase = getSupabaseClient()
    if (!supabase) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const bump = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        void fetchMyWaitlistForMatch(matchId).then(setMyWaitlist)
      }, 280)
    }
    const ch = supabase
      .channel(`waitlist-live-${matchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_waitlist', filter: `match_id=eq.${matchId}` },
        bump,
      )
      .subscribe()
    return () => {
      if (timer) clearTimeout(timer)
      void supabase.removeChannel(ch)
    }
  }, [matchId, fetchMyWaitlistForMatch])

  useEffect(() => {
    if (!match || !venue) return
    const restoreTitle = initialDocTitleRef.current
    const origin = window.location.origin
    const pageUrl = buildMatchShareUrl(origin, match.id, { team: selectedTeam, role: selectedRole })
    const title = `${venue.name} · ${formatDateTime(match.date, match.time)}`
    const desc = `${match.type} · ${formatLbp(match.price)} · ${totalLeft} ${t('match.playersLeft')}`
    document.title = title
    upsertHeadMeta('property', 'og:title', title)
    upsertHeadMeta('property', 'og:description', desc)
    upsertHeadMeta('property', 'og:url', pageUrl)
    upsertHeadMeta('property', 'og:type', 'website')
    const rawImg = venue.image?.trim() ?? ''
    const ogImage = rawImg.startsWith('http')
      ? rawImg
      : `${origin}${rawImg.startsWith('/') ? rawImg : `/${rawImg}`}`
    upsertHeadMeta('property', 'og:image', ogImage)
    upsertHeadMeta('name', 'twitter:card', 'summary_large_image')
    upsertHeadMeta('name', 'twitter:title', title)
    upsertHeadMeta('name', 'twitter:description', desc)
    return () => {
      document.title = restoreTitle
    }
  }, [match, venue, selectedTeam, selectedRole, totalLeft, t])

  if (!match || !venue) return <div className="p-6">Match not found.</div>

  const bookingClosed =
    match.sessionStatus === 'cancelled' || match.sessionStatus === 'finished'

  const selectedSpot = selectedTeam ? match.spots[selectedTeam] : undefined
  const recruitmentNeeds = bookingClosed ? [] : aggregateRoleNeeds(match)

  const handleShare = async () => {
    const origin = window.location.origin
    const shareUrl = buildMatchShareUrl(origin, match.id, { team: selectedTeam, role: selectedRole })
    const recruitLines = recruitmentNeeds.map(({ role, needed }) => formatRecruitLine(t, role, needed))
    const baseText = `${t('match.shareLead')}: ${venue.name} — ${formatDateTime(match.date, match.time)}`
    const text = [baseText, ...recruitLines].filter(Boolean).join('\n')
    const shareData = {
      title: `${venue.name} · Malaab`,
      text,
      url: shareUrl,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
        return
      }
      await navigator.clipboard.writeText(shareUrl)
      toast.success(t('match.linkCopied'))
    } catch {
      /* user cancelled share */
    }
  }

  const handleFullRolePress = (team: TeamSide, role: MiniPosition) => {
    if (bookingClosed) return
    if (isSupabaseBackend() && !user) {
      toast.error(t('match.waitlistSignIn'))
      return
    }
    setWaitlistPrompt({ team, role })
  }

  const confirmJoinWaitlist = async () => {
    if (!waitlistPrompt) return
    try {
      const { queuePosition } = await joinMatchWaitlist({
        matchId: match.id,
        team: waitlistPrompt.team,
        position: waitlistPrompt.role,
      })
      toast.success(t('match.waitlistJoined').replace(/\{\{\s*n\s*\}\}/g, String(queuePosition)))
      setWaitlistPrompt(null)
      void fetchMyWaitlistForMatch(match.id).then(setMyWaitlist)
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('match.waitlistFail')
      toast.error(msg)
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
        ← {t('match.back')}
      </button>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-black">{formatDateTime(match.date, match.time)}</h1>
        {match.sessionStatus ? <SessionStatusBadge status={match.sessionStatus} /> : null}
      </div>
      <p className="text-accent-green">
        {match.type} • {formatLbp(match.price)}
      </p>
      <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="text-sm font-bold">
          {totalLeft} {t('match.playersLeft')}
        </p>
        <p className="mt-1 text-xs text-white/70">
          {t('match.sideTeam1')}: {team1Left}/5 • {t('match.sideTeam2')}: {team2Left}/5
        </p>
      </div>
      {!bookingClosed && recruitmentNeeds.length > 0 ? (
        <div className="mt-2 rounded-xl border border-accent-green/40 bg-accent-green/10 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-green">{t('match.recruitBannerTitle')}</p>
          <ul className="mt-1 space-y-0.5 text-sm font-semibold text-white/95">
            {recruitmentNeeds.map(({ role, needed }) => (
              <li key={role}>{formatRecruitLine(t, role, needed)}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <button
        type="button"
        className="mt-3 w-full rounded-xl border border-white/20 bg-white/5 p-3 text-sm font-bold"
        onClick={handleShare}
      >
        {t('match.share')}
      </button>
      {bookingClosed ? (
        <p className="mt-3 rounded-xl border border-white/20 bg-white/5 p-3 text-sm text-white/85">
          {t('match.sessionClosed')} <span className="font-bold">{match.sessionStatus}</span>. {t('match.bookingsClosed')}
        </p>
      ) : null}

      {myWaitlist.length > 0 ? (
        <div className="mt-3 space-y-2 rounded-xl border border-white/15 bg-white/5 p-3 text-sm">
          <p className="font-bold text-white/90">{t('match.waitlistYourSpots')}</p>
          {myWaitlist.map((row) => (
            <div key={`${row.team}-${row.position}`} className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-white/85">
                {row.team === 'team1' ? t('match.sideTeam1') : t('match.sideTeam2')} ·{' '}
                {row.position === 'goalkeeper'
                  ? t('match.goalkeeper')
                  : row.position === 'midfielder'
                    ? t('match.midfielder')
                    : t('match.attacker')}{' '}
                · {t('match.waitlistOnList').replace(/\{\{\s*n\s*\}\}/g, String(row.queuePosition))}
              </p>
              <button
                type="button"
                className="shrink-0 rounded-lg border border-white/25 px-2 py-1 text-xs font-bold text-white/85"
                onClick={() => {
                  void (async () => {
                    try {
                      await leaveMatchWaitlist({
                        matchId: match.id,
                        team: row.team,
                        position: row.position,
                      })
                      toast.success(t('match.waitlistLeft'))
                      void fetchMyWaitlistForMatch(match.id).then(setMyWaitlist)
                    } catch (e) {
                      const msg = e instanceof Error ? e.message : t('match.waitlistFail')
                      toast.error(msg)
                    }
                  })()
                }}
              >
                {t('match.waitlistLeave')}
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4" ref={fieldAnchorRef}>
        <SoccerField
          match={match}
          readOnly={bookingClosed}
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
          onFullRolePress={bookingClosed ? undefined : handleFullRolePress}
        />
      </div>
      {!bookingClosed ? (
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
            {t('match.joinTeam1')} ({team1Left})
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
            {t('match.joinTeam2')} ({team2Left})
          </button>
        </div>
      ) : null}

      {!bookingClosed ? (
        <p className="mt-3 text-xs text-white/70">{t('match.tapHint')}</p>
      ) : null}

      {!bookingClosed &&
      selectedTeam &&
      selectedRole &&
      selectedSpot &&
      selectedSpot.booked.length < selectedSpot.total ? (
        <div className="fixed right-0 bottom-20 left-0 z-10 px-4">
          <div className="mx-auto max-w-md rounded-2xl border border-white/15 bg-bg-navy p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-bold">{selectedTeam === 'team1' ? t('match.sideTeam1') : t('match.sideTeam2')}</p>
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
              {t('match.role')}:{' '}
              {selectedRole === 'goalkeeper'
                ? t('match.goalkeeper')
                : selectedRole === 'midfielder'
                  ? t('match.midfielder')
                  : t('match.attacker')}
            </p>
            <p className="text-sm text-white/70">{formatLbp(match.price)}</p>
            <button
              type="button"
              className="mt-3 w-full rounded-xl bg-accent-green p-3 font-bold text-black"
              onClick={() => {
                track('booking_start', { matchId: match.id, team: selectedTeam, role: selectedRole })
                setShowForm(true)
              }}
            >
              {t('match.bookSpot')}
            </button>
          </div>
        </div>
      ) : null}

      {!bookingClosed && showForm ? (
        <BookingForm
          error={error}
          onClose={() => setShowForm(false)}
          onSubmit={({ playerName, phone }) => {
            if (!playerName || !phone || !selectedTeam || !selectedRole) {
              setError(t('match.fillFields'))
              return
            }
            if (!isSupabaseBackend()) {
              const conflict = checkBookingConflict(phone, match, bookings, matches)
              if (!conflict.ok) {
                setError(conflict.reason)
                return
              }
            }
            void (async () => {
              try {
                const bookingId = await createPendingBooking({
                  matchId: match.id,
                  venueId: match.venueId,
                  team: selectedTeam,
                  position: selectedRole,
                  playerName,
                  phone,
                  amount: match.price,
                })
                toast.success(t('match.toastBooked'))
                navigate(`/payment/${bookingId}`)
              } catch (createError) {
                const msg = createError instanceof Error ? createError.message : t('match.bookingFailed')
                setError(msg)
                toast.error(msg)
              }
            })()
          }}
        />
      ) : null}

      {waitlistPrompt ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-bg-navy p-4 shadow-xl">
            <p className="text-lg font-black">{t('match.waitlistPromptTitle')}</p>
            <p className="mt-2 text-sm text-white/80">{t('match.waitlistPromptBody')}</p>
            <p className="mt-2 text-sm text-white/70">
              {waitlistPrompt.team === 'team1' ? t('match.sideTeam1') : t('match.sideTeam2')} ·{' '}
              {waitlistPrompt.role === 'goalkeeper'
                ? t('match.goalkeeper')
                : waitlistPrompt.role === 'midfielder'
                  ? t('match.midfielder')
                  : t('match.attacker')}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-white/20 py-3 text-sm font-bold text-white/90"
                onClick={() => setWaitlistPrompt(null)}
              >
                {t('match.waitlistCancel')}
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-accent-green py-3 text-sm font-bold text-black"
                onClick={() => void confirmJoinWaitlist()}
              >
                {t('match.waitlistJoin')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
