import express from 'express'
import { sampleProfiles } from '../data/sampleProfiles.js'

const router = express.Router()

router.post('/save', (req, res) => {
  const { profileId } = req.body
  const profile = sampleProfiles.find((item) => item.id === profileId)

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found.' })
  }

  profile.saved = true
  res.json({ success: true })
})

router.delete('/unsave', (req, res) => {
  const { profileId } = req.body
  const profile = sampleProfiles.find((item) => item.id === profileId)

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found.' })
  }

  profile.saved = false
  res.json({ success: true })
})

router.post('/export', (req, res) => {
  const { profileIds = [], format = 'csv' } = req.body
  const selectedProfiles = sampleProfiles.filter((profile) => profileIds.includes(profile.id))

  if (selectedProfiles.length === 0) {
    return res.status(400).json({ error: 'No profiles selected for export.' })
  }

  const headers = ['Name', 'Role', 'Company', 'Location', 'Experience', 'Connections', 'Open to Work']
  const csvRows = selectedProfiles.map((profile) => [
    profile.name,
    profile.currentRole,
    profile.currentCompany,
    profile.location,
    profile.experienceYears,
    profile.connections,
    profile.openToWork ? 'Yes' : 'No',
  ])

  const csv = [headers, ...csvRows]
    .map((row) => row.map((value) => JSON.stringify(value || '')).join(','))
    .join('\n')

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename=profiles.${format}`)
  res.send(csv)
})

export default router
