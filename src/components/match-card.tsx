'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PandaScoreMatch } from '@/types/pandascore'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { placeBet } from '@/app/actions/competition'
import { calculateMatchShards, generateScores } from '@/lib/scoring'
import { useToast } from '@/hooks/use-toast'
import { MatchWinRateBar } from '@/components/match-win-rate-bar'
import { MatchBettingSection } from '@/components/match-betting-section'

interface MatchCardProps {
  match: PandaScoreMatch
  userBet?: string
  isJoined?: boolean
  serieId?: number
  winRates?: Record<number, number | null>
  favoriteTeamId?: number | null
}

const fmt = (score: string) => score.replace('-', ' - ')

function formatMatchDate(dateStr: string): string {
  const d = new Date(dateStr)
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${d.getDate()} ${months[d.getMonth()]} ${h}:${m}`
}

export function MatchCard({ match, userBet, isJoined, serieId, winRates, favoriteTeamId }: MatchCardProps) {
  const [selectedScore, setSelectedScore] = useState<string | null>(userBet || null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (userBet) setSelectedScore(userBet)
  }, [userBet])

  const team1 = match.opponents[0]?.opponent
  const team2 = match.opponents[1]?.opponent
  const isFinished = match.status === 'finished'
  const isLive = match.status === 'running'
  const isCanceled = match.status === 'canceled'
  const isTBD = !team1 || !team2 || match.opponents.length < 2 || isCanceled
  const hasFavorite = favoriteTeamId && (team1?.id === favoriteTeamId || team2?.id === favoriteTeamId)

  const realScore = (() => {
    if ((!isFinished && !isLive) || !match.results || match.results.length < 2) return null
    const s1 = match.results.find((r) => r.team_id === team1?.id)?.score ?? 0
    const s2 = match.results.find((r) => r.team_id === team2?.id)?.score ?? 0
    return `${s1}-${s2}`
  })()

  const shardsGained =
    isFinished && userBet && realScore && team1 && team2
      ? calculateMatchShards(userBet, realScore, team1.id, team2.id).shards
      : 0

  const handleScoreSelect = async (score: string) => {
    if (!isJoined || !serieId) return
    setLoading(true)
    try {
      const result = await placeBet(match.id, serieId, score)
      if (result.error === 'MATCH_STARTED') {
        toast({ title: 'Match déjà commencé', description: 'Ce match est en cours, les paris ne sont plus acceptés.', variant: 'destructive' })
        router.refresh()
      } else if (result.error) {
        toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
      } else {
        setSelectedScore(score)
        toast({ title: 'Pari enregistré', description: `Votre pronostic ${score} a été enregistré.` })
      }
    } catch {
      toast({ title: 'Erreur', description: 'Une erreur est survenue.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const matchDateStr = match.begin_at || match.scheduled_at
  const matchDate = matchDateStr ? formatMatchDate(matchDateStr) : 'À déterminer'
  const possibleScores = generateScores(match.number_of_games)

  return (
    <Card className={cn(
      'group flex flex-col h-full overflow-hidden bg-card/50 transition-all hover:bg-card/80',
      isLive && 'border-green-500/50 shadow-[0_0_16px_0px] shadow-green-500/20 hover:border-green-500/80',
      isCanceled && 'opacity-60 grayscale border-red-500/20',
      hasFavorite && !isLive && !isCanceled && 'border-yellow-500/40 shadow-[0_0_20px_0px] shadow-yellow-500/10 hover:border-yellow-500/60 hover:shadow-yellow-500/20',
      !isLive && !isCanceled && !hasFavorite && 'border-primary/20 hover:border-primary/50'
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[10px] uppercase tracking-tighter text-muted-foreground border-muted-foreground/20">
            {match.videogame.name} • BO{match.number_of_games}
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
        {/* Teams */}
        <div className="flex items-center justify-between gap-4 relative">
          <div className="flex flex-1 flex-col items-center gap-3">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800 border border-primary/10 p-2 transition-transform group-hover:scale-105">
              {team1?.image_url ? (
                <Image src={team1.image_url} alt={team1.name} width={48} height={48} className="object-contain" />
              ) : (
                <div className="text-[10px] font-bold text-muted-foreground">T1</div>
              )}
            </div>
            <span className="text-center text-[10px] font-black uppercase tracking-tighter line-clamp-1 w-full">
              {team1?.name || 'À DÉTERMINER'}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center min-w-[60px]">
            {isLive && realScore ? (
              <div className="text-2xl font-black tracking-tighter text-green-500 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {fmt(realScore)}
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

          <div className="flex flex-1 flex-col items-center gap-3">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800 border border-primary/10 p-2 transition-transform group-hover:scale-105">
              {team2?.image_url ? (
                <Image src={team2.image_url} alt={team2.name} width={48} height={48} className="object-contain" />
              ) : (
                <div className="text-[10px] font-bold text-muted-foreground">T2</div>
              )}
            </div>
            <span className="text-center text-[10px] font-black uppercase tracking-tighter line-clamp-1 w-full">
              {team2?.name || 'À DÉTERMINER'}
            </span>
          </div>
        </div>

        {/* Win rate bar */}
        {team1 && team2 && winRates && !isTBD && !isLive && (
          <MatchWinRateBar team1Id={team1.id} team2Id={team2.id} winRates={winRates} />
        )}

        {/* Betting section */}
        <MatchBettingSection
          isFinished={isFinished}
          isLive={isLive}
          isTBD={isTBD}
          isCanceled={isCanceled}
          isJoined={!!isJoined}
          isLoading={loading}
          possibleScores={possibleScores}
          selectedScore={selectedScore}
          userBet={userBet}
          shardsGained={shardsGained}
          onScoreSelect={handleScoreSelect}
        />
      </CardContent>
    </Card>
  )
}
