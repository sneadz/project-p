'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PandaScoreMatch } from '@/types/pandascore'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface MatchCardProps {
  match: PandaScoreMatch
}

export function MatchCard({ match }: MatchCardProps) {
  const [selectedScore, setSelectedScore] = useState<string | null>(null)
  const team1 = match.opponents[0]?.opponent
  const team2 = match.opponents[1]?.opponent
  const game = match.videogame.name
  const bo = match.number_of_games
  const isFinished = match.status === 'finished'
  const isTBD = !team1 || !team2 || match.opponents.length < 2

  // Score réel si le match est terminé
  const realScore = isFinished && match.results ? (() => {
    const s1 = match.results.find(r => r.team_id === team1?.id)?.score ?? 0
    const s2 = match.results.find(r => r.team_id === team2?.id)?.score ?? 0
    return `${s1}-${s2}`
  })() : null

  const matchDate = new Date(match.begin_at).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })

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
    <Card className="group overflow-hidden border-primary/20 bg-card/50 transition-all hover:border-primary/50 hover:bg-card/80">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[10px] uppercase tracking-tighter text-muted-foreground border-muted-foreground/20">
            {game} • BO{bo}
          </Badge>
          <span className="text-[10px] font-mono text-muted-foreground">
            {matchDate}
          </span>
        </div>
        <CardTitle className="mt-2 text-xs font-bold uppercase tracking-widest text-primary line-clamp-1">
          {match.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
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

          {/* VS Divider */}
          <div className="flex flex-col items-center">
            <div className="text-xl font-black italic text-primary/60 group-hover:text-primary transition-colors">VS</div>
            {(selectedScore || realScore) && (
              <div className="absolute -bottom-1 text-xs font-bold text-primary animate-in fade-in zoom-in duration-300 whitespace-nowrap">
                {realScore || selectedScore}
              </div>
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
        
        {!isFinished && !isTBD && (
          <div className="mt-8">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-3 text-center font-bold">Choisir le score</p>
            <div className="grid grid-cols-4 gap-2">
              {possibleScores.map((score) => (
                <button
                  key={score}
                  onClick={() => setSelectedScore(score)}
                  className={cn(
                    "rounded border py-1.5 text-[10px] font-bold transition-all",
                    selectedScore === score
                      ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                      : "border-primary/20 bg-primary/5 text-primary hover:border-primary/50 hover:bg-primary/10"
                  )}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>
        )}

        {!isFinished && isTBD && (
          <div className="mt-8 py-4 text-center rounded-lg bg-muted/5 border border-dashed border-muted/20">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Équipes à déterminer</span>
          </div>
        )}
        
        {isFinished && (
          <div className="mt-8 py-4 text-center rounded-lg bg-primary/5 border border-primary/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Match Terminé</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
