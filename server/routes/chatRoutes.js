import express from 'express'
import { sampleProfiles } from '../data/sampleProfiles.js'
import { parseLinkedInQuery } from '../utils/linkedinQueryParser.js'

const router = express.Router()

const filterProfiles = (queryData) => {
  return sampleProfiles.filter((profile) => {
    const titleMatch = queryData.title
      ? profile.currentRole.toLowerCase().includes(queryData.title.toLowerCase())
      : true
    const locationMatch = queryData.location
      ? profile.location.toLowerCase().includes(queryData.location.toLowerCase())
      : true
    const companyMatch = queryData.company
      ? profile.currentCompany.toLowerCase().includes(queryData.company.toLowerCase())
      : true
    const experienceMatch = queryData.experience
      ? profile.experienceYears >= queryData.experience
      : true

    return titleMatch && locationMatch && companyMatch && experienceMatch
  })
}

router.post('/message', (req, res) => {
  const { message } = req.body

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message text is required.' })
  }

  const parsed = parseLinkedInQuery(message)
  const foundProfiles = filterProfiles(parsed)
  const isSearchIntent = /find|search|show me|looking for|need a|hire|open to work/i.test(message)

  if (isSearchIntent) {
    if (foundProfiles.length > 0) {
      return res.json({
        response: `I found ${foundProfiles.length} candidate match${foundProfiles.length === 1 ? '' : 'es'} that fit your search criteria. Here are the strongest matches.`,
        profiles: foundProfiles.slice(0, 4),
      })
    }

    return res.json({
      response: 'I did not find an exact match for that search. I can broaden the search if you want to include more locations or skill sets.',
      profiles: [],
    })
  }

  res.json({
    response: 'I can help with recruiting strategy, candidate outreach, and LinkedIn profile search. Try asking me to find talent by role, location, or experience.',
    profiles: [],
  })
})

export default router
