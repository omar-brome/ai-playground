import express from 'express'
import { sampleProfiles } from '../data/sampleProfiles.js'
import { parseLinkedInQuery } from '../utils/linkedinQueryParser.js'

const router = express.Router()

router.get('/search', (req, res) => {
  const { q = '', title = '', location = '', company = '', experience = '', page = '1', limit = '20' } = req.query
  const parsedQuery = parseLinkedInQuery(q)
  const normalizedTitle = title || parsedQuery.title || ''
  const normalizedLocation = location || parsedQuery.location || ''
  const normalizedCompany = company || parsedQuery.company || ''
  const numericExperience = experience ? Number(experience) : parsedQuery.experience
  const searchText = q.toLowerCase().trim()

  const filteredProfiles = sampleProfiles.filter((profile) => {
    const matchesTitle = normalizedTitle
      ? profile.currentRole.toLowerCase().includes(normalizedTitle.toLowerCase())
      : true
    const matchesLocation = normalizedLocation
      ? profile.location.toLowerCase().includes(normalizedLocation.toLowerCase())
      : true
    const matchesCompany = normalizedCompany
      ? profile.currentCompany.toLowerCase().includes(normalizedCompany.toLowerCase())
      : true
    const matchesExperience = numericExperience ? profile.experienceYears >= numericExperience : true
    const matchesSearchText = searchText
      ? [profile.name, profile.currentRole, profile.currentCompany, profile.location]
          .some((field) => field.toLowerCase().includes(searchText))
          || profile.skills.some((skill) => skill.toLowerCase().includes(searchText))
      : true

    return matchesTitle && matchesLocation && matchesCompany && matchesExperience && matchesSearchText
  })

  const pageNumber = Math.max(1, Number(page))
  const pageLimit = Math.max(1, Number(limit))
  const startIndex = (pageNumber - 1) * pageLimit
  const pagedProfiles = filteredProfiles.slice(startIndex, startIndex + pageLimit)

  res.json({
    profiles: pagedProfiles,
    total: filteredProfiles.length,
    page: pageNumber,
    limit: pageLimit,
    hasMore: startIndex + pageLimit < filteredProfiles.length,
  })
})

export default router
