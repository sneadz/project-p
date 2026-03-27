import { createClient } from '@/lib/supabase/server'
import { getAvatarSrc } from '@/lib/avatars'
import { Gem, User, Target, Crosshair } from 'lucide-react'

export const revalidate = 60

interface LeaderboardEntry {
  id: string
  username: string | null
  avatar_url: string | null
  total_shards: number
  correct_predictions: number
  exact_predictions: number
}

const MEDAL: Record<number, { emoji: string }> = {
  1: { emoji: '🥇' },
  2: { emoji: '🥈' },
  3: { emoji: '🥉' },
}

const RANK_STYLE: Record<number, { card: string; avatar: string; name: string; shards: string; emoji: string }> = {
  1: {
    card:   'bg-card border-yellow-400/30 shadow-[0_0_20px_0px] shadow-yellow-400/10 px-6 py-5 -mx-8',
    avatar: 'h-14 w-14 border-yellow-400/50',
    name:   'text-lg font-black',
    shards: 'text-base',
    emoji:  'text-3xl',
  },
  2: {
    card:   'bg-card border-slate-400/20 shadow-sm px-5 py-4 -mx-5',
    avatar: 'h-12 w-12 border-slate-400/30',
    name:   'text-base font-black',
    shards: 'text-sm',
    emoji:  'text-2xl',
  },
  3: {
    card:   'bg-card border-amber-600/20 shadow-sm px-5 py-3.5 -mx-2',
    avatar: 'h-11 w-11 border-amber-600/20',
    name:   'text-sm font-black',
    shards: 'text-sm',
    emoji:  'text-xl',
  },
}

export default async function LeaderboardPage() {
  const supabase = createClient()

  const { data: players } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, total_shards, correct_predictions, exact_predictions')
    .order('correct_predictions', { ascending: false })
    .limit(20) as { data: LeaderboardEntry[] | null }

  const list = players ?? []

  // Utilisateur connecté
  const { data: { user } } = await supabase.auth.getUser()
  let currentPlayer: LeaderboardEntry | null = null
  let currentRank: number | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, total_shards')
      .eq('id', user.id)
      .single() as { data: LeaderboardEntry | null }

    if (profile) {
      const isInTop20 = list.some(p => p.id === user.id)
      if (!isInTop20) {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gt('correct_predictions', profile.correct_predictions)
        currentRank = (count ?? 0) + 1
        currentPlayer = profile
      }
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-10 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black uppercase tracking-tighter">Classement</h1>
        <p className="text-sm text-muted-foreground mt-1">Top 20 des meilleurs pronostiqueurs</p>
      </div>

      <div className="space-y-3">
        {list.map((player, index) => {
          const rank = index + 1
          const medal = MEDAL[rank]
          const style = RANK_STYLE[rank]
          const avatarSrc = getAvatarSrc(player.avatar_url)
          const displayName = player.username || 'Joueur inconnu'

          return (
            <div
              key={player.id}
              className={`flex items-center gap-4 rounded-xl border transition-colors
                ${style
                  ? style.card
                  : 'bg-card/50 border-border/40 px-4 py-3'
                }`}
            >
              {/* Rank */}
              <div className="w-8 text-center shrink-0">
                {medal ? (
                  <span className={style?.emoji ?? 'text-xl'}>{medal.emoji}</span>
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
                )}
              </div>

              {/* Avatar */}
              <div className={`rounded-full overflow-hidden border-2 bg-background flex items-center justify-center shrink-0 ${style?.avatar ?? 'h-10 w-10 border-primary/20'}`}>
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarSrc} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {/* Pseudo */}
              <div className="flex-1 min-w-0">
                <p className={`truncate ${style?.name ?? 'text-sm font-bold text-muted-foreground'}`}>
                  {displayName}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1 text-green-500" title="Paris réussis">
                  <Target className="h-3.5 w-3.5" />
                  <span className={`font-black tabular-nums ${style?.shards ?? 'text-sm'}`}>
                    {player.correct_predictions}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-primary" title="Scores exacts">
                  <Crosshair className="h-3.5 w-3.5" />
                  <span className={`font-black tabular-nums ${style?.shards ?? 'text-sm'}`}>
                    {player.exact_predictions}
                  </span>
                </div>
              </div>
            </div>
          )
        })}

        {list.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            <p className="font-bold">Aucun joueur pour le moment</p>
            <p className="text-sm mt-1">Sois le premier à placer des paris !</p>
          </div>
        )}

        {/* Carte du joueur connecté hors top 20 */}
        {currentPlayer && currentRank && (
          <>
            <div className="flex items-center justify-center gap-3 py-2">
              <div className="h-px flex-1 bg-border/40" />
              <span className="text-xs font-bold text-muted-foreground tracking-widest">• • •</span>
              <div className="h-px flex-1 bg-border/40" />
            </div>
            <div className="flex items-center gap-4 rounded-xl border bg-primary/5 border-primary/30 px-4 py-3">
              <div className="w-8 text-center shrink-0">
                <span className="text-sm font-bold text-primary">#{currentRank}</span>
              </div>
              <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary/30 bg-background flex items-center justify-center shrink-0">
                {getAvatarSrc(currentPlayer.avatar_url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getAvatarSrc(currentPlayer.avatar_url)!} alt="Vous" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-primary">
                  {currentPlayer.username || 'Vous'} <span className="text-[10px] font-normal text-muted-foreground">(vous)</span>
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1 text-green-500" title="Paris réussis">
                  <Target className="h-3.5 w-3.5" />
                  <span className="font-black text-sm tabular-nums">{currentPlayer.correct_predictions}</span>
                </div>
                <div className="flex items-center gap-1 text-primary" title="Scores exacts">
                  <Crosshair className="h-3.5 w-3.5" />
                  <span className="font-black text-sm tabular-nums">{currentPlayer.exact_predictions}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
