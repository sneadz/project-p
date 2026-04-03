import { describe, it, expect } from 'vitest'
import { calculateMatchShards, getRealScore, calculateSeriePoints } from './scoring'
import type { PandaScoreMatch } from '@/types/pandascore'

const TEAM1_ID = 1
const TEAM2_ID = 2

describe('calculateMatchShards', () => {
  it('retourne 2 shards pour un score exact', () => {
    const result = calculateMatchShards('2-1', '2-1', TEAM1_ID, TEAM2_ID)
    expect(result).toEqual({ shards: 2, isExact: true, isCorrectWinner: true })
  })

  it('retourne 2 shards pour un score exact inversé', () => {
    const result = calculateMatchShards('0-2', '0-2', TEAM1_ID, TEAM2_ID)
    expect(result).toEqual({ shards: 2, isExact: true, isCorrectWinner: true })
  })

  it('retourne 1 shard pour bon winner mais mauvais score', () => {
    const result = calculateMatchShards('2-0', '2-1', TEAM1_ID, TEAM2_ID)
    expect(result).toEqual({ shards: 1, isExact: false, isCorrectWinner: true })
  })

  it('retourne 1 shard pour bon winner (team2) mais mauvais score', () => {
    const result = calculateMatchShards('0-2', '1-2', TEAM1_ID, TEAM2_ID)
    expect(result).toEqual({ shards: 1, isExact: false, isCorrectWinner: true })
  })

  it('retourne 0 shard pour mauvais winner', () => {
    const result = calculateMatchShards('2-0', '0-2', TEAM1_ID, TEAM2_ID)
    expect(result).toEqual({ shards: 0, isExact: false, isCorrectWinner: false })
  })

  it('retourne 0 shard pour mauvais winner (team2 prédit, team1 gagne)', () => {
    const result = calculateMatchShards('1-2', '2-1', TEAM1_ID, TEAM2_ID)
    expect(result).toEqual({ shards: 0, isExact: false, isCorrectWinner: false })
  })
})

describe('getRealScore', () => {
  const makeMatch = (s1: number, s2: number): PandaScoreMatch =>
    ({
      results: [
        { team_id: TEAM1_ID, score: s1 },
        { team_id: TEAM2_ID, score: s2 },
      ],
    }) as unknown as PandaScoreMatch

  it('retourne le score au format "s1-s2"', () => {
    expect(getRealScore(makeMatch(2, 1), TEAM1_ID, TEAM2_ID)).toBe('2-1')
  })

  it('retourne null si results est vide', () => {
    const match = { results: [] } as unknown as PandaScoreMatch
    expect(getRealScore(match, TEAM1_ID, TEAM2_ID)).toBeNull()
  })

  it('retourne null si results est undefined', () => {
    const match = {} as unknown as PandaScoreMatch
    expect(getRealScore(match, TEAM1_ID, TEAM2_ID)).toBeNull()
  })
})

describe('calculateSeriePoints', () => {
  const makeFinishedMatch = (id: number, s1: number, s2: number): PandaScoreMatch =>
    ({
      id,
      status: 'finished',
      opponents: [
        { opponent: { id: TEAM1_ID, name: 'Team1' } },
        { opponent: { id: TEAM2_ID, name: 'Team2' } },
      ],
      results: [
        { team_id: TEAM1_ID, score: s1 },
        { team_id: TEAM2_ID, score: s2 },
      ],
    }) as unknown as PandaScoreMatch

  it('calcule 0 points si aucun pari', () => {
    const matches = [makeFinishedMatch(1, 2, 1)]
    expect(calculateSeriePoints(matches, {})).toBe(0)
  })

  it('calcule 2 points pour un score exact', () => {
    const matches = [makeFinishedMatch(1, 2, 1)]
    expect(calculateSeriePoints(matches, { 1: '2-1' })).toBe(2)
  })

  it('calcule 1 point pour bon winner', () => {
    const matches = [makeFinishedMatch(1, 2, 1)]
    expect(calculateSeriePoints(matches, { 1: '2-0' })).toBe(1)
  })

  it('calcule 0 points pour mauvais winner', () => {
    const matches = [makeFinishedMatch(1, 2, 1)]
    expect(calculateSeriePoints(matches, { 1: '0-2' })).toBe(0)
  })

  it('accumule les points sur plusieurs matchs', () => {
    const matches = [
      makeFinishedMatch(1, 2, 0), // exact → 2
      makeFinishedMatch(2, 2, 1), // exact → 2
      makeFinishedMatch(3, 1, 2), // mauvais winner → 0
    ]
    const bets = { 1: '2-0', 2: '2-0', 3: '2-1' }
    expect(calculateSeriePoints(matches, bets)).toBe(3) // 2 + 1 + 0
  })

  it('ignore les matchs non terminés', () => {
    const match = { ...makeFinishedMatch(1, 2, 1), status: 'not_started' } as unknown as PandaScoreMatch
    expect(calculateSeriePoints([match], { 1: '2-1' })).toBe(0)
  })
})
