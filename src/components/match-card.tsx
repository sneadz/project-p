'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PandaScoreMatch } from '@/types/pandascore'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { placeBet } from '@/app/actions/competition'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Lock, Gem } from 'lucide-react'

interface MatchCardProps {
  match: PandaScoreMatch
  userBet?: string
  isJoined?: boolean
  serieId?: number
  winRates?: Record<number, number | null>
  favoriteTeamId?: number | null
}

export function MatchCard({ match, userBet, isJoined, serieId, winRates, favoriteTeamId }: MatchCardProps) {
  const [selectedScore, setSelectedScore] = useState<string | null>(userBet || null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  
  // Mettre à jour si le userBet change (par exemple après une inscription)
  useEffect(() => {
    if (userBet) setSelectedScore(userBet)
  }, [userBet])

  const team1 = match.opponents[0]?.opponent
  const team2 = match.opponents[1]?.opponent
  const game = match.videogame.name
  const bo = match.number_of_games
  const isFinished  = match.status === 'finished'
  const isLive      = match.status === 'running'
  const isCanceled  = match.status === 'canceled'
  const isPostponed = match.status === 'postponed'
  const isTBD = !team1 || !team2 || match.opponents.length < 2 || isCanceled
  const hasFavorite = favoriteTeamId && (team1?.id === favoriteTeamId || team2?.id === favoriteTeamId)

  // Formatte un score "2-1" → "2 - 1" pour l'affichage
  const fmt = (score: string) => score.replace('-', ' - ')

  // Score réel (terminé ou en cours)
  const getScore = () => {
    if (!match.results || match.results.length < 2) return null
    const s1 = match.results.find(r => r.team_id === team1?.id)?.score ?? 0
    const s2 = match.results.find(r => r.team_id === team2?.id)?.score ?? 0
    return `${s1}-${s2}`
  }
  const realScore = (isFinished || isLive) ? getScore() : null

  // Calcul des shards si terminé et parié
  let shardsGained = 0
  if (isFinished && userBet && realScore) {
    if (userBet === realScore) {
      shardsGained = 2
    } else {
      const [bet1, bet2] = userBet.split('-').map(Number)
      const [real1, real2] = realScore.split('-').map(Number)
      const betWinner = bet1 > bet2 ? team1?.id : team2?.id
      const realWinner = real1 > real2 ? team1?.id : team2?.id
      if (betWinner === realWinner) {
        shardsGained = 1
      }
    }
  }

  const handleScoreSelect = async (score: string) => {
    if (!isJoined || !serieId) return
    
    setLoading(true)
    try {
      const result = await placeBet(match.id, serieId, score)
      if (result.error === 'MATCH_STARTED') {
        toast({
          title: "Match déjà commencé",
          description: "Ce match est en cours, les paris ne sont plus acceptés.",
          variant: "destructive"
        })
        router.refresh()
      } else if (result.error) {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive"
        })
      } else {
        setSelectedScore(score)
        toast({
          title: "Pari enregistré",
          description: `Votre pronostic ${score} a été enregistré.`
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const matchDateStr = match.begin_at || match.scheduled_at
  const matchDate = matchDateStr ? (() => {
    const d = new Date(matchDateStr)
    const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']
    const h = d.getHours().toString().padStart(2, '0')
    const m = d.getMinutes().toString().padStart(2, '0')
    return `${d.getDate()} ${months[d.getMonth()]} ${h}:${m}`
  })() : 'À déterminer'

  // Générer les scores possibles en fonction du BO
  const generateScores = (numGames: number) => {
    const scores: string[] = []
    const winThreshold = Math.ceil(numGames / 2)

    if (numGames === 1) {
      return ['1-0', '0-1']
    }

    // Pour un BO3 (winThreshold = 2), on peut avoir 2-0, 2-1, 1-2, 0-2
    // Pour un BO5 (winThreshold = 3), on peut avoir 3-0, 3-1, 3-2, 2-3, 1-3, 0-3
    
    // Scores où team1 gagne
    for (let team2Score = 0; team2Score < winThreshold; team2Score++) {
      scores.push(`${winThreshold}-${team2Score}`)
    }
    // Scores où team2 gagne
    for (let team1Score = winThreshold - 1; team1Score >= 0; team1Score--) {
      scores.push(`${team1Score}-${winThreshold}`)
    }

    return scores
  }

  const possibleScores = generateScores(bo)

  return (
    <Card className={cn(
      "group flex flex-col h-full overflow-hidden bg-card/50 transition-all hover:bg-card/80",
      isLive      && "border-green-500/50 shadow-[0_0_16px_0px] shadow-green-500/20 hover:border-green-500/80",
      isCanceled  && "opacity-60 grayscale border-red-500/20",
      hasFavorite && !isLive && !isCanceled && "border-yellow-500/40 shadow-[0_0_20px_0px] shadow-yellow-500/10 hover:border-yellow-500/60 hover:shadow-yellow-500/20",
      !isLive && !isCanceled && !hasFavorite && "border-primary/20 hover:border-primary/50"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[10px] uppercase tracking-tighter text-muted-foreground border-muted-foreground/20">
            {game} • BO{bo}
          </Badge>
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-green-500 uppercase tracking-widest">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                </span>
                Live
              </span>
            )}
            <span className="text-[10px] font-mono text-muted-foreground">
              {isCanceled ? 'Annulé' : matchDate}
            </span>
          </div>
        </div>
        <CardTitle className="mt-2 text-xs font-bold uppercase tracking-widest text-primary line-clamp-1">
          {match.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-4 relative">
          {/* Team 1 */}
          <div className="flex flex-1 flex-col items-center gap-3">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-muted/10 border border-primary/5 p-2 transition-transform group-hover:scale-105">
              {team1?.image_url ? (
                <Image 
                  src={team1.image_url} 
                  alt={team1.name} 
                  width={48} 
                  height={48} 
                  className="object-contain" 
                />
              ) : (
                <div className="text-[10px] font-bold text-muted-foreground">T1</div>
              )}
            </div>
            <span className="text-center text-[10px] font-black uppercase tracking-tighter line-clamp-1 w-full">{team1?.name || 'À DÉTERMINER'}</span>
          </div>

          {/* Match Score / VS Divider */}
          <div className="flex flex-col items-center justify-center min-w-[60px]">
            {isLive && realScore ? (
              <div className="flex flex-col items-center gap-1">
                <div className="text-2xl font-black tracking-tighter text-green-500 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {fmt(realScore)}
                </div>
              </div>
            ) : isFinished && realScore ? (
              <div className="flex flex-col items-center">
                <div className="text-2xl font-black tracking-tighter text-primary animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {fmt(realScore)}
                </div>
                {selectedScore && (
                  <div className="absolute -bottom-1 text-[8px] font-bold text-muted-foreground uppercase tracking-widest animate-in fade-in zoom-in duration-300 whitespace-nowrap">
                    Pari: {fmt(selectedScore)}
                  </div>
                )}
              </div>
            ) : isCanceled ? (
              <div className="text-lg font-black italic text-red-500/60 uppercase tracking-tighter">Annulé</div>
            ) : (
              <div className="text-xl font-black italic text-primary/60 group-hover:text-primary transition-colors uppercase">VS</div>
            )}
          </div>

          {/* Team 2 */}
          <div className="flex flex-1 flex-col items-center gap-3">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-muted/10 border border-primary/5 p-2 transition-transform group-hover:scale-105">
              {team2?.image_url ? (
                <Image 
                  src={team2.image_url} 
                  alt={team2.name} 
                  width={48} 
                  height={48} 
                  className="object-contain" 
                />
              ) : (
                <div className="text-[10px] font-bold text-muted-foreground">T2</div>
              )}
            </div>
            <span className="text-center text-[10px] font-black uppercase tracking-tighter line-clamp-1 w-full">{team2?.name || 'À DÉTERMINER'}</span>
          </div>
        </div>
        
        {/* Barre de win rate */}
        {team1 && team2 && winRates && !isTBD && !isLive && (() => {
          const r1 = winRates[team1.id]
          const r2 = winRates[team2.id]
          if (r1 == null && r2 == null) return null
          const v1 = r1 ?? 50
          const v2 = r2 ?? 50
          const total = v1 + v2
          const pct1 = total > 0 ? Math.round((v1 / total) * 100) : 50
          const pct2 = 100 - pct1
          return (
            <div className="mt-5 space-y-1.5">
              <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                <span className="text-primary">{pct1}%</span>
                <span className="text-muted-foreground/60">Chance de victoire</span>
                <span className="text-muted-foreground">{pct2}%</span>
              </div>
              <div className="h-1 w-full rounded-full overflow-hidden bg-muted/20 flex">
                <div
                  className="h-full bg-primary rounded-l-full transition-all duration-700"
                  style={{ width: `${pct1}%` }}
                />
                <div
                  className="h-full bg-muted-foreground/25 rounded-r-full transition-all duration-700"
                  style={{ width: `${pct2}%` }}
                />
              </div>
            </div>
          )
        })()}

        {isLive && (
          <div className="mt-auto pt-8 flex flex-col gap-2">
            <div className="py-3 text-center rounded-lg bg-green-500/5 border border-green-500/20 flex items-center justify-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Match en cours</span>
            </div>
            {userBet && (
              <div className="py-2 px-3 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 text-[10px] font-bold uppercase tracking-wider text-primary">
                <span>Votre pari</span>
                <span>{userBet}</span>
              </div>
            )}
          </div>
        )}

        {!isFinished && !isLive && !isTBD && (
          <div className="mt-auto pt-8">
            {isJoined && (
              <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Choisir le score</p>
                {loading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
              </div>
            )}
            {isJoined ? (
              <div className="grid grid-cols-4 gap-2">
                {possibleScores.map((score) => (
                  <button
                    key={score}
                    disabled={loading}
                    onClick={() => handleScoreSelect(score)}
                    className={cn(
                      "rounded border py-1.5 text-[10px] font-bold transition-all",
                      selectedScore === score
                        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                        : "border-primary/20 bg-primary/5 text-primary hover:border-primary/50 hover:bg-primary/10",
                      loading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {fmt(score)}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 py-4 rounded-lg bg-muted/5 border border-dashed border-muted-foreground/20">
                <Lock className="h-3 w-3 text-muted-foreground" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Inscrivez-vous pour parier</span>
              </div>
            )}
          </div>
        )}

        {!isFinished && isTBD && (
          <div className="mt-auto pt-8"><div className="py-4 text-center rounded-lg bg-muted/5 border border-dashed border-muted/20">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {isCanceled ? 'Match Annulé' : 'Équipes à déterminer'}
            </span>
          </div></div>
        )}
        
        {isFinished && (
          <div className="mt-auto pt-8 flex flex-col gap-2">
             <div className="py-3 text-center rounded-lg bg-primary/5 border border-primary/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Match Terminé</span>
             </div>
             {userBet && (
               <div className={cn(
                 "py-2 px-3 flex items-center justify-between rounded-lg border text-[10px] font-bold uppercase tracking-wider",
                 shardsGained > 0 ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500"
               )}>
                 <span>Votre pari: {fmt(userBet)}</span>
                 <span className="flex items-center gap-1"><Gem className="h-3 w-3" />{shardsGained} SHARD{shardsGained > 1 ? 'S' : ''}</span>
               </div>
             )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
