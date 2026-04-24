export const revalidate = 60

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getMatchesBySerie } from '@/lib/pandascore'
import { calculateMatchShards, getRealScore } from '@/lib/scoring'
import Link from 'next/link'
import { ChevronLeft, Gem, Target, Crosshair, X } from 'lucide-react'

interface SerieStatsPageProps {
  params: {
    serieId: string
  }
}

export default async function SerieStatsPage({ params }: SerieStatsPageProps) {
  const serieId = parseInt(params.serieId)
  if (isNaN(serieId)) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bets } = await supabase
    .from('bets')
    .select('match_id, score')
    .eq('user_id', user.id)
    .eq('serie_id', serieId)

  if (!bets || bets.length === 0) notFound()

  const matches = await getMatchesBySerie(serieId).catch(() => [])

  const betMap = new Map(bets.map((b) => [b.match_id, b.score]))

  const leagueName = matches[0]?.league?.name ?? 'Compétition'
  const serieName = matches[0]?.serie?.full_name ?? ''

  const betResults = matches
    .filter((m) => betMap.has(m.id))
    .map((m) => {
      const betScore = betMap.get(m.id)!
      const team1 = m.opponents[0]?.opponent
      const team2 = m.opponents[1]?.opponent

      if (m.status === 'finished' && team1 && team2) {
        const realScore = getRealScore(m, team1.id, team2.id)
        if (realScore) {
          const result = calculateMatchShards(betScore, realScore, team1.id, team2.id)
          return {
            matchId: m.id,
            team1: team1.name,
            team2: team2.name,
            betScore,
            realScore,
            shards: result.shards,
            isExact: result.isExact,
            isCorrectWinner: result.isCorrectWinner,
            status: 'finished' as const,
            scheduledAt: m.begin_at || m.scheduled_at,
          }
        }
      }

      return {
        matchId: m.id,
        team1: team1?.name ?? '?',
        team2: team2?.name ?? '?',
        betScore,
        realScore: null,
        shards: 0,
        isExact: false,
        isCorrectWinner: false,
        status: m.status as string,
        scheduledAt: m.begin_at || m.scheduled_at,
      }
    })
    .sort(
      (a, b) =>
        new Date(a.scheduledAt ?? 0).getTime() - new Date(b.scheduledAt ?? 0).getTime()
    )

  // Bets placés mais match pas dans PandaScore (série trop ancienne)
  const matchedMatchIds = new Set(matches.map((m) => m.id))
  const orphanBets = bets
    .filter((b) => !matchedMatchIds.has(b.match_id))
    .map((b) => ({
      matchId: b.match_id,
      team1: '?',
      team2: '?',
      betScore: b.score,
      realScore: null,
      shards: 0,
      isExact: false,
      isCorrectWinner: false,
      status: 'unknown',
      scheduledAt: null,
    }))

  const allBets = [...betResults, ...orphanBets]

  const finishedBets = allBets.filter((b) => b.status === 'finished')
  const totalShards = finishedBets.reduce((sum, b) => sum + b.shards, 0)
  const correct = finishedBets.filter((b) => b.isCorrectWinner).length
  const exact = finishedBets.filter((b) => b.isExact).length

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto max-w-2xl px-4 py-8 space-y-8">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 group text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">Profil</span>
        </Link>

        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
            {leagueName}
          </p>
          <h1 className="text-2xl font-black uppercase tracking-tighter">
            {serieName || leagueName}
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Shards</p>
            <p className="text-2xl font-black text-primary flex items-center gap-1.5">
              <Gem className="h-5 w-5" />
              {totalShards}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Réussis</p>
            <p className="text-2xl font-black text-green-500">
              {correct}/{finishedBets.length}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Exacts</p>
            <p className="text-2xl font-black text-primary">{exact}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {allBets.length} paris placés
          </h2>
          {allBets.map((b) => (
            <div key={b.matchId} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate">
                    {b.team1} vs {b.team2}
                  </p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      Mon pari :{' '}
                      <span className="font-mono font-bold text-foreground">{b.betScore}</span>
                    </span>
                    {b.realScore && (
                      <span className="text-xs text-muted-foreground">
                        Résultat :{' '}
                        <span className="font-mono font-bold text-foreground">{b.realScore}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  {b.status === 'finished' ? (
                    b.isExact ? (
                      <div className="flex items-center gap-1 text-primary" title="Score exact">
                        <Crosshair className="h-4 w-4" />
                        <span className="text-sm font-black">+2</span>
                      </div>
                    ) : b.isCorrectWinner ? (
                      <div className="flex items-center gap-1 text-green-500" title="Bon vainqueur">
                        <Target className="h-4 w-4" />
                        <span className="text-sm font-black">+1</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground" title="Mauvais pronostic">
                        <X className="h-4 w-4" />
                        <span className="text-sm font-black">+0</span>
                      </div>
                    )
                  ) : b.status === 'running' ? (
                    <span className="text-xs font-bold uppercase tracking-wide text-yellow-500 border border-yellow-500/30 rounded px-2 py-0.5">
                      En cours
                    </span>
                  ) : b.status === 'not_started' ? (
                    <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground border border-border rounded px-2 py-0.5">
                      À venir
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
