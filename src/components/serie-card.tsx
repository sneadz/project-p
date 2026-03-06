import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PandaScoreSerie } from "@/types/pandascore"
import { Calendar, Trophy } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface SerieCardProps {
  serie: PandaScoreSerie
}

export function SerieCard({ serie }: SerieCardProps) {
  const tier = serie.tournaments[0]?.tier?.toUpperCase() || '?'
  const tierColor = tier === 'S' 
    ? 'bg-yellow-500 text-black border-yellow-400' 
    : tier === 'A' 
    ? 'bg-slate-300 text-black border-slate-200' 
    : ''

  const startDate = new Date(serie.begin_at)
  const isStarted = startDate <= new Date()

  const formattedStartDate = startDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })

  const leagueImage = serie.image_url || serie.league.image_url || serie.videogame.image_url

  // Slug pour afficher une image de fallback basée sur le jeu si aucune image de ligue n'existe
  const gameSlug = serie.videogame.slug
  const gameDefaultColor = gameSlug === 'valorant' ? 'border-red-500/50' : 'border-primary/50'

  return (
    <Link href={`/series/${serie.id}`}>
      <Card className={`group h-full overflow-hidden border-primary/20 bg-card/50 transition-all hover:border-white/50 hover:bg-card/80 ${gameDefaultColor}`}>
        <CardHeader className="relative pb-0">
          <div className="flex items-center justify-between mb-2">
            <Badge className={cn("font-bold", tierColor)} variant="outline">
              TIER {tier}
            </Badge>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formattedStartDate}
              </div>
              {isStarted ? (
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-green-500 uppercase tracking-tighter">En cours</span>
                </div>
              ) : (
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter italic">À venir</span>
              )}
            </div>
          </div>
          <div className="aspect-video relative w-full mb-4 overflow-hidden rounded-md bg-muted/10 border border-primary/5 flex items-center justify-center">
            {leagueImage ? (
              <div className="relative h-full w-full p-4">
                <Image
                  src={leagueImage}
                  alt={serie.league.name}
                  fill
                  className="object-contain transition-transform group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2">
                <Trophy className="h-12 w-12 text-primary/20 animate-pulse" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{serie.videogame.name}</span>
              </div>
            )}
          </div>
          <CardTitle className="line-clamp-1 text-lg group-hover:text-primary transition-colors">
            {serie.league.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 italic">
            {serie.full_name}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              {serie.videogame.name}
            </Badge>
            <span className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              VOIR MATCHS →
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
