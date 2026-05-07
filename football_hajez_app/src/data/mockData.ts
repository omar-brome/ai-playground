import type { Match, Venue } from '../types/domain'

export const venues: Venue[] = [
  {
    id: '4b',
    name: '4B',
    location: 'Saida',
    image: '/venues/4b.png',
    mapUrl: 'https://maps.app.goo.gl/Ugf6Eh4RYSkwEHN29',
    surface: 'Outdoor',
    parking: 'Street',
    amenities: ['Changing rooms', 'Night lights', 'Water station'],
    about: 'Competitive mini-football venue in Saida with evening games and active local squads.',
  },
  {
    id: 'streetball',
    name: 'Streetball',
    location: 'Saida',
    image: '/venues/streetball.png',
    mapUrl: 'https://maps.app.goo.gl/eZKJbREvSoNQBuRw6',
    surface: 'Indoor',
    parking: 'Street',
    amenities: ['Snack kiosk', 'Lockers', 'Restrooms'],
    about: 'Fast-paced 5v5 hub in Saida, ideal for late-night sessions.',
  },
  {
    id: 'upland',
    name: 'Upland',
    location: 'Saida',
    image: '/venues/upland.png',
    mapUrl: 'https://maps.app.goo.gl/cyemhXa38TXLad2dA',
    surface: 'Outdoor',
    parking: 'Available',
    amenities: ['Spectator seats', 'Cafeteria', 'Warm-up area'],
    about: 'Saida venue with spacious sideline areas and clean turf.',
  },
  {
    id: 'ace',
    name: 'Ace Arena',
    location: 'Saida',
    image: '/venues/ace.png',
    mapUrl: 'https://maps.app.goo.gl/hvTuHSiCdpUZkHEV7',
    surface: 'Indoor',
    parking: 'Available',
    amenities: ['Showers', 'Equipment shop', 'Referee desk'],
    about: 'Well-organized Saida arena with premium lighting and smooth booking flow.',
  },
]

export const initialMatches: Match[] = [
  {
    id: 'm1',
    venueId: '4b',
    date: '2026-05-10',
    time: '18:00',
    type: '5-a-side',
    price: 300000,
    spots: {
      team1: { total: 5, booked: [] },
      team2: { total: 5, booked: [] },
    },
  },
  {
    id: 'm2',
    venueId: 'streetball',
    date: '2026-05-10',
    time: '20:00',
    type: '5-a-side',
    price: 300000,
    spots: {
      team1: { total: 5, booked: [] },
      team2: { total: 5, booked: [] },
    },
  },
  {
    id: 'm3',
    venueId: 'upland',
    date: '2026-05-11',
    time: '17:00',
    type: '5-a-side',
    price: 300000,
    spots: {
      team1: { total: 5, booked: [] },
      team2: { total: 5, booked: [] },
    },
  },
  {
    id: 'm4',
    venueId: 'ace',
    date: '2026-05-11',
    time: '19:30',
    type: '5-a-side',
    price: 300000,
    spots: {
      team1: { total: 5, booked: [] },
      team2: { total: 5, booked: [] },
    },
  },
]
