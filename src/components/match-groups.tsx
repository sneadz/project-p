'use client'

import { useState } from 'react'
import { MatchCard } from '@/components/match-card'
import { Button } from '@/components/ui/button'
import { PandaScoreMatch } from '@/types/pandascore'
import { ChevronDown } from 'lucide-react'

interface MatchGroupsProps {
  sortedTournamentNames: string[]
  matchesByTournament: Record<string, PandaScoreMatch[]>
  userBets: Record<number, string>
  isJoined: boolean
  serieId: number
}

export function MatchGroups({ sortedTournamentNames, matchesByTournament, userBets, isJoined, serieId }: MatchGroupsProps) {
  const [showFinished, setShowFinished] = useState(false)

  const isGroupFinished = (phase: string) =>
    matchesByTournament[phase].every(m => m.status === 'finished' || m.status === 'canceled')

  const visibleGroups = sortedTournamentNames.filter(phase => !isGroupFinished(phase))
  const finishedGroups = sortedTournamentNames.filter(phase => isGroupFinished(phase))

  const groupsToShow = showFinished ? sortedTournamentNames : visibleGroups

  return (
    <div className="space-y-12">
      {groupsToShow.map((phase) => (
        <div key={phase} className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-primary/20"></div>
            <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-primary bg-primary/5 px-4 py-1 rounded-full border border-primary/10">
              {phase}
            </h4>
            <div className="h-px flex-1 bg-primary/20"></div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {matchesByTournament[phase].map((match) => (
              <div key={match.id} id={`match-${match.id}`} className="scroll-mt-24">
                <MatchCard
                  match={match}
                  userBet={userBets[match.id]}
                  isJoined={isJoined}
                  serieId={serieId}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {finishedGroups.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFinished(prev => !prev)}
            className="gap-2 text-muted-foreground border-muted-foreground/20 hover:text-foreground"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showFinished ? 'rotate-180' : ''}`} />
            {showFinished
              ? 'Masquer les phases terminées'
              : `Afficher les phases terminées (${finishedGroups.length})`
            }
          </Button>
        </div>
      )}
    </div>
  )
}
