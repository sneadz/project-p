'use client'

import { cn } from '@/lib/utils'
import { Gem, Lock, Loader2 } from 'lucide-react'

interface MatchBettingSectionProps {
  isFinished: boolean
  isLive: boolean
  isTBD: boolean
  isCanceled: boolean
  isJoined: boolean
  isLoading: boolean
  possibleScores: string[]
  selectedScore: string | null
  userBet?: string
  shardsGained: number
  onScoreSelect: (score: string) => void
}

const fmt = (score: string) => score.replace('-', ' - ')

export function MatchBettingSection({
  isFinished,
  isLive,
  isTBD,
  isCanceled,
  isJoined,
  isLoading,
  possibleScores,
  selectedScore,
  userBet,
  shardsGained,
  onScoreSelect,
}: MatchBettingSectionProps) {
  if (isLive) {
    return (
      <div className="mt-auto pt-8 flex flex-col gap-2">
        <div className="py-3 text-center rounded-lg bg-green-500/5 border border-green-500/20 flex items-center justify-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-green-500">
            Match en cours
          </span>
        </div>
        {userBet && (
          <div className="py-2 px-3 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 text-[10px] font-bold uppercase tracking-wider text-primary">
            <span>Votre pari</span>
            <span>{userBet}</span>
          </div>
        )}
      </div>
    )
  }

  if (isFinished) {
    return (
      <div className="mt-auto pt-8 flex flex-col gap-2">
        <div className="py-3 text-center rounded-lg bg-primary/5 border border-primary/10">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">
            Match Terminé
          </span>
        </div>
        {userBet && (
          <div
            className={cn(
              'py-2 px-3 flex items-center justify-between rounded-lg border text-[10px] font-bold uppercase tracking-wider',
              shardsGained > 0
                ? 'bg-green-500/10 border-green-500/20 text-green-500'
                : 'bg-red-500/10 border-red-500/20 text-red-500'
            )}
          >
            <span>Votre pari: {fmt(userBet)}</span>
            <span className="flex items-center gap-1">
              <Gem className="h-3 w-3" />
              {shardsGained} SHARD{shardsGained > 1 ? 'S' : ''}
            </span>
          </div>
        )}
      </div>
    )
  }

  if (isTBD) {
    return (
      <div className="mt-auto pt-8">
        <div className="py-4 text-center rounded-lg bg-muted/5 border border-dashed border-muted/20">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {isCanceled ? 'Match Annulé' : 'Équipes à déterminer'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-auto pt-8">
      {isJoined && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
            Choisir le score
          </p>
          {isLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
        </div>
      )}
      {isJoined ? (
        <div className="grid grid-cols-4 gap-2">
          {possibleScores.map((score) => (
            <button
              key={score}
              disabled={isLoading}
              onClick={() => onScoreSelect(score)}
              className={cn(
                'rounded border py-1.5 text-[10px] font-bold transition-all',
                selectedScore === score
                  ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                  : 'border-primary/20 bg-primary/5 text-primary hover:border-primary/50 hover:bg-primary/10',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
            >
              {fmt(score)}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 py-4 rounded-lg bg-muted/5 border border-dashed border-muted-foreground/20">
          <Lock className="h-3 w-3 text-muted-foreground" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            Inscrivez-vous pour parier
          </span>
        </div>
      )}
    </div>
  )
}
