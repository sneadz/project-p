import { PandaScoreMatch, PandaScoreSerie } from '@/types/pandascore'

const PANDASCORE_API_KEY = process.env.PANDASCORE_API_KEY
const BASE_URL = 'https://api.pandascore.co'

export async function getUpcomingSeries(): Promise<PandaScoreSerie[]> {
  console.log('Fetching series (upcoming and running)...')
  if (!PANDASCORE_API_KEY || PANDASCORE_API_KEY === 'your_pandascore_api_key') {
    console.warn('PandaScore API key is missing or default.')
    return []
  }

  try {
    // Fetch both running and upcoming series
    const [runningRes, upcomingRes] = await Promise.all([
      fetch(`${BASE_URL}/series/running?sort=begin_at&per_page=50`, {
        headers: { Authorization: `Bearer ${PANDASCORE_API_KEY}` },
        next: { revalidate: 3600 },
      }),
      fetch(`${BASE_URL}/series/upcoming?sort=begin_at&per_page=50`, {
        headers: { Authorization: `Bearer ${PANDASCORE_API_KEY}` },
        next: { revalidate: 3600 },
      })
    ])

    const runningSeries: PandaScoreSerie[] = runningRes.ok ? await runningRes.json() : []
    const upcomingSeries: PandaScoreSerie[] = upcomingRes.ok ? await upcomingRes.json() : []
    
    // Combine and remove duplicates (by ID)
    const allSeries = [...runningSeries, ...upcomingSeries]
    const uniqueSeries = Array.from(new Map(allSeries.map(s => [s.id, s])).values())

    console.log(`Fetched ${uniqueSeries.length} total unique series before filtering.`)
    
    // Filter by videogame and tier (S or A)
    const filtered = uniqueSeries.filter(serie => {
      // Check for CS2 (cs-go/cs-go-2/cs-2) or Valorant
      const isTargetGame = ['cs-go', 'cs-go-2', 'cs-2', 'valorant'].includes(serie.videogame.slug)
      
      // Check if any tournament in the series is S or A tier
      const hasTargetTier = serie.tournaments.some(t => ['s', 'a'].includes(t.tier?.toLowerCase()))
      
      // Also include series that might not have tier set but are known major tournaments
      const isMajorByTitle = (serie.league.name.toLowerCase().includes('masters') || 
                            serie.league.name.toLowerCase().includes('major') ||
                            serie.league.name.toLowerCase().includes('champions') ||
                            serie.league.name.toLowerCase().includes('vct')) &&
                            !serie.tournaments.some(t => ['d', 'e'].includes(t.tier?.toLowerCase()))

      return isTargetGame && (hasTargetTier || isMajorByTitle)
    })
    
    console.log(`Found ${filtered.length} matching series (S/A tier).`)
    return filtered
  } catch (error) {
    console.error('Error fetching series:', error)
    return []
  }
}

export async function getSerieById(serieId: number): Promise<PandaScoreSerie | null> {
  if (!PANDASCORE_API_KEY || PANDASCORE_API_KEY === 'your_pandascore_api_key') {
    return null
  }

  try {
    const response = await fetch(
      `${BASE_URL}/series/${serieId}`,
      {
        headers: {
          Authorization: `Bearer ${PANDASCORE_API_KEY}`,
        },
        next: { revalidate: 3600 },
      }
    )

    if (!response.ok) {
      return null
    }

    return response.json()
  } catch (error) {
    console.error('Error fetching serie by ID:', error)
    return null
  }
}

export async function getMatchesBySerie(serieId: number): Promise<PandaScoreMatch[]> {
  if (!PANDASCORE_API_KEY || PANDASCORE_API_KEY === 'your_pandascore_api_key') {
    return []
  }

  try {
    const response = await fetch(
      `${BASE_URL}/series/${serieId}/matches?sort=begin_at`,
      {
        headers: {
          Authorization: `Bearer ${PANDASCORE_API_KEY}`,
        },
        next: { revalidate: 600 }, // Cache for 10 minutes
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch matches for serie')
    }

    return response.json()
  } catch (error) {
    console.error('Error fetching matches by serie:', error)
    return []
  }
}

export async function getUpcomingMatches(): Promise<PandaScoreMatch[]> {
  if (!PANDASCORE_API_KEY || PANDASCORE_API_KEY === 'your_pandascore_api_key') {
    console.warn('PandaScore API key is missing. Returning empty array.')
    return []
  }

  // Fetching upcoming CS2 (videogame_id=3) and Valorant (videogame_id=26) matches
  // Using filter[videogame]=cs-go,valorant
  const response = await fetch(
    `${BASE_URL}/matches/upcoming?filter[videogame]=cs-go,valorant&sort=begin_at&per_page=12`,
    {
      headers: {
        Authorization: `Bearer ${PANDASCORE_API_KEY}`,
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch matches from PandaScore')
  }

  return response.json()
}
