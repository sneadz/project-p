import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Pencil, Gem, Trophy, Target, Crosshair } from 'lucide-react'
import { AvatarWithBorder } from '@/components/avatar-with-border'
import { getMatchesBySerie } from '@/lib/pandascore'
import { calculateMatchShards, getRealScore } from '@/lib/scoring'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url, active_border')
    .eq('id', user.id)
    .single()

  const displayName = profile?.username || user.email

  // Fetch all bets
  const { data: allBets } = await supabase
    .from('bets')
    .select('match_id, serie_id, score')
    .eq('user_id', user.id)

  const totalPredictions = allBets?.length || 0
  let correctWinner = 0
  let exactScore = 0
  let totalShards = 0
  let finishedBets = 0

  const serieStatsList: {
    serie_id: number
    serie_name: string
    league_name: string
    videogame_slug: string
    shards: number
    correct_predictions: number
    exact_predictions: number
    total_bets: number
    rank: number
    total_participants: number
  }[] = []

  if (allBets && allBets.length > 0) {
    const serieIds = [...new Set(allBets.map((b) => b.serie_id))]

    await Promise.all(
      serieIds.map(async (serieId) => {
        const matches = await getMatchesBySerie(serieId).catch(() => [])
        const serieBets = allBets.filter((b) => b.serie_id === serieId)

        let serieShards = 0
        let serieCorrect = 0
        let serieExact = 0
        let serieTotalBets = 0

        for (const bet of serieBets) {
          const match = matches.find((m) => m.id === bet.match_id)
          if (!match || match.status !== 'finished' || !match.results || match.results.length < 2)
            continue

          const team1 = match.opponents[0]?.opponent
          const team2 = match.opponents[1]?.opponent
          if (!team1 || !team2) continue

          const realScore = getRealScore(match, team1.id, team2.id)
          if (!realScore) continue

          finishedBets++
          serieTotalBets++

          const { shards, isExact, isCorrectWinner } = calculateMatchShards(
            bet.score,
            realScore,
            team1.id,
            team2.id
          )
          totalShards += shards
          serieShards += shards
          if (isCorrectWinner) { correctWinner++; serieCorrect++ }
          if (isExact) { exactScore++; serieExact++ }
        }

        // Sync correct/exact dans registrations pour le leaderboard par compétition
        await supabase.from('registrations')
          .update({ correct_predictions: serieCorrect, exact_predictions: serieExact })
          .eq('user_id', user.id)
          .eq('serie_id', serieId)

        // Archive si tous les matchs sont terminés ou annulés
        const allDone = matches.length > 0 && matches.every(
          (m) => m.status === 'finished' || m.status === 'canceled'
        )
        if (allDone && serieTotalBets > 0 && matches.length > 0) {
          const firstMatch = matches[0]

          // Calculer le rang parmi les participants
          const { count: betterCount } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('serie_id', serieId)
            .gt('correct_predictions', serieCorrect)

          const { count: totalParticipants } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('serie_id', serieId)

          serieStatsList.push({
            serie_id: serieId,
            serie_name: firstMatch.serie.full_name,
            league_name: firstMatch.league.name,
            videogame_slug: firstMatch.videogame.slug,
            shards: serieShards,
            correct_predictions: serieCorrect,
            exact_predictions: serieExact,
            total_bets: serieTotalBets,
            rank: (betterCount ?? 0) + 1,
            total_participants: totalParticipants ?? 1,
          })
        }
      })
    )
  }

  if (serieStatsList.length > 0) {
    await supabase.from('serie_stats').upsert(
      serieStatsList.map((s) => ({ user_id: user.id, ...s })),
      { onConflict: 'user_id,serie_id' }
    )
  }

  // Fetch all archived serie stats for display
  const { data: archivedStats } = await supabase
    .from('serie_stats')
    .select('*')
    .eq('user_id', user.id)
    .order('archived_at', { ascending: false })

  const winRate = finishedBets > 0 ? Math.round((correctWinner / finishedBets) * 100) : 0

  // Sync stats to profiles for leaderboard
  await supabase.from('profiles').upsert({
    id: user.id,
    total_shards: totalShards,
    correct_predictions: correctWinner,
    exact_predictions: exactScore,
    updated_at: new Date().toISOString(),
  })

  // Leaderboard rank
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gt('total_shards', totalShards)

  const rank = (count || 0) + 1
  const rankDisplay = rank > 100 ? '+100' : `#${rank}`

  const stats = [
    { label: 'Prédictions placées', value: totalPredictions.toString() },
    { label: 'Prédictions réussies', value: correctWinner.toString() },
    { label: 'Scores exacts', value: exactScore.toString() },
    { label: 'Shards totaux', value: totalShards.toString(), icon: true },
    { label: 'Winrate', value: finishedBets > 0 ? `${winRate}%` : '—' },
    { label: 'Rang global', value: totalPredictions > 0 ? rankDisplay : '—' },
  ]

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto max-w-2xl px-4 py-16 space-y-10">
        {/* Header profil */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <AvatarWithBorder
              avatarId={profile?.avatar_url ?? null}
              borderId={profile?.active_border ?? null}
              size="lg"
              alt="Avatar"
            />
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">{displayName}</h1>
              {profile?.username && <p className="text-sm text-muted-foreground">{user.email}</p>}
            </div>
          </div>
          <Link href="/profile/edit">
            <Button variant="outline" size="sm" className="gap-2">
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </Button>
          </Link>
        </div>

        <div className="border-t border-border" />

        {/* Stats */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold uppercase tracking-wider text-muted-foreground">
            Statistiques
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-border bg-card p-4 space-y-1"
              >
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="text-2xl font-black text-primary flex items-center gap-1.5">
                  {stat.icon && <Gem className="h-5 w-5" />}
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Historique des compétitions */}
        {archivedStats && archivedStats.length > 0 && (
          <>
            <div className="border-t border-border" />
            <div className="space-y-4">
              <h2 className="text-lg font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Compétitions jouées
              </h2>
              <div className="space-y-2">
                {archivedStats.map((s) => (
                  <Link key={s.serie_id} href={`/profile/stats/${s.serie_id}`} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4 hover:border-primary/40 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{s.league_name}</p>
                      <p className="text-xs text-muted-foreground italic truncate">{s.serie_name}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
                      {s.rank && (
                        <span className="text-base font-black text-yellow-500 uppercase tracking-widest">
                          Top #{s.rank}
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-green-500" title="Paris réussis">
                        <Target className="h-3.5 w-3.5" />
                        <span className="text-sm font-black tabular-nums">{s.correct_predictions}/{s.total_bets}</span>
                      </div>
                      <div className="flex items-center gap-1 text-primary" title="Scores exacts">
                        <Crosshair className="h-3.5 w-3.5" />
                        <span className="text-sm font-black tabular-nums">{s.exact_predictions}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
