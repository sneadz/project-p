import { getMatchesBySerie, getSerieById } from '@/lib/pandascore'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Trophy, Calendar, Gamepad2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ScrollToUpcoming } from '@/components/scroll-to-upcoming'
import { MatchGroups } from '@/components/match-groups'
import { StickyJoinBar } from '@/components/sticky-join-bar'
import { PandaScoreMatch } from '@/types/pandascore'

interface SeriePageProps {
  params: {
    id: string
  }
}

export default async function SeriePage({ params }: SeriePageProps) {
  const serieId = parseInt(params.id)
  
  if (isNaN(serieId)) {
    notFound()
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Vérifier si l'utilisateur est inscrit à cette compétition
  let isJoined = false
  let userBets: Record<number, string> = {}
  let totalPoints = 0
  
  if (user) {
    const { data: registration } = await supabase
      .from('registrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('serie_id', serieId)
      .single()
    
    isJoined = !!registration

    if (isJoined) {
      const { data: bets } = await supabase
        .from('bets')
        .select('match_id, score')
        .eq('user_id', user.id)
        .eq('serie_id', serieId)
      
      if (bets) {
        userBets = bets.reduce((acc, bet) => {
          acc[bet.match_id] = bet.score
          return acc
        }, {} as Record<number, string>)
      }
    }
  }

  // On récupère les infos de la série via l'API directe ou le cache
  const serie = await getSerieById(serieId)
  
  // Si on n'a pas pu récupérer la série, on tente quand même les matchs
  // mais si les deux échouent, là on affiche un 404
  const matches = await getMatchesBySerie(serieId).catch(() => [])

  // Calcul des points totaux pour l'UI
  if (isJoined && matches.length > 0) {
    matches.forEach(match => {
      const bet = userBets[match.id]
      if (bet && match.status === 'finished' && match.results && match.results.length >= 2) {
        const team1 = match.opponents[0]?.opponent
        const team2 = match.opponents[1]?.opponent
        const s1 = match.results.find(r => r.team_id === team1?.id)?.score ?? 0
        const s2 = match.results.find(r => r.team_id === team2?.id)?.score ?? 0
        const realScore = `${s1}-${s2}`

        if (bet === realScore) {
          totalPoints += 2
        } else {
          const [bet1, bet2] = bet.split('-').map(Number)
          const betWinner = bet1 > bet2 ? team1?.id : team2?.id
          const realWinner = s1 > s2 ? team1?.id : team2?.id
          if (betWinner === realWinner) {
            totalPoints += 1
          }
        }
      }
    })
  }

  if (!serie && matches.length === 0) {
    notFound()
  }

  // Fallback si la série est null mais qu'on a des matchs
  const leagueName = serie?.league?.name || (matches.length > 0 ? matches[0].league.name : 'Tournoi')
  const leagueImage = serie?.image_url || serie?.league?.image_url || serie?.videogame?.image_url || (matches.length > 0 ? matches[0].league.image_url || matches[0].videogame.image_url : null)
  const fullSerieName = serie?.full_name || (matches.length > 0 ? matches[0].serie.full_name : 'Détails de la compétition')
  const videogameName = serie?.videogame?.name || (matches.length > 0 ? matches[0].videogame.name : '')
  const beginAt = serie?.begin_at || (matches.length > 0 ? (matches[0].begin_at || matches[0].scheduled_at) : null)

  function NoMatches() {
    return (
      <div className="py-20 text-center rounded-2xl border border-dashed border-primary/20 bg-card/10">
        <Trophy className="h-12 w-12 text-muted/20 mx-auto mb-4" />
        <p className="text-muted-foreground font-medium">Aucun match n&apos;est encore programmé pour cette série.</p>
        <Link href="/">
          <Button variant="outline" className="mt-6">Explorer d&apos;autres tournois</Button>
        </Link>
      </div>
    )
  }

  // Grouper les matchs par tournoi (phase)
  const matchesByTournament = matches.reduce((acc, match) => {
    const tournamentName = match.tournament?.name || 'Autres'
    if (!acc[tournamentName]) {
      acc[tournamentName] = []
    }
    acc[tournamentName].push(match)
    return acc
  }, {} as Record<string, PandaScoreMatch[]>)

  // Trier les tournois par date du premier match
  const sortedTournamentNames = Object.keys(matchesByTournament).sort((a, b) => {
    const dateA = new Date(matchesByTournament[a][0].begin_at || matchesByTournament[a][0].scheduled_at).getTime()
    const dateB = new Date(matchesByTournament[b][0].begin_at || matchesByTournament[b][0].scheduled_at).getTime()
    return dateA - dateB
  })

  // Trouver le premier match non terminé et non annulé pour le scroll automatique
  const firstUpcomingMatch = matches.find(m => m.status !== 'finished' && m.status !== 'canceled')

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
        <Link href="/" className="inline-flex items-center gap-2 group text-muted-foreground hover:text-primary transition-colors">
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">Retour</span>
        </Link>
      </div>

      {/* Header de la Compétition */}
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-primary/10 -skew-y-3 transform origin-top-left -z-10"></div>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative h-40 w-40 flex-shrink-0 rounded-2xl bg-card/50 border border-primary/20 p-6 backdrop-blur shadow-2xl flex items-center justify-center overflow-hidden">
              {leagueImage ? (
                <div className="relative h-full w-full">
                  <Image 
                    src={leagueImage} 
                    alt={leagueName} 
                    fill 
                    className="object-contain"
                    sizes="160px"
                    priority
                  />
                </div>
              ) : (
                <div className="flex flex-col h-full w-full items-center justify-center gap-2">
                  <Trophy className="h-16 w-16 text-primary/20" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{videogameName}</span>
                </div>
              )}
            </div>
            
            <div className="text-center md:text-left space-y-4">
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                {videogameName && (
                   <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 border border-primary/20">
                     <Gamepad2 className="h-3 w-3 text-primary" />
                     <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{videogameName}</span>
                   </div>
                )}
                <div className="flex items-center gap-2 rounded-full bg-muted/10 px-3 py-1 border border-muted/20">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {beginAt ? new Date(beginAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'Compétition'}
                  </span>
                </div>
                {isJoined && (
                  <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                    <Trophy className="h-3 w-3 text-green-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-500">
                      {totalPoints} POINT{totalPoints > 1 ? 'S' : ''}
                    </span>
                  </div>
                )}
              </div>
              
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-tight">
                {leagueName}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl italic">
                {fullSerieName}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Liste des Matchs par Phases */}
      <section className="container mx-auto px-4 mt-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 border-b border-primary/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="h-8 w-1 bg-primary"></div>
            <h3 className="text-2xl font-black uppercase tracking-widest">Calendrier</h3>
          </div>
          <span className="text-xs font-mono text-muted-foreground uppercase">{matches.length} MATCHS TROUVÉS</span>
        </div>

        {sortedTournamentNames.length > 0 ? (
          <MatchGroups
            sortedTournamentNames={sortedTournamentNames}
            matchesByTournament={matchesByTournament}
            userBets={userBets}
            isJoined={isJoined}
            serieId={serieId}
          />
        ) : (
          <NoMatches />
        )}
      </section>
    </main>
  )
}
