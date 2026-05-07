import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { AvatarWithBorder } from '@/components/avatar-with-border'
import {
  Target, Crosshair, Gem, Trophy, UserPlus, UserCheck, Clock, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
} from '@/app/actions/friends'

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, active_border, total_shards, correct_predictions, exact_predictions')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const [
    { data: serieStats },
    { count: betterCount },
    { data: { user } },
  ] = await Promise.all([
    supabase
      .from('serie_stats')
      .select('serie_id, league_name, serie_name, rank, total_bets, correct_predictions, exact_predictions')
      .eq('user_id', profile.id)
      .order('archived_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gt('correct_predictions', profile.correct_predictions),
    supabase.auth.getUser(),
  ])

  const rank = (betterCount ?? 0) + 1
  const totalBets = (serieStats ?? []).reduce((acc, s) => acc + (s.total_bets ?? 0), 0)
  const winrate = totalBets > 0
    ? Math.round((profile.correct_predictions / totalBets) * 100)
    : null

  const isOwnProfile = user?.id === profile.id
  let friendship: { id: string; status: string; iRequested: boolean } | null = null

  if (user && !isOwnProfile) {
    const { data: rel } = await supabase
      .from('friendships')
      .select('id, status, requester_id')
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),` +
        `and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`
      )
      .maybeSingle()

    if (rel) {
      friendship = {
        id: rel.id,
        status: rel.status,
        iRequested: rel.requester_id === user.id,
      }
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto max-w-2xl px-4 py-16 space-y-10">

        {/* Hero */}
        <div className="flex flex-col items-center gap-4 text-center">
          <AvatarWithBorder
            avatarId={profile.avatar_url}
            borderId={profile.active_border}
            size="xl"
            alt="Avatar"
          />
          <h1 className="text-2xl font-black uppercase tracking-tighter">
            {profile.username ?? username}
          </h1>

          {/* Friend button — 5 states */}
          {!user && (
            <Button disabled variant="outline" size="sm" className="gap-2">
              <UserPlus className="h-3.5 w-3.5" />
              Ajouter en ami
            </Button>
          )}
          {user && !isOwnProfile && !friendship && (
            <form
              action={async () => {
                'use server'
                await sendFriendRequest(profile.id)
                revalidatePath(`/u/${username}`)
              }}
            >
              <Button type="submit" variant="outline" size="sm" className="gap-2">
                <UserPlus className="h-3.5 w-3.5" />
                Ajouter en ami
              </Button>
            </form>
          )}
          {user && !isOwnProfile && friendship?.status === 'pending' && friendship.iRequested && (
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Demande envoyée
            </span>
          )}
          {user && !isOwnProfile && friendship?.status === 'pending' && !friendship.iRequested && (
            <form
              action={async () => {
                'use server'
                await acceptFriendRequest(friendship!.id)
                revalidatePath(`/u/${username}`)
              }}
            >
              <Button type="submit" variant="default" size="sm" className="gap-2">
                <Check className="h-3.5 w-3.5" />
                Accepter la demande
              </Button>
            </form>
          )}
          {user && !isOwnProfile && friendship?.status === 'accepted' && (
            <form
              action={async () => {
                'use server'
                await removeFriend(friendship!.id)
                revalidatePath(`/u/${username}`)
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5" />
                  Déjà amis
                </span>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive text-xs"
                >
                  Retirer
                </Button>
              </div>
            </form>
          )}
        </div>

        <div className="border-t border-border" />

        {/* Stats highlight */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-card p-5 text-center space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Rang global</p>
            <p className="text-3xl font-black text-yellow-500">
              {profile.correct_predictions > 0 ? `#${rank}` : '—'}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 text-center space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Winrate</p>
            <p className="text-3xl font-black text-green-500">
              {winrate !== null ? `${winrate}%` : '—'}
            </p>
          </div>
        </div>

        {/* Stats secondaires */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-lg border border-border bg-card p-3 text-center space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Paris</p>
            <p className="text-xl font-black">{totalBets || '—'}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Réussis</p>
            <p className="text-xl font-black text-green-500 flex items-center justify-center gap-1">
              <Target className="h-4 w-4" />
              {profile.correct_predictions}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Exacts</p>
            <p className="text-xl font-black text-primary flex items-center justify-center gap-1">
              <Crosshair className="h-4 w-4" />
              {profile.exact_predictions}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Shards</p>
            <p className="text-xl font-black text-primary flex items-center justify-center gap-1">
              <Gem className="h-4 w-4" />
              {profile.total_shards}
            </p>
          </div>
        </div>

        {/* Historique compétitions */}
        {serieStats && serieStats.length > 0 && (
          <>
            <div className="border-t border-border" />
            <div className="space-y-4">
              <h2 className="text-lg font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Compétitions jouées
              </h2>
              <div className="space-y-2">
                {serieStats.map((s) => (
                  <div
                    key={s.serie_id}
                    className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{s.league_name}</p>
                      <p className="text-xs text-muted-foreground italic truncate">{s.serie_name}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
                      {s.rank && (
                        <span className="text-base font-black text-yellow-500 uppercase tracking-widest">
                          Top #{s.rank}
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-green-500" title="Paris réussis">
                        <Target className="h-3.5 w-3.5" />
                        <span className="text-sm font-black tabular-nums">
                          {s.correct_predictions}/{s.total_bets}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-primary" title="Scores exacts">
                        <Crosshair className="h-3.5 w-3.5" />
                        <span className="text-sm font-black tabular-nums">{s.exact_predictions}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
