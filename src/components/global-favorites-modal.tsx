'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Star, Search, X, Plus, Loader2 } from 'lucide-react'
import { addGlobalFavorite, removeGlobalFavorite, searchTeamsAction } from '@/app/actions/favorites'
import { toast } from '@/hooks/use-toast'
import { PandaScoreTeam } from '@/types/pandascore'

export interface GlobalFavoriteTeam {
  team_id: number
  team_name: string
  team_image_url: string | null
}

interface GlobalFavoritesModalProps {
  initialFavorites: GlobalFavoriteTeam[]
  isLoggedIn: boolean
}

const MAX_FAVORITES = 5

export function GlobalFavoritesModal({ initialFavorites, isLoggedIn }: GlobalFavoritesModalProps) {
  const [open, setOpen] = useState(false)
  const [favorites, setFavorites] = useState<GlobalFavoriteTeam[]>(initialFavorites)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PandaScoreTeam[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) { setResults([]); return }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      const teams = await searchTeamsAction(query)
      setResults(teams)
      setIsSearching(false)
    }, 350)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  const isFavorite = (teamId: number) => favorites.some((f) => f.team_id === teamId)

  const handleAdd = (team: PandaScoreTeam) => {
    if (!isLoggedIn) {
      toast({ title: 'Connectez-vous pour ajouter des favoris', variant: 'destructive' })
      return
    }
    startTransition(async () => {
      const result = await addGlobalFavorite(team.id, team.name, team.image_url)
      if (result.error) {
        toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
      } else {
        setFavorites((prev) => [...prev, { team_id: team.id, team_name: team.name, team_image_url: team.image_url }])
        toast({ title: `⭐ ${team.name} ajouté`, description: 'Tu verras leurs compétitions en priorité.' })
      }
    })
  }

  const handleRemove = (teamId: number) => {
    startTransition(async () => {
      const result = await removeGlobalFavorite(teamId)
      if (result.error) {
        toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
      } else {
        setFavorites((prev) => prev.filter((f) => f.team_id !== teamId))
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 font-bold uppercase tracking-widest text-xs border-yellow-500/40 text-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-500/70 hover:text-yellow-400">
          <Star className="h-3.5 w-3.5 fill-yellow-500" />
          Mes équipes
          {favorites.length > 0 && (
            <span className="ml-0.5 rounded-full bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-black text-yellow-400">
              {favorites.length}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="overflow-y-auto max-h-[85vh] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden p-6">
          <DialogHeader className="mb-5">
            <DialogTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
              Équipes favorites
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Suis jusqu&apos;à {MAX_FAVORITES} équipes — leurs compétitions apparaîtront en priorité sur la home.
            </p>
          </DialogHeader>

          {/* Favoris actuels */}
          {favorites.length > 0 && (
            <div className="mb-5 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Tes favoris ({favorites.length}/{MAX_FAVORITES})
              </p>
              {favorites.map((fav) => (
                <div key={fav.team_id} className="flex items-center gap-3 p-2.5 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
                  <div className="h-9 w-9 rounded-lg overflow-hidden border border-yellow-500/20 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    {fav.team_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={fav.team_image_url} alt={fav.team_name} className="h-full w-full object-contain p-1" />
                    ) : (
                      <Star className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <span className="flex-1 text-sm font-bold truncate">{fav.team_name}</span>
                  <button
                    onClick={() => handleRemove(fav.team_id)}
                    disabled={isPending}
                    className="p-1 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Barre de recherche */}
          {favorites.length < MAX_FAVORITES && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Rechercher une équipe
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="NaVi, Team Vitality, FaZe..."
                  className="w-full rounded-xl border border-border bg-card/50 pl-9 pr-4 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-0 placeholder:text-muted-foreground/50"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
              </div>

              {results.length > 0 && (
                <div className="space-y-1.5">
                  {results.map((team) => {
                    const already = isFavorite(team.id)
                    return (
                      <div
                        key={team.id}
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-border/40 bg-card/50"
                      >
                        <div className="h-9 w-9 rounded-lg overflow-hidden border border-border/40 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                          {team.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={team.image_url} alt={team.name} className="h-full w-full object-contain p-1" />
                          ) : (
                            <Star className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 flex items-center gap-2 min-w-0">
                          <span className="text-sm font-bold truncate">{team.name}</span>
                          {team.game && (
                            <span className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${team.game === 'CS2' ? 'bg-blue-500/15 text-blue-400' : 'bg-red-500/15 text-red-400'}`}>
                              {team.game}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => !already && handleAdd(team)}
                          disabled={isPending || already}
                          className={`p-1.5 rounded-lg transition-colors ${
                            already
                              ? 'text-yellow-500 cursor-default'
                              : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                          }`}
                        >
                          {already ? <Star className="h-3.5 w-3.5 fill-yellow-500" /> : <Plus className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {query.length >= 2 && !isSearching && results.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">Aucune équipe trouvée pour &quot;{query}&quot;</p>
              )}
            </div>
          )}

          {favorites.length >= MAX_FAVORITES && (
            <p className="text-center text-xs text-muted-foreground py-3 border border-border/40 rounded-xl">
              Maximum atteint. Retire une équipe pour en ajouter une autre.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
