'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Users, Star, Gem, Lock } from 'lucide-react'
import { TeamImage } from '@/components/team-image'
import { setFavoriteTeam } from '@/app/actions/competition'
import { toast } from '@/hooks/use-toast'

export interface TeamSummary {
  id: number
  name: string
  image_url: string | null
  wins: number
  losses: number
  phase: string
}

interface TeamsModalProps {
  teams: TeamSummary[]
  serieId: number
  isLoggedIn: boolean
  currentFavoriteTeamId?: number | null
  serieStarted: boolean
  activeTeamIds: number[]
}

export function TeamsModal({
  teams,
  serieId,
  isLoggedIn,
  currentFavoriteTeamId,
  serieStarted,
  activeTeamIds,
}: TeamsModalProps) {
  const [open, setOpen] = useState(false)
  const [favoriteId, setFavoriteId] = useState<number | null>(currentFavoriteTeamId ?? null)
  const [isPending, startTransition] = useTransition()

  const activeSet = new Set(activeTeamIds)

  // Dédoublonner par id, trier : favori en premier, puis actifs par wins, puis éliminés
  const uniqueTeams = Array.from(new Map(teams.map((t) => [t.id, t])).values()).sort((a, b) => {
    const aIsFav = favoriteId === a.id
    const bIsFav = favoriteId === b.id
    const aActive = activeSet.has(a.id) || activeTeamIds.length === 0
    const bActive = activeSet.has(b.id) || activeTeamIds.length === 0

    if (aIsFav && !bIsFav) return -1
    if (!aIsFav && bIsFav) return 1
    if (aActive && !bActive) return -1
    if (!aActive && bActive) return 1
    return b.wins - b.losses - (a.wins - a.losses)
  })

  const handlePick = (team: TeamSummary) => {
    if (!isLoggedIn) {
      toast({ title: 'Connectez-vous pour choisir un favori', variant: 'destructive' })
      return
    }
    startTransition(async () => {
      const result = await setFavoriteTeam(serieId, team.id, team.name, team.image_url)
      if (result.error) {
        toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
      } else {
        setFavoriteId(team.id)
        toast({
          title: `⭐ ${team.name} est ton favori !`,
          description: '+10 Shards si ils gagnent le tournoi.',
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-bold uppercase tracking-widest text-sm px-5 py-2.5 shadow-[0_0_16px_2px] shadow-primary/20 hover:shadow-primary/40 transition-shadow">
          {serieStarted ? <Users className="h-4 w-4" /> : <Star className="h-4 w-4" />}
          {serieStarted ? `Voir les équipes (${uniqueTeams.length})` : 'Choisis ton favori'}
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg p-0 overflow-hidden">
        <div className="overflow-y-auto max-h-[75vh] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4 sm:p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-black uppercase tracking-widest">
              Équipes participantes
            </DialogTitle>
          </DialogHeader>

          {/* Bannière info */}
          {serieStarted ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/20 border border-border/40 mb-4">
              <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                Le tournoi a démarré. La sélection de favori n&apos;est plus disponible.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 mb-4">
              <Gem className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                Choisis ton favori avant le début du tournoi. S&apos;ils gagnent, tu remportes{' '}
                <span className="font-bold text-primary">+10 Shards</span>.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {uniqueTeams.map((team) => {
              const isFavorite = favoriteId === team.id
              const isActive = activeTeamIds.length === 0 || activeSet.has(team.id)
              const isEliminated = serieStarted && !isActive
              const total = team.wins + team.losses
              const canPick = !serieStarted && isLoggedIn

              return (
                <button
                  key={team.id}
                  onClick={() => canPick && handlePick(team)}
                  disabled={isPending || !canPick}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                    ${
                      isFavorite && !isEliminated
                        ? 'bg-primary/10 border-primary/60 shadow-[0_0_16px_2px] shadow-primary/25'
                        : isFavorite && isEliminated
                          ? 'bg-primary/5 border-primary/30 shadow-[0_0_12px_1px] shadow-primary/15'
                          : isEliminated
                            ? 'bg-muted/5 border-border/20 opacity-40'
                            : canPick
                              ? 'bg-card/50 border-border/40 hover:border-primary/30 hover:bg-card/80 cursor-pointer'
                              : 'bg-card/50 border-border/40 cursor-default'
                    }`}
                >
                  {/* Logo */}
                  <div
                    className={`h-10 w-10 rounded-lg overflow-hidden border flex items-center justify-center shrink-0 bg-zinc-200 dark:bg-zinc-800 ${isEliminated ? 'border-border/20 opacity-60' : 'border-border/40'}`}
                  >
                    <TeamImage
                      src={team.image_url}
                      name={team.name}
                      size={32}
                      className={`p-1 ${isEliminated ? 'grayscale' : ''}`}
                    />
                  </div>

                  {/* Nom */}
                  <span
                    className={`font-bold text-sm flex-1 truncate ${isFavorite ? 'text-primary' : isEliminated ? 'text-muted-foreground' : ''}`}
                  >
                    {team.name}
                  </span>

                  {/* Badge éliminé */}
                  {isEliminated && !isFavorite && (
                    <span className="text-[10px] text-muted-foreground font-mono uppercase shrink-0">
                      Éliminé
                    </span>
                  )}

                  {/* Stats */}
                  {total > 0 && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-xs font-bold ${isEliminated ? 'text-muted-foreground' : 'text-green-500'}`}
                      >
                        {team.wins}W
                      </span>
                      <span className="text-xs text-muted-foreground">-</span>
                      <span
                        className={`text-xs font-bold ${isEliminated ? 'text-muted-foreground' : 'text-red-400'}`}
                      >
                        {team.losses}L
                      </span>
                    </div>
                  )}

                  {/* Étoile favori */}
                  {isFavorite && (
                    <Star
                      className={`h-4 w-4 shrink-0 fill-yellow-500 ${isEliminated ? 'text-yellow-500/50' : 'text-yellow-500'}`}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
