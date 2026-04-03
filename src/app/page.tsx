import { getUpcomingSeries, getTeamActiveSeries } from '@/lib/pandascore'
import { SerieCard } from '@/components/serie-card'
import { PandaScoreSerie } from '@/types/pandascore'
import { createClient } from '@/lib/supabase/server'
import { GlobalFavoritesModal, GlobalFavoriteTeam } from '@/components/global-favorites-modal'

export default async function Home() {
  let series: PandaScoreSerie[] = []
  let registeredSerieIds: number[] = []
  let globalFavorites: GlobalFavoriteTeam[] = []
  let isLoggedIn = false
  let hideCs2 = false
  let hideValorant = false

  try {
    series = await getUpcomingSeries()
  } catch (e) {
    console.error('Failed to get series on Home:', e)
  }

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    isLoggedIn = !!user

    if (user) {
      const [regData, favData, profileData] = await Promise.all([
        supabase.from('registrations').select('serie_id').eq('user_id', user.id),
        supabase.from('global_favorite_teams').select('team_id, team_name, team_image_url').eq('user_id', user.id),
        supabase.from('profiles').select('hide_cs2, hide_valorant').eq('id', user.id).single(),
      ])
      registeredSerieIds = regData.data?.map((r) => r.serie_id) ?? []
      globalFavorites = favData.data ?? []
      hideCs2 = profileData.data?.hide_cs2 ?? false
      hideValorant = profileData.data?.hide_valorant ?? false
    }
  } catch {}

  // Fetch active series for each favorite team in parallel
  let favoriteSerieIds = new Set<number>()
  let extraSeries: PandaScoreSerie[] = []

  if (globalFavorites.length > 0) {
    const teamSeriesResults = await Promise.all(
      globalFavorites.map((fav) => getTeamActiveSeries(fav.team_id).catch(() => []))
    )

    const mainSerieIds = new Set(series.map((s) => s.id))

    for (const teamSeries of teamSeriesResults) {
      for (const s of teamSeries) {
        favoriteSerieIds.add(s.id)
        // Inject series that are not in the main (filtered) list
        if (!mainSerieIds.has(s.id)) {
          extraSeries.push(s)
          mainSerieIds.add(s.id) // avoid duplicates across teams
        }
      }
    }

    // Deduplicate extraSeries
    extraSeries = Array.from(new Map(extraSeries.map((s) => [s.id, s])).values())
  }

  const CS2_SLUGS = ['cs-go', 'cs-go-2', 'cs-2']

  // All series to display = main + extras from favorites, filtered by game prefs (favorites bypass)
  const allSeries = [...series, ...extraSeries].filter((s) => {
    const isCs2 = CS2_SLUGS.includes(s.videogame.slug)
    const isValorant = s.videogame.slug === 'valorant'
    const isFav = favoriteSerieIds.has(s.id)
    if (hideCs2 && isCs2 && !isFav) return false
    if (hideValorant && isValorant && !isFav) return false
    return true
  })

  const mySeries = allSeries.filter((s) => registeredSerieIds.includes(s.id))
  const favoriteSeries = allSeries.filter(
    (s) => !registeredSerieIds.includes(s.id) && favoriteSerieIds.has(s.id)
  )
  const otherSeries = allSeries.filter(
    (s) => !registeredSerieIds.includes(s.id) && !favoriteSerieIds.has(s.id)
  )

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-extrabold tracking-tighter text-foreground sm:text-6xl uppercase">
            <span className="text-primary italic">Grind</span> the Ladder
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Les meilleures compétitions <span className="text-primary font-bold">CS2</span> et{' '}
            <span className="text-primary font-bold">Valorant</span> sont ici.
          </p>
          {isLoggedIn && (
            <div className="mt-6 flex justify-center">
              <GlobalFavoritesModal initialFavorites={globalFavorites} isLoggedIn={isLoggedIn} />
            </div>
          )}
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
                  <SerieCard
                    key={serie.id}
                    serie={serie}
                    isRegistered
                    hasFavoriteTeam={favoriteSerieIds.has(serie.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tes équipes jouent ici */}
          {favoriteSeries.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-yellow-500/20" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-500 whitespace-nowrap">
                  ⭐ Tes équipes jouent ici
                </h3>
                <div className="h-px flex-1 bg-yellow-500/20" />
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {favoriteSeries.map((serie) => (
                  <SerieCard key={serie.id} serie={serie} hasFavoriteTeam />
                ))}
              </div>
            </div>
          )}

          {/* Autres compétitions */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="text-xl font-bold uppercase tracking-widest">
                  {mySeries.length > 0 || favoriteSeries.length > 0
                    ? 'Autres compétitions'
                    : 'Compétitions en cours & à venir'}
                </h3>
              </div>
              <div className="h-px flex-1 bg-primary/20 hidden sm:block" />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {otherSeries.length > 0 ? (
                otherSeries.map((serie) => <SerieCard key={serie.id} serie={serie} />)
              ) : (
                <div className="col-span-full py-12 text-center text-muted-foreground bg-card/20 rounded-lg border border-dashed border-primary/20">
                  {mySeries.length > 0 || favoriteSeries.length > 0
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
