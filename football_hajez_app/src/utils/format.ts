export function formatLbp(amount: number) {
  return `${new Intl.NumberFormat('en-US').format(amount)} LBP`
}

export function formatDateTime(date: string, time: string) {
  const [y, m, d] = date.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  const value = new Date(y, m - 1, d, hours, minutes)
  const datePart = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Beirut',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(value)
  const timePart = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Beirut',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(value)
  return `${datePart} • ${timePart}`
}

export function getMatchDateValue(date: string, time: string) {
  const [y, m, d] = date.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(y, m - 1, d, hours, minutes).getTime()
}
