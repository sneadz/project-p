'use client'

import { JoinButton } from '@/components/join-button'
import { Trophy } from 'lucide-react'

interface StickyJoinBarProps {
  serieId: number
  isJoined: boolean
  isLoggedIn: boolean
  leagueName: string
  totalPoints?: number
}

export function StickyJoinBar({ serieId, isJoined, isLoggedIn, leagueName, totalPoints }: StickyJoinBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-primary/20 bg-card/80 backdrop-blur py-3 px-4">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-black uppercase tracking-tighter truncate hidden sm:block">{leagueName}</span>
          {isJoined && totalPoints !== undefined && (
            <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 border border-green-500/20">
              <Trophy className="h-3 w-3 text-green-500 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest text-green-500 whitespace-nowrap">
                {totalPoints} PT{totalPoints > 1 ? 'S' : ''}
              </span>
            </div>
          )}
        </div>
        <JoinButton serieId={serieId} isJoined={isJoined} isLoggedIn={isLoggedIn} />
      </div>
    </div>
  )
}
