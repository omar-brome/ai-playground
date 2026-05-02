export function parseLinkedInQuery(query = '') {
  const normalized = (query || '').trim()
  const text = normalized.toLowerCase()

  const titleMatch = normalized.match(/(?:find|search for|show me|looking for|need a|hire|looking to hire)\s+(.+?)(?=\s+(?:in|at|for|with|who|open to|near|from|$))/i)
  const locationMatch = normalized.match(/(?:in|near)\s+([A-Za-z0-9 ,]+)/i)
  const companyMatch = normalized.match(/(?:at|from)\s+([A-Za-z0-9 &]+)/i)
  const experienceMatch = normalized.match(/(\d+)\+?\s*(?:years|yrs|year|yr)/i)
  const openToWork = /(open to work|open to new opportunities|actively looking|open for new roles)/i.test(text)

  return {
    title: titleMatch?.[1]?.trim() || '',
    location: locationMatch?.[1]?.trim() || '',
    company: companyMatch?.[1]?.trim() || '',
    experience: experienceMatch ? Number(experienceMatch[1]) : undefined,
    openToWork,
    raw: normalized,
  }
}
