'use client'

import { JoinButton } from '@/components/join-button'
import { Gem } from 'lucide-react'

interface StickyJoinBarProps {
  serieId: number
  isJoined: boolean
  isLoggedIn: boolean
  leagueName: string
  totalPoints?: number
}

export function StickyJoinBar({ serieId, isJoined, isLoggedIn, leagueName, totalPoints }: StickyJoinBarProps) {
  return (
    <div className="fixed bottom-16 md:bottom-3 left-0 md:left-[calc(256px+24px)] right-0 md:right-3 z-50 md:rounded-b-2xl border-t border-primary/20 bg-card/90 backdrop-blur py-3 px-4">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-black uppercase tracking-tighter truncate hidden sm:block">{leagueName}</span>
          {isJoined && totalPoints !== undefined && (
            <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 border border-green-500/20">
              <Gem className="h-3 w-3 text-green-500 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest text-green-500 whitespace-nowrap">
                {totalPoints} SHARD{totalPoints > 1 ? 'S' : ''}
              </span>
            </div>
          )}
        </div>
        <JoinButton serieId={serieId} isJoined={isJoined} isLoggedIn={isLoggedIn} />
      </div>
    </div>
  )
}
