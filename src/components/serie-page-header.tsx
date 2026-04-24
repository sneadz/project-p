import Image from 'next/image'
import { Calendar, Gamepad2, Trophy, Gem } from 'lucide-react'
import { TeamsModal, TeamSummary } from '@/components/teams-modal'

interface SeriePageHeaderProps {
  leagueName: string
  fullSerieName: string
  videogameName: string
  gameSquare: string | null
  beginAt: string | null
  isJoined: boolean
  totalPoints: number
  currentUserRank: number | null
  teams: TeamSummary[]
  serieId: number
  favoriteTeamId: number | null
  serieStarted: boolean
  activeTeamIds: number[]
  currentUserId?: string
  favoriteTeam: TeamSummary | null
}

export function SeriePageHeader({
  leagueName,
  fullSerieName,
  videogameName,
  gameSquare,
  beginAt,
  isJoined,
  totalPoints,
  currentUserRank,
  teams,
  serieId,
  favoriteTeamId,
  serieStarted,
  activeTeamIds,
  currentUserId,
  favoriteTeam,
}: SeriePageHeaderProps) {
  return (
    <section className="relative py-12 overflow-hidden">
      <div className="absolute inset-0 bg-primary/10 -skew-y-3 transform origin-top-left -z-10"></div>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          {/* Logo jeu — centré sur mobile */}
          <div className="relative h-28 w-28 md:h-48 md:w-48 flex-shrink-0 rounded-2xl bg-card/50 border border-primary/20 backdrop-blur shadow-2xl flex items-center justify-center overflow-hidden self-center md:self-start mx-auto md:mx-0">
            {gameSquare ? (
              <Image
                src={gameSquare}
                alt={videogameName}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 112px, 192px"
                priority
              />
            ) : (
              <div className="flex flex-col h-full w-full items-center justify-center gap-2">
                <Trophy className="h-10 w-10 md:h-14 md:w-14 text-primary/20" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  {videogameName}
                </span>
              </div>
            )}
          </div>

          {/* Infos + actions */}
          <div className="flex-1 flex flex-col gap-4 items-center md:items-start text-center md:text-left">
            {/* Badges */}
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
              {videogameName && (
                <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 border border-primary/20">
                  <Gamepad2 className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    {videogameName}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 rounded-full bg-muted/10 px-3 py-1 border border-muted/20">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {beginAt
                    ? new Date(beginAt).toLocaleDateString('fr-FR', {
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Compétition'}
                </span>
              </div>
              {isJoined && (
                <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                  <Gem className="h-3 w-3 text-green-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-green-500">
                    {totalPoints} SHARD{totalPoints > 1 ? 'S' : ''}
                  </span>
                </div>
              )}
              {isJoined && currentUserRank && (
                <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 border border-primary/20">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                    #{currentUserRank}
                  </span>
                </div>
              )}
            </div>

            {/* Titre */}
            <div>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-tight">
                {leagueName}
              </h2>
              <p className="text-sm md:text-base text-muted-foreground italic mt-1">{fullSerieName}</p>
            </div>

            {/* Boutons équipes + classement */}
            <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
              <TeamsModal
                teams={teams}
                serieId={serieId}
                isLoggedIn={!!currentUserId}
                currentFavoriteTeamId={favoriteTeamId}
                serieStarted={serieStarted}
                activeTeamIds={activeTeamIds}
              />
            </div>
          </div>

          {/* Favori — à droite sur desktop, inline sur mobile */}
          {favoriteTeam && (
            <div className="flex flex-col items-center gap-2 shrink-0 self-center md:self-start mx-auto md:mx-0">
              <div className="relative h-28 w-28 md:h-20 md:w-20">
                <div className="h-28 w-28 md:h-20 md:w-20 rounded-2xl overflow-hidden border-2 border-yellow-500/50 shadow-[0_0_20px_2px] shadow-yellow-500/20 bg-zinc-200 dark:bg-zinc-800">
                  {favoriteTeam.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={favoriteTeam.image_url}
                      alt={favoriteTeam.name}
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <span className="text-2xl font-black text-yellow-500">
                        {favoriteTeam.name[0]}
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute -top-1.5 -right-1.5 z-10 bg-yellow-500 rounded-full p-0.5">
                  <svg className="h-3 w-3 fill-black" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-500/80 truncate max-w-[80px] text-center">
                {favoriteTeam.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
