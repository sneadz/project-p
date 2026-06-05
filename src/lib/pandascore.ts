import { PandaScoreMatch, PandaScoreSerie, PandaScoreTeam } from '@/types/pandascore'

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
      fetch(`${BASE_URL}/series/running?sort=begin_at&per_page=100`, {
        headers: { Authorization: `Bearer ${PANDASCORE_API_KEY}` },
        next: { revalidate: 1800 },
      }),
      fetch(`${BASE_URL}/series/upcoming?sort=begin_at&per_page=100`, {
        headers: { Authorization: `Bearer ${PANDASCORE_API_KEY}` },
        next: { revalidate: 1800 },
      }),
    ])

    const runningSeries: PandaScoreSerie[] = runningRes.ok ? await runningRes.json() : []
    const upcomingSeries: PandaScoreSerie[] = upcomingRes.ok ? await upcomingRes.json() : []

    // Combine and remove duplicates (by ID)
    const allSeries = [...runningSeries, ...upcomingSeries]
    const uniqueSeries = Array.from(new Map(allSeries.map((s) => [s.id, s])).values())

    console.log(`Fetched ${uniqueSeries.length} total unique series before filtering.`)

    // Filter by videogame and tier (S or A)
    const filtered = uniqueSeries.filter((serie) => {
      // Check for CS2 (cs-go/cs-go-2/cs-2) or Valorant
      const isTargetGame = ['cs-go', 'cs-go-2', 'cs-2', 'valorant'].includes(serie.videogame.slug)

      const hasGoodTier = serie.tournaments.some((t) =>
        ['s', 'a', 'b'].includes(t.tier?.toLowerCase())
      )
      const hasNoLowTier = !serie.tournaments.some((t) =>
        ['c', 'd', 'e'].includes(t.tier?.toLowerCase())
      )

      return isTargetGame && hasGoodTier && hasNoLowTier
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
    const response = await fetch(`${BASE_URL}/series/${serieId}`, {
      headers: {
        Authorization: `Bearer ${PANDASCORE_API_KEY}`,
      },
      next: { revalidate: 3600 },
    })

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
    const PER_PAGE = 100
    const firstRes = await fetch(
      `${BASE_URL}/series/${serieId}/matches?sort=begin_at&per_page=${PER_PAGE}&page=1`,
      { headers: { Authorization: `Bearer ${PANDASCORE_API_KEY}` }, next: { revalidate: 600 } }
    )
    if (!firstRes.ok) throw new Error('Failed to fetch matches for serie')

    const total = parseInt(firstRes.headers.get('x-total') ?? '0', 10)
    const firstPage: PandaScoreMatch[] = await firstRes.json()

    if (total <= PER_PAGE) return firstPage

    const pageCount = Math.ceil(total / PER_PAGE)
    const rest = await Promise.all(
      Array.from({ length: pageCount - 1 }, (_, i) =>
        fetch(
          `${BASE_URL}/series/${serieId}/matches?sort=begin_at&per_page=${PER_PAGE}&page=${i + 2}`,
          { headers: { Authorization: `Bearer ${PANDASCORE_API_KEY}` }, next: { revalidate: 600 } }
        ).then((r) => r.json() as Promise<PandaScoreMatch[]>)
      )
    )

    return [...firstPage, ...rest.flat()]
  } catch (error) {
    console.error('Error fetching matches by serie:', error)
    return []
  }
}

export async function getMatchById(matchId: number): Promise<PandaScoreMatch | null> {
  if (!PANDASCORE_API_KEY || PANDASCORE_API_KEY === 'your_pandascore_api_key') {
    return null
  }

  try {
    const response = await fetch(`${BASE_URL}/matches/${matchId}`, {
      headers: {
        Authorization: `Bearer ${PANDASCORE_API_KEY}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) return null
    return response.json()
  } catch (error) {
    console.error('Error fetching match by id:', error)
    return null
  }
}

export async function searchTeams(query: string): Promise<PandaScoreTeam[]> {
  if (!PANDASCORE_API_KEY || PANDASCORE_API_KEY === 'your_pandascore_api_key') return []
  if (!query.trim()) return []

  try {
    const [csRes, valRes] = await Promise.all([
      fetch(`${BASE_URL}/csgo/teams?search[name]=${encodeURIComponent(query)}&per_page=8&sort=name`, {
        headers: { Authorization: `Bearer ${PANDASCORE_API_KEY}` },
        next: { revalidate: 60 },
      }),
      fetch(`${BASE_URL}/valorant/teams?search[name]=${encodeURIComponent(query)}&per_page=8&sort=name`, {
        headers: { Authorization: `Bearer ${PANDASCORE_API_KEY}` },
        next: { revalidate: 60 },
      }),
    ])
    const csTeams: PandaScoreTeam[] = csRes.ok ? (await csRes.json()).map((t: PandaScoreTeam) => ({ ...t, game: 'CS2' as const })) : []
    const valTeams: PandaScoreTeam[] = valRes.ok ? (await valRes.json()).map((t: PandaScoreTeam) => ({ ...t, game: 'Valorant' as const })) : []
    // Merge by id, limit to 10
    const merged = Array.from(new Map([...csTeams, ...valTeams].map((t) => [t.id, t])).values())
    return merged.slice(0, 10)
  } catch {
    return []
  }
}

export async function getTeamActiveSeries(teamId: number): Promise<PandaScoreSerie[]> {
  if (!PANDASCORE_API_KEY || PANDASCORE_API_KEY === 'your_pandascore_api_key') return []

  try {
    const res = await fetch(`${BASE_URL}/teams/${teamId}/series?sort=begin_at&per_page=20`, {
      headers: { Authorization: `Bearer ${PANDASCORE_API_KEY}` },
      next: { revalidate: 1800 },
    })
    if (!res.ok) return []
    const all: PandaScoreSerie[] = await res.json()
    return all.filter(
      (s) =>
        ['cs-go', 'cs-go-2', 'cs-2', 'valorant'].includes(s.videogame.slug) &&
        (s.end_at === null || new Date(s.end_at) >= new Date())
    )
  } catch {
    return []
  }
}

