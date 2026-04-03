'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trophy, Target, Crosshair, User, RefreshCw } from 'lucide-react'
import { getAvatarSrc } from '@/lib/avatars'
import { refreshSerieStats } from '@/app/actions/favorites'

interface LeaderboardEntry {
  user_id: string
  correct_predictions: number
  exact_predictions: number
  username: string | null
  avatar_url: string | null
}

interface SerieLeaderboardModalProps {
  serieId: number
  entries: LeaderboardEntry[]
  currentUserId?: string
  currentUserRank?: number | null
  currentUserCorrect?: number
  currentUserExact?: number
}

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function SerieLeaderboardModal({
  serieId,
  entries,
  currentUserId,
  currentUserRank,
  currentUserCorrect = 0,
  currentUserExact = 0,
}: SerieLeaderboardModalProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [liveEntries, setLiveEntries] = useState(entries)
  const [liveCorrect, setLiveCorrect] = useState(currentUserCorrect)
  const [liveExact, setLiveExact] = useState(currentUserExact)
  const [liveRank, setLiveRank] = useState(currentUserRank)
  const router = useRouter()

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await refreshSerieStats(serieId)
      if (result.success) {
        setLiveCorrect(result.correct)
        setLiveExact(result.exact)
        setLiveRank(result.rank)
        // Mettre à jour l'entrée du user dans la liste locale
        setLiveEntries((prev) =>
          prev
            .map((e) =>
              e.user_id === currentUserId
                ? { ...e, correct_predictions: result.correct, exact_predictions: result.exact }
                : e
            )
            .sort((a, b) => b.correct_predictions - a.correct_predictions || b.exact_predictions - a.exact_predictions)
        )
      }
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-bold uppercase tracking-widest text-sm px-5 py-2.5 shadow-[0_0_16px_2px] shadow-primary/20 hover:shadow-primary/40 transition-shadow">
          <Trophy className="h-4 w-4" />
          Classement
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="overflow-y-auto max-h-[85vh] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden p-6">
          <DialogHeader className="mb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-black uppercase tracking-widest">
                Classement
              </DialogTitle>
              {currentUserId && (
                <button
                  onClick={handleRefresh}
                  disabled={isPending}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                >
                  <RefreshCw className={`h-3 w-3 ${isPending ? 'animate-spin' : ''}`} />
                  Actualiser
                </button>
              )}
            </div>
          </DialogHeader>

          {/* Position du joueur connecté */}
          {currentUserId && liveRank && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-primary/10 border border-primary/30 mb-5">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ta position</span>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-black text-primary">#{liveRank}</span>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-green-500 font-black">
                    <Target className="h-3.5 w-3.5" />
                    {liveCorrect}
                  </span>
                  <span className="flex items-center gap-1 text-primary font-black">
                    <Crosshair className="h-3.5 w-3.5" />
                    {liveExact}
                  </span>
                </div>
              </div>
            </div>
          )}

          {liveEntries.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Aucun pari réussi pour le moment.
            </p>
          ) : (
            <div className="space-y-2">
              {liveEntries.map((entry, index) => {
                const rank = index + 1
                const medal = MEDALS[rank]
                const avatarSrc = getAvatarSrc(entry.avatar_url)
                const isMe = entry.user_id === currentUserId

                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                      isMe ? 'bg-primary/5 border-primary/30' : 'bg-card/50 border-border/40'
                    }`}
                  >
                    <div className="w-7 text-center shrink-0">
                      {medal ? (
                        <span className="text-lg">{medal}</span>
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
                      )}
                    </div>
                    <div className="h-8 w-8 rounded-lg overflow-hidden border border-border/40 bg-card flex items-center justify-center shrink-0">
                      {avatarSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <span className={`flex-1 text-sm font-bold truncate ${isMe ? 'text-primary' : ''}`}>
                      {entry.username ?? 'Joueur'}
                      {isMe && <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">(vous)</span>}
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1 text-green-500">
                        <Target className="h-3.5 w-3.5" />
                        <span className="text-sm font-black tabular-nums">{entry.correct_predictions}</span>
                      </div>
                      <div className="flex items-center gap-1 text-primary">
                        <Crosshair className="h-3.5 w-3.5" />
                        <span className="text-sm font-black tabular-nums">{entry.exact_predictions}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
