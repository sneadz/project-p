import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Pencil, User, Gem } from 'lucide-react'
import { getAvatarSrc } from '@/lib/avatars'
import { getMatchesBySerie } from '@/lib/pandascore'

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single()

  const displayName = profile?.username || user.email
  const avatarSrc = getAvatarSrc(profile?.avatar_url)

  // Fetch all bets
  const { data: allBets } = await supabase
    .from('bets')
    .select('match_id, serie_id, score')
    .eq('user_id', user.id)

  const totalPredictions = allBets?.length || 0
  let correctWinner = 0
  let exactScore = 0
  let totalShards = 0
  let finishedBets = 0

  if (allBets && allBets.length > 0) {
    const serieIds = [...new Set(allBets.map(b => b.serie_id))]

    await Promise.all(serieIds.map(async (serieId) => {
      const matches = await getMatchesBySerie(serieId).catch(() => [])
      const serieBets = allBets.filter(b => b.serie_id === serieId)

      for (const bet of serieBets) {
        const match = matches.find(m => m.id === bet.match_id)
        if (!match || match.status !== 'finished' || !match.results || match.results.length < 2) continue

        const team1 = match.opponents[0]?.opponent
        const team2 = match.opponents[1]?.opponent
        if (!team1 || !team2) continue

        const s1 = match.results.find((r: { team_id: number; score: number }) => r.team_id === team1.id)?.score ?? 0
        const s2 = match.results.find((r: { team_id: number; score: number }) => r.team_id === team2.id)?.score ?? 0
        const realScore = `${s1}-${s2}`

        finishedBets++

        if (bet.score === realScore) {
          exactScore++
          correctWinner++
          totalShards += 2
        } else {
          const [bet1, bet2] = bet.score.split('-').map(Number)
          const betWinner = bet1 > bet2 ? team1.id : team2.id
          const realWinner = s1 > s2 ? team1.id : team2.id
          if (betWinner === realWinner) {
            correctWinner++
            totalShards += 1
          }
        }
      }
    }))
  }

  const winRate = finishedBets > 0 ? Math.round((correctWinner / finishedBets) * 100) : 0

  // Update total_shards in profiles for leaderboard
  await supabase.from('profiles').upsert({
    id: user.id,
    total_shards: totalShards,
    updated_at: new Date().toISOString()
  })

  // Leaderboard rank
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gt('total_shards', totalShards)

  const rank = (count || 0) + 1
  const rankDisplay = rank > 100 ? '+100' : `#${rank}`

  const stats = [
    { label: 'Prédictions placées', value: totalPredictions.toString() },
    { label: 'Prédictions réussies', value: correctWinner.toString() },
    { label: 'Scores exacts', value: exactScore.toString() },
    { label: 'Shards totaux', value: totalShards.toString(), icon: true },
    { label: 'Winrate', value: finishedBets > 0 ? `${winRate}%` : '—' },
    { label: 'Rang global', value: totalPredictions > 0 ? rankDisplay : '—' },
  ]

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto max-w-2xl px-4 py-16 space-y-10">

        {/* Header profil */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-primary/40 bg-card flex items-center justify-center shrink-0">
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">{displayName}</h1>
              {profile?.username && (
                <p className="text-sm text-muted-foreground">{user.email}</p>
              )}
            </div>
          </div>
          <Link href="/profile/edit">
            <Button variant="outline" size="sm" className="gap-2">
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </Button>
          </Link>
        </div>

        <div className="border-t border-border" />

        {/* Stats */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold uppercase tracking-wider text-muted-foreground">Statistiques</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border bg-card p-4 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                <p className="text-2xl font-black text-primary flex items-center gap-1.5">
                  {stat.icon && <Gem className="h-5 w-5" />}
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

      </section>
    </main>
  )
}
