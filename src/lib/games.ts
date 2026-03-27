const GAME_SLUGS_CS2 = ['cs-go', 'cs-go-2', 'cs-2']

function getGameKey(videogameSlug: string): 'cs2' | 'valorant' | null {
  if (GAME_SLUGS_CS2.includes(videogameSlug)) return 'cs2'
  if (videogameSlug === 'valorant') return 'valorant'
  return null
}

export function getGameBanner(videogameSlug: string): string | null {
  const key = getGameKey(videogameSlug)
  return key ? `/games/${key}-banner.png` : null
}

export function getGameSquare(videogameSlug: string): string | null {
  const key = getGameKey(videogameSlug)
  return key ? `/games/${key}-square.png` : null
}
