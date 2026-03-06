import { getMatchesBySerie, getSerieById } from '@/lib/pandascore'
import { MatchCard } from '@/components/match-card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Trophy, Calendar, Gamepad2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'

interface SeriePageProps {
  params: {
    id: string
  }
}

export default async function SeriePage({ params }: SeriePageProps) {
  const serieId = parseInt(params.id)
  
  if (isNaN(serieId)) {
    notFound()
  }

  // On récupère les infos de la série via l'API directe ou le cache
  const serie = await getSerieById(serieId)
  
  // Si on n'a pas pu récupérer la série, on tente quand même les matchs
  // mais si les deux échouent, là on affiche un 404
  const matches = await getMatchesBySerie(serieId).catch(() => [])

  if (!serie && matches.length === 0) {
    notFound()
  }

  // Fallback si la série est null mais qu'on a des matchs
  const leagueName = serie?.league?.name || (matches.length > 0 ? matches[0].league.name : 'Tournoi')
  const leagueImage = serie?.image_url || serie?.league?.image_url || serie?.videogame?.image_url || (matches.length > 0 ? matches[0].league.image_url || matches[0].videogame.image_url : null)
  const fullSerieName = serie?.full_name || (matches.length > 0 ? matches[0].serie.full_name : 'Détails de la compétition')
  const videogameName = serie?.videogame?.name || (matches.length > 0 ? matches[0].videogame.name : '')
  const beginAt = serie?.begin_at || (matches.length > 0 ? matches[0].begin_at : null)

  return (
    <main className="min-h-screen bg-background text-foreground pb-20">
      {/* Navbar Minimaliste */}
      <nav className="border-b border-primary/20 bg-card/50 py-4 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 group">
            <ChevronLeft className="h-5 w-5 text-primary group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest group-hover:text-primary transition-colors">Retour</span>
          </Link>
          <h1 className="text-xl font-black tracking-tighter text-primary">PROJECT P</h1>
          <div className="w-20"></div> {/* Spacer */}
        </div>
      </nav>

      {/* Header de la Compétition */}
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-primary/10 -skew-y-3 transform origin-top-left -z-10"></div>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative h-40 w-40 flex-shrink-0 rounded-2xl bg-card/50 border border-primary/20 p-6 backdrop-blur shadow-2xl flex items-center justify-center overflow-hidden">
              {leagueImage ? (
                <div className="relative h-full w-full">
                  <Image 
                    src={leagueImage} 
                    alt={leagueName} 
                    fill 
                    className="object-contain"
                    sizes="160px"
                    priority
                  />
                </div>
              ) : (
                <div className="flex flex-col h-full w-full items-center justify-center gap-2">
                  <Trophy className="h-16 w-16 text-primary/20" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{videogameName}</span>
                </div>
              )}
            </div>
            
            <div className="text-center md:text-left space-y-4">
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                {videogameName && (
                   <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 border border-primary/20">
                     <Gamepad2 className="h-3 w-3 text-primary" />
                     <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{videogameName}</span>
                   </div>
                )}
                <div className="flex items-center gap-2 rounded-full bg-muted/10 px-3 py-1 border border-muted/20">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {beginAt ? new Date(beginAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'Compétition'}
                  </span>
                </div>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-tight">
                {leagueName}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl italic">
                {fullSerieName}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Liste des Matchs */}
      <section className="container mx-auto px-4 mt-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-8 w-1 bg-primary"></div>
          <h3 className="text-2xl font-black uppercase tracking-widest">Matchs Programmés</h3>
          <span className="ml-auto text-xs font-mono text-muted-foreground uppercase">{matches.length} MATCHS TROUVÉS</span>
        </div>

        {matches.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center rounded-2xl border border-dashed border-primary/20 bg-card/10">
            <Trophy className="h-12 w-12 text-muted/20 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Aucun match n&apos;est encore programmé pour cette série.</p>
            <Link href="/">
              <Button variant="outline" className="mt-6">Explorer d&apos;autres tournois</Button>
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}
