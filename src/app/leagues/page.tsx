import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Shield, Users, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { LeaguesForm } from '@/components/leagues-form'

export default async function LeaguesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberships } = await supabase
    .from('league_members')
    .select('league_id, leagues!inner(id, name, invite_code, owner_id)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  type LeagueRow = { id: string; name: string; invite_code: string; owner_id: string }
  const leagues: LeagueRow[] = (memberships ?? []).map(
    (m) => m.leagues as unknown as LeagueRow
  )

  const leagueIds = leagues.map((l) => l.id)
  const { data: memberCounts } = leagueIds.length
    ? await supabase.from('league_members').select('league_id').in('league_id', leagueIds)
    : { data: [] }

  const countMap = new Map<string, number>()
  for (const row of memberCounts ?? []) {
    countMap.set(row.league_id, (countMap.get(row.league_id) ?? 0) + 1)
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto max-w-2xl px-4 py-16 space-y-10">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-black uppercase tracking-tighter">Ligues privées</h1>
        </div>

        <LeaguesForm />

        {leagues.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Mes ligues ({leagues.length})
            </h2>
            {leagues.map((league) => (
              <Link
                key={league.id}
                href={`/leagues/${league.id}`}
                className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-black uppercase tracking-tight truncate">
                    {league.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {league.invite_code}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-xs font-bold">{countMap.get(league.id) ?? 1}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
