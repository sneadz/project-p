import { getUpcomingSeries } from '@/lib/pandascore'
import { SerieCard } from '@/components/serie-card'
import { PandaScoreSerie } from '@/types/pandascore'

export default async function Home() {
  let series: PandaScoreSerie[] = []
  try {
    series = await getUpcomingSeries()
  } catch (e) {
    console.error('Failed to get series on Home:', e)
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-extrabold tracking-tighter text-foreground sm:text-6xl uppercase">
            Predict the <span className="text-primary italic">Game</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Les meilleures compétitions <span className="text-primary font-bold">CS2</span> et <span className="text-primary font-bold">Valorant</span> sont ici.
          </p>
        </div>

        {/* Series Grid */}
        <div className="space-y-8">
          <div className="flex items-center justify-between border-l-4 border-primary pl-4">
            <h3 className="text-xl font-bold uppercase tracking-widest">Compétitions en cours & à venir</h3>
            <div className="h-px flex-1 bg-primary/20 ml-4 hidden sm:block"></div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {series.length > 0 ? (
              series.map((serie) => (
                <SerieCard key={serie.id} serie={serie} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-card/20 rounded-lg border border-dashed border-primary/20">
                Aucune compétition majeure prévue pour le moment ou clé API non configurée.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-24 border-t border-primary/20 bg-card/50 py-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 PROJECT P - Esports Pick&apos;em Platform.
        </div>
      </footer>
    </main>
  )
}
