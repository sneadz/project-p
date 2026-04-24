import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, Copy, Users, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default async function LeaguesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Toutes les ligues dont l'user est membre
  const { data: memberships } = await supabase
    .from('league_members')
    .select('league_id, leagues!inner(id, name, invite_code, owner_id, serie_id, created_at)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  type LeagueRow = {
    id: string
    name: string
    invite_code: string
    owner_id: string
    serie_id: number
    created_at: string
  }

  const leagues: LeagueRow[] = (memberships ?? []).map(
    (m) => m.leagues as unknown as LeagueRow
  )

  // Compter les membres par ligue
  const leagueIds = leagues.map((l) => l.id)
  const { data: memberCounts } = await supabase
    .from('league_members')
    .select('league_id')
    .in('league_id', leagueIds)

  const countMap = new Map<string, number>()
  for (const row of memberCounts ?? []) {
    countMap.set(row.league_id, (countMap.get(row.league_id) ?? 0) + 1)
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto max-w-2xl px-4 py-16 space-y-10">
        <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
          <Trophy className="h-6 w-6 text-primary" />
          Mes ligues
        </h1>

        {leagues.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center space-y-2">
            <p className="text-sm font-bold text-muted-foreground">
              Vous n&apos;avez pas encore de ligue.
            </p>
            <p className="text-xs text-muted-foreground">
              Créez ou rejoignez une ligue depuis la page d&apos;une compétition.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {leagues.map((league) => (
              <div
                key={league.id}
                className="rounded-lg border border-border bg-card p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black uppercase tracking-tight truncate">
                      {league.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Compétition #{league.serie_id}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-xs font-bold">{countMap.get(league.id) ?? 1}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  {/* Code d'invitation */}
                  <CopyCode code={league.invite_code} />

                  {/* Lien vers la série */}
                  <Link
                    href={`/series/${league.serie_id}`}
                    className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Voir la compétition
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function CopyCode({ code }: { code: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/30 border border-border px-3 py-1.5">
      <Copy className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="font-mono text-sm font-black tracking-widest text-primary">{code}</span>
    </div>
  )
}
