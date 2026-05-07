export const revalidate = 30

import { getMatchesBySerie, getSerieById } from '@/lib/pandascore'
import { ChevronLeft } from 'lucide-react'
import { getGameSquare } from '@/lib/games'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ScrollToUpcoming } from '@/components/scroll-to-upcoming'
import { MatchGroups } from '@/components/match-groups'
import { StickyJoinBar } from '@/components/sticky-join-bar'
import { TeamSummary } from '@/components/teams-modal'
import { PandaScoreMatch } from '@/types/pandascore'
import { calculateSerieStats, calculateWinRates } from '@/lib/scoring'
import { NoMatches } from '@/components/no-matches'
import { SeriePageHeader } from '@/components/serie-page-header'

interface SeriePageProps {
  params: Promise<{ id: string }>
}

export default async function SeriePage({ params }: SeriePageProps) {
  const { id } = await params
  const serieId = parseInt(id)

  if (isNaN(serieId)) {
    notFound()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Vérifier si l'utilisateur est inscrit à cette compétition
  let isJoined = false
  let userBets: Record<number, string> = {}
  let totalPoints = 0
  let favoriteTeamId: number | null = null

  if (user) {
    const { data: registration } = await supabase
      .from('registrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('serie_id', serieId)
      .single()

    isJoined = !!registration

    const { data: favorite } = await supabase
      .from('favorite_teams')
      .select('team_id')
      .eq('user_id', user.id)
      .eq('serie_id', serieId)
      .single()
    favoriteTeamId = favorite?.team_id ?? null

    if (isJoined) {
      const { data: bets } = await supabase
        .from('bets')
        .select('match_id, score')
        .eq('user_id', user.id)
        .eq('serie_id', serieId)

      if (bets) {
        userBets = bets.reduce(
          (acc, bet) => {
            acc[bet.match_id] = bet.score
            return acc
          },
          {} as Record<number, string>
        )
      }
    }
  }

  // On récupère les infos de la série via l'API directe ou le cache
  const serie = await getSerieById(serieId)

  // Si on n'a pas pu récupérer la série, on tente quand même les matchs
  // mais si les deux échouent, là on affiche un 404
  const matches = await getMatchesBySerie(serieId).catch(() => [])

  // Calcul des points totaux + stats pour l'UI
  let userCorrect = 0
  let userExact = 0
  if (isJoined && matches.length > 0) {
    const stats = calculateSerieStats(matches, userBets)
    totalPoints = stats.shards
    userCorrect = stats.correct
    userExact = stats.exact
  }

  // Leaderboard data
  let leaderboardEntries: { user_id: string; correct_predictions: number; exact_predictions: number; username: string | null; avatar_url: string | null }[] = []
  let currentUserRank: number | null = null

  if (matches.length > 0) {
    const supabaseForLeader = await createClient()
    const { data: regs } = await supabaseForLeader
      .from('registrations')
      .select('user_id, correct_predictions, exact_predictions')
      .eq('serie_id', serieId)
      .order('correct_predictions', { ascending: false })
      .order('exact_predictions', { ascending: false })
      .limit(10)

    if (regs && regs.length > 0) {
      const uids = regs.map((r) => r.user_id)
      const { data: profiles } = await supabaseForLeader
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', uids)
      const pMap = new Map((profiles ?? []).map((p) => [p.id, p]))
      leaderboardEntries = regs.map((r) => ({
        ...r,
        correct_predictions: r.correct_predictions ?? 0,
        exact_predictions: r.exact_predictions ?? 0,
        username: pMap.get(r.user_id)?.username ?? null,
        avatar_url: pMap.get(r.user_id)?.avatar_url ?? null,
      }))
    }

    if (user) {
      const { count } = await supabaseForLeader
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('serie_id', serieId)
        .gt('correct_predictions', userCorrect)
      currentUserRank = (count ?? 0) + 1
    }
  }

  const winRates = calculateWinRates(matches)

  if (!serie && matches.length === 0) {
    notFound()
  }

  // Fallback si la série est null mais qu'on a des matchs
  const leagueName =
    serie?.league?.name || (matches.length > 0 ? matches[0].league.name : 'Tournoi')
  const gameSlug = serie?.videogame?.slug || (matches.length > 0 ? matches[0].videogame.slug : '')
  const gameSquare = getGameSquare(gameSlug)
  const fullSerieName =
    serie?.full_name ||
    (matches.length > 0 ? matches[0].serie.full_name : 'Détails de la compétition')
  const videogameName =
    serie?.videogame?.name || (matches.length > 0 ? matches[0].videogame.name : '')
  const beginAt =
    serie?.begin_at || (matches.length > 0 ? matches[0].begin_at || matches[0].scheduled_at : null)


  // Grouper les matchs par tournoi (phase)
  const matchesByTournament = matches.reduce(
    (acc, match) => {
      const tournamentName = match.tournament?.name || 'Autres'
      if (!acc[tournamentName]) {
        acc[tournamentName] = []
      }
      acc[tournamentName].push(match)
      return acc
    },
    {} as Record<string, PandaScoreMatch[]>
  )

  // Trier les tournois par date du premier match
  const sortedTournamentNames = Object.keys(matchesByTournament).sort((a, b) => {
    const dateA = new Date(
      matchesByTournament[a][0].begin_at || matchesByTournament[a][0].scheduled_at
    ).getTime()
    const dateB = new Date(
      matchesByTournament[b][0].begin_at || matchesByTournament[b][0].scheduled_at
    ).getTime()
    return dateA - dateB
  })

  // Extraire les équipes depuis les matchs groupées par phase
  const teamsMap = new Map<string, TeamSummary>()
  for (const match of matches) {
    const phase = match.tournament?.name || 'Participants'
    for (const opp of match.opponents ?? []) {
      const team = opp.opponent
      if (!team) continue
      const key = `${team.id}-${phase}`
      if (!teamsMap.has(key)) {
        teamsMap.set(key, {
          id: team.id,
          name: team.name,
          image_url: team.image_url ?? null,
          wins: 0,
          losses: 0,
          phase,
        })
      }
    }
    if (match.status === 'finished' && match.results && match.opponents?.length === 2) {
      const t1 = match.opponents[0]?.opponent
      const t2 = match.opponents[1]?.opponent
      const r1 = match.results.find((r: { team_id: number; score: number }) => r.team_id === t1?.id)
      const r2 = match.results.find((r: { team_id: number; score: number }) => r.team_id === t2?.id)
      if (t1 && t2 && r1 && r2) {
        const phase = match.tournament?.name || 'Participants'
        const winner = r1.score > r2.score ? t1.id : t2.id
        const k1 = `${t1.id}-${phase}`
        const k2 = `${t2.id}-${phase}`
        if (teamsMap.has(k1)) {
          if (winner === t1.id) teamsMap.get(k1)!.wins++
          else teamsMap.get(k1)!.losses++
        }
        if (teamsMap.has(k2)) {
          if (winner === t2.id) teamsMap.get(k2)!.wins++
          else teamsMap.get(k2)!.losses++
        }
      }
    }
  }
  const teams = Array.from(teamsMap.values())
  const favoriteTeam = favoriteTeamId ? (teams.find((t) => t.id === favoriteTeamId) ?? null) : null

  // Déterminer si le tournoi a démarré
  const serieStarted = matches.some((m) => m.status === 'running' || m.status === 'finished')

  // Équipes encore actives (apparaissent dans un match à venir ou en cours)
  const activeTeamIds = new Set<number>()
  for (const match of matches) {
    if (match.status === 'not_started' || match.status === 'running') {
      for (const opp of match.opponents ?? []) {
        if (opp.opponent) activeTeamIds.add(opp.opponent.id)
      }
    }
  }

  // Trouver le premier match non terminé et non annulé pour le scroll automatique
  const firstUpcomingMatch = matches.find((m) => m.status !== 'finished' && m.status !== 'canceled')

  return (
    <main className="min-h-screen bg-background text-foreground pb-24">
      <ScrollToUpcoming matchId={firstUpcomingMatch?.id || null} />
      <StickyJoinBar
        serieId={serieId}
        isJoined={isJoined}
        isLoggedIn={!!user}
        leagueName={leagueName}
        totalPoints={totalPoints}
      />
      {/* Back button */}
      <div className="container mx-auto px-4 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 group text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">Retour</span>
        </Link>
      </div>

      <SeriePageHeader
        leagueName={leagueName}
        fullSerieName={fullSerieName}
        videogameName={videogameName}
        gameSquare={gameSquare}
        beginAt={beginAt}
        isJoined={isJoined}
        totalPoints={totalPoints}
        currentUserRank={currentUserRank}
        teams={teams}
        serieId={serieId}
        favoriteTeamId={favoriteTeamId}
        serieStarted={serieStarted}
        activeTeamIds={Array.from(activeTeamIds)}
        leaderboardEntries={leaderboardEntries}
        currentUserId={user?.id}
        userCorrect={userCorrect}
        userExact={userExact}
        favoriteTeam={favoriteTeam}
      />

      {/* Liste des Matchs par Phases */}
      <section className="container mx-auto px-4 mt-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 border-b border-primary/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="h-8 w-1 bg-primary"></div>
            <h3 className="text-2xl font-black uppercase tracking-widest">Calendrier</h3>
          </div>
          <span className="text-xs font-mono text-muted-foreground uppercase">
            {matches.length} MATCHS TROUVÉS
          </span>
        </div>

        {sortedTournamentNames.length > 0 ? (
          <MatchGroups
            sortedTournamentNames={sortedTournamentNames}
            matchesByTournament={matchesByTournament}
            userBets={userBets}
            isJoined={isJoined}
            serieId={serieId}
            winRates={winRates}
            favoriteTeamId={favoriteTeamId}
          />
        ) : (
          <NoMatches />
        )}
      </section>
    </main>
  )
}
