import { getUpcomingSeries } from '@/lib/pandascore'
import { SerieCard } from '@/components/serie-card'
import { PandaScoreSerie } from '@/types/pandascore'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  let series: PandaScoreSerie[] = []
  let registeredSerieIds: number[] = []

  try {
    series = await getUpcomingSeries()
  } catch (e) {
    console.error('Failed to get series on Home:', e)
  }

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: registrations } = await supabase
        .from('registrations')
        .select('serie_id')
        .eq('user_id', user.id)
      registeredSerieIds = registrations?.map((r) => r.serie_id) ?? []
    }
  } catch {}

  const mySeries = series.filter((s) => registeredSerieIds.includes(s.id))
  const otherSeries = series.filter((s) => !registeredSerieIds.includes(s.id))

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto px-4 py-12">

        {/* Hero */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-extrabold tracking-tighter text-foreground sm:text-6xl uppercase">
            <span className="text-primary italic">Grind</span> the Ladder
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Les meilleures compétitions <span className="text-primary font-bold">CS2</span> et <span className="text-primary font-bold">Valorant</span> sont ici.
          </p>
        </div>

        <div className="space-y-14">

          {/* Mes compétitions */}
          {mySeries.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-primary/20" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary whitespace-nowrap">
                  ✦ Mes compétitions
                </h3>
                <div className="h-px flex-1 bg-primary/20" />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {mySeries.map((serie) => (
                  <SerieCard key={serie.id} serie={serie} isRegistered />
                ))}
              </div>
            </div>
          )}

          {/* Autres compétitions */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="text-xl font-bold uppercase tracking-widest">
                  {mySeries.length > 0 ? 'Autres compétitions' : 'Compétitions en cours & à venir'}
                </h3>
              </div>
              <div className="h-px flex-1 bg-primary/20 hidden sm:block" />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {otherSeries.length > 0 ? (
                otherSeries.map((serie) => (
                  <SerieCard key={serie.id} serie={serie} />
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-muted-foreground bg-card/20 rounded-lg border border-dashed border-primary/20">
                  {mySeries.length > 0
                    ? 'Tu participes à toutes les compétitions disponibles !'
                    : 'Aucune compétition majeure prévue pour le moment.'}
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="mt-24 border-t border-primary/20 bg-card/50 py-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 grind.gg - Esports Pick&apos;em Platform.
        </div>
      </footer>
    </main>
  )
}
