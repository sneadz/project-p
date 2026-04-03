import { PandaScoreMatch } from '@/types/pandascore'

export interface MatchScore {
  shards: number
  isExact: boolean
  isCorrectWinner: boolean
}

export function getRealScore(
  match: PandaScoreMatch,
  team1Id: number,
  team2Id: number
): string | null {
  if (!match.results || match.results.length < 2) return null
  const s1 = match.results.find((r) => r.team_id === team1Id)?.score ?? 0
  const s2 = match.results.find((r) => r.team_id === team2Id)?.score ?? 0
  return `${s1}-${s2}`
}

export function calculateMatchShards(
  betScore: string,
  realScore: string,
  team1Id: number,
  team2Id: number
): MatchScore {
  if (betScore === realScore) {
    return { shards: 2, isExact: true, isCorrectWinner: true }
  }

  const [bet1, bet2] = betScore.split('-').map(Number)
  const [real1, real2] = realScore.split('-').map(Number)
  const betWinner = bet1 > bet2 ? team1Id : team2Id
  const realWinner = real1 > real2 ? team1Id : team2Id

  if (betWinner === realWinner) {
    return { shards: 1, isExact: false, isCorrectWinner: true }
  }

  return { shards: 0, isExact: false, isCorrectWinner: false }
}

export function generateScores(numberOfGames: number): string[] {
  if (numberOfGames === 1) return ['1-0', '0-1']
  const threshold = Math.ceil(numberOfGames / 2)
  const scores: string[] = []
  for (let i = 0; i < threshold; i++) scores.push(`${threshold}-${i}`)
  for (let i = threshold - 1; i >= 0; i--) scores.push(`${i}-${threshold}`)
  return scores
}

export function calculateWinRates(matches: PandaScoreMatch[]): Record<number, number | null> {
  const teamStats: Record<number, { wins: number; losses: number }> = {}

  for (const match of matches) {
    if (match.status !== 'finished' || !match.results || match.opponents.length < 2) continue
    const team1 = match.opponents[0]?.opponent
    const team2 = match.opponents[1]?.opponent
    if (!team1 || !team2) continue
    const r1 = match.results.find((r) => r.team_id === team1.id)
    const r2 = match.results.find((r) => r.team_id === team2.id)
    if (!r1 || !r2) continue
    if (!teamStats[team1.id]) teamStats[team1.id] = { wins: 0, losses: 0 }
    if (!teamStats[team2.id]) teamStats[team2.id] = { wins: 0, losses: 0 }
    if (r1.score > r2.score) {
      teamStats[team1.id].wins++
      teamStats[team2.id].losses++
    } else {
      teamStats[team2.id].wins++
      teamStats[team1.id].losses++
    }
  }

  const winRates: Record<number, number | null> = {}
  for (const [id, s] of Object.entries(teamStats)) {
    const total = s.wins + s.losses
    winRates[Number(id)] = total > 0 ? Math.round((s.wins / total) * 100) : null
  }
  return winRates
}

export function calculateSeriePoints(
  matches: PandaScoreMatch[],
  userBets: Record<number, string>
): number {
  return calculateSerieStats(matches, userBets).shards
}

export function calculateSerieStats(
  matches: PandaScoreMatch[],
  userBets: Record<number, string>
): { shards: number; correct: number; exact: number } {
  let shards = 0, correct = 0, exact = 0
  for (const match of matches) {
    const bet = userBets[match.id]
    if (!bet || match.status !== 'finished') continue

    const team1 = match.opponents[0]?.opponent
    const team2 = match.opponents[1]?.opponent
    if (!team1 || !team2) continue

    const realScore = getRealScore(match, team1.id, team2.id)
    if (!realScore) continue

    const result = calculateMatchShards(bet, realScore, team1.id, team2.id)
    shards += result.shards
    if (result.isCorrectWinner) correct++
    if (result.isExact) exact++
  }
  return { shards, correct, exact }
}
