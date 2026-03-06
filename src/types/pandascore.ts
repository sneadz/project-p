export interface PandaScoreMatch {
  id: number
  name: string
  begin_at: string
  league: {
    id: number
    name: string
    image_url: string | null
  }
  serie: {
    id: number
    full_name: string
  }
  videogame: {
    name: string
    slug: string
    image_url?: string | null
  }
  opponents: Array<{
    opponent: {
      id: number
      name: string
      image_url: string | null
    }
  }>
  status: 'not_started' | 'running' | 'finished' | 'postponed' | 'canceled'
  number_of_games: number
  results: Array<{
    team_id: number
    score: number
  }>
  winner_id: number | null
}

export interface PandaScoreSerie {
  id: number
  name: string
  full_name: string
  begin_at: string
  end_at: string | null
  league_id: number
  image_url: string | null
  league: {
    id: number
    name: string
    image_url: string | null
  }
  videogame: {
    id: number
    name: string
    slug: string
    image_url?: string | null
  }
  tournaments: Array<{
    id: number
    name: string
    tier: string
  }>
}
