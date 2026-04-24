import { createClient } from '@/lib/supabase/server'
import { Target, Crosshair, User } from 'lucide-react'
import { getAvatarSrc } from '@/lib/avatars'

interface SerieLeaderboardProps {
  serieId: number
  currentUserId?: string
}

export async function SerieLeaderboard({ serieId, currentUserId }: SerieLeaderboardProps) {
  const supabase = createClient()

  const { data: entries } = await supabase
    .from('registrations')
    .select('user_id, correct_predictions, exact_predictions')
    .eq('serie_id', serieId)
    .order('correct_predictions', { ascending: false })
    .order('exact_predictions', { ascending: false })
    .limit(10)

  if (!entries || entries.length === 0) return null

  // Fetch profiles for top 10
  const userIds = entries.map((e) => e.user_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', userIds)

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  // Position du joueur connecté s'il n'est pas dans le top 10
  let currentUserEntry: { rank: number; correct: number; exact: number; username: string | null; avatar_url: string | null } | null = null
  const isInTop10 = entries.some((e) => e.user_id === currentUserId)

  if (currentUserId && !isInTop10) {
    const { data: me } = await supabase
      .from('registrations')
      .select('correct_predictions, exact_predictions')
      .eq('serie_id', serieId)
      .eq('user_id', currentUserId)
      .single()

    if (me) {
      const { count: betterCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('serie_id', serieId)
        .gt('correct_predictions', me.correct_predictions ?? 0)

      const myProfile = profileMap.get(currentUserId)
      currentUserEntry = {
        rank: (betterCount ?? 0) + 1,
        correct: me.correct_predictions ?? 0,
        exact: me.exact_predictions ?? 0,
        username: myProfile?.username ?? null,
        avatar_url: myProfile?.avatar_url ?? null,
      }
    }
  }

  return (
    <section className="container mx-auto px-4 mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-primary/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-1 bg-primary"></div>
          <h3 className="text-2xl font-black uppercase tracking-widest">Classement</h3>
        </div>
        {currentUserId && (() => {
          const myIndex = entries.findIndex((e) => e.user_id === currentUserId)
          const myRank = myIndex !== -1 ? myIndex + 1 : currentUserEntry?.rank ?? null
          return myRank ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/30">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ta position</span>
              <span className="text-2xl font-black text-primary">#{myRank}</span>
            </div>
          ) : null
        })()}
      </div>

      <div className="space-y-2 max-w-xl">
        {entries.map((entry, index) => {
          const rank = index + 1
          const profile = profileMap.get(entry.user_id)
          const avatarSrc = getAvatarSrc(profile?.avatar_url ?? null)
          const isMe = entry.user_id === currentUserId
          const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null

          return (
            <div
              key={entry.user_id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                isMe
                  ? 'bg-primary/5 border-primary/30'
                  : 'bg-card/50 border-border/40'
              }`}
            >
              <div className="w-7 text-center shrink-0">
                {medal ? (
                  <span className="text-lg">{medal}</span>
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
                )}
              </div>
              <div className="h-8 w-8 rounded-lg overflow-hidden border border-border/40 bg-card flex items-center justify-center shrink-0">
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
              <span className={`flex-1 text-sm font-bold truncate ${isMe ? 'text-primary' : ''}`}>
                {profile?.username ?? 'Joueur'}
                {isMe && <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">(vous)</span>}
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1 text-green-500">
                  <Target className="h-3.5 w-3.5" />
                  <span className="text-sm font-black tabular-nums">{entry.correct_predictions ?? 0}</span>
                </div>
                <div className="flex items-center gap-1 text-primary">
                  <Crosshair className="h-3.5 w-3.5" />
                  <span className="text-sm font-black tabular-nums">{entry.exact_predictions ?? 0}</span>
                </div>
              </div>
            </div>
          )
        })}

        {currentUserEntry && (
          <>
            <div className="flex items-center justify-center gap-3 py-1">
              <div className="h-px flex-1 bg-border/40" />
              <span className="text-xs font-bold text-muted-foreground tracking-widest">• • •</span>
              <div className="h-px flex-1 bg-border/40" />
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-primary/5 border-primary/30">
              <div className="w-7 text-center shrink-0">
                <span className="text-sm font-bold text-primary">#{currentUserEntry.rank}</span>
              </div>
              <div className="h-8 w-8 rounded-lg border border-primary/30 bg-card flex items-center justify-center shrink-0">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="flex-1 text-sm font-bold text-primary truncate">
                {currentUserEntry.username ?? 'Vous'}
                <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">(vous)</span>
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1 text-green-500">
                  <Target className="h-3.5 w-3.5" />
                  <span className="text-sm font-black tabular-nums">{currentUserEntry.correct}</span>
                </div>
                <div className="flex items-center gap-1 text-primary">
                  <Crosshair className="h-3.5 w-3.5" />
                  <span className="text-sm font-black tabular-nums">{currentUserEntry.exact}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
