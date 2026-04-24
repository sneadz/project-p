import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Shield, Users, Target, Crosshair, ExternalLink, User } from 'lucide-react'
import Link from 'next/link'
import { getAvatarSrc } from '@/lib/avatars'
import { LeagueActions } from '@/components/league-actions'

interface LeaguePageProps {
  params: { id: string }
}

export default async function LeaguePage({ params }: LeaguePageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Vérifier que l'user est membre
  const { data: membership } = await supabase
    .from('league_members')
    .select('league_id, leagues!inner(id, name, invite_code, owner_id)')
    .eq('league_id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) notFound()

  type LeagueRow = { id: string; name: string; invite_code: string; owner_id: string }
  const league = membership.leagues as unknown as LeagueRow

  // Membres de la ligue
  const { data: members } = await supabase
    .from('league_members')
    .select('user_id, profiles!inner(id, username, avatar_url)')
    .eq('league_id', league.id)

  type ProfileRow = { id: string; username: string | null; avatar_url: string | null }
  const memberProfiles = (members ?? []).map((m) => m.profiles as unknown as ProfileRow)
  const memberIds = memberProfiles.map((p) => p.id)
  const profileMap = new Map(memberProfiles.map((p) => [p.id, p]))

  // Registrations de tous les membres (pour les encarts par compétition)
  const { data: regs } = await supabase
    .from('registrations')
    .select('user_id, serie_id, serie_name, correct_predictions, exact_predictions')
    .in('user_id', memberIds)

  // Grouper par série
  const serieMap = new Map<
    number,
    {
      serie_id: number
      serie_name: string
      members: { user_id: string; correct_predictions: number; exact_predictions: number }[]
    }
  >()

  for (const reg of regs ?? []) {
    if (!serieMap.has(reg.serie_id)) {
      serieMap.set(reg.serie_id, {
        serie_id: reg.serie_id,
        serie_name: reg.serie_name ?? `Compétition #${reg.serie_id}`,
        members: [],
      })
    }
    serieMap.get(reg.serie_id)!.members.push({
      user_id: reg.user_id,
      correct_predictions: reg.correct_predictions ?? 0,
      exact_predictions: reg.exact_predictions ?? 0,
    })
  }

  // Trier : d'abord les séries avec plusieurs membres, puis par nombre de membres desc
  const series = Array.from(serieMap.values())
    .sort((a, b) => b.members.length - a.members.length)

  // Trier les membres dans chaque série par correct_predictions desc
  for (const s of series) {
    s.members.sort(
      (a, b) =>
        b.correct_predictions - a.correct_predictions ||
        b.exact_predictions - a.exact_predictions
    )
  }

  const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto max-w-2xl px-4 py-16 space-y-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Shield className="h-6 w-6 text-primary shrink-0" />
            <div className="min-w-0">
              <h1 className="text-2xl font-black uppercase tracking-tighter truncate">
                {league.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-bold">
                  {memberIds.length} membre{memberIds.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
          <Link
            href="/leagues"
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors shrink-0"
          >
            ← Ligues
          </Link>
        </div>

        {/* Actions (code d'invitation + quitter) */}
        <LeagueActions
          leagueId={league.id}
          inviteCode={league.invite_code}
          isOwner={league.owner_id === user.id}
          leagueName={league.name}
        />

        {/* Compétitions */}
        {series.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune compétition pour l&apos;instant. Les compétitions apparaîtront ici dès que
              des membres s&apos;inscriront.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Compétitions ({series.length})
            </h2>
            {series.map((serie) => (
              <div key={serie.serie_id} className="rounded-lg border border-border bg-card overflow-hidden">
                {/* Header compétition */}
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/50 bg-muted/20">
                  <p className="text-sm font-black uppercase tracking-tight truncate">
                    {serie.serie_name}
                  </p>
                  <Link
                    href={`/series/${serie.serie_id}`}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors shrink-0"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Voir
                  </Link>
                </div>

                {/* Classement membres */}
                <div className="divide-y divide-border/40">
                  {serie.members.map((member, index) => {
                    const profile = profileMap.get(member.user_id)
                    const rank = index + 1
                    const medal = MEDALS[rank]
                    const isMe = member.user_id === user.id
                    const avatarSrc = getAvatarSrc(profile?.avatar_url ?? null)

                    return (
                      <div
                        key={member.user_id}
                        className={`flex items-center gap-3 px-4 py-3 ${
                          isMe ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className="w-7 text-center shrink-0">
                          {medal ? (
                            <span className="text-base">{medal}</span>
                          ) : (
                            <span className="text-sm font-bold text-muted-foreground">
                              #{rank}
                            </span>
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
                        <span
                          className={`flex-1 text-sm font-bold truncate ${
                            isMe ? 'text-primary' : ''
                          }`}
                        >
                          {profile?.username ?? 'Joueur'}
                          {isMe && (
                            <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                              (vous)
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-1 text-green-500" title="Paris réussis">
                            <Target className="h-3.5 w-3.5" />
                            <span className="text-sm font-black tabular-nums">
                              {member.correct_predictions}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-primary" title="Scores exacts">
                            <Crosshair className="h-3.5 w-3.5" />
                            <span className="text-sm font-black tabular-nums">
                              {member.exact_predictions}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Membres non inscrits à cette compétition */}
                  {memberIds
                    .filter((id) => !serie.members.find((m) => m.user_id === id))
                    .map((uid) => {
                      const profile = profileMap.get(uid)
                      const isMe = uid === user.id
                      const avatarSrc = getAvatarSrc(profile?.avatar_url ?? null)
                      return (
                        <div
                          key={uid}
                          className={`flex items-center gap-3 px-4 py-3 opacity-40 ${
                            isMe ? 'bg-primary/5' : ''
                          }`}
                        >
                          <div className="w-7" />
                          <div className="h-8 w-8 rounded-lg overflow-hidden border border-border/40 bg-card flex items-center justify-center shrink-0">
                            {avatarSrc ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={avatarSrc}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </div>
                          <span className="flex-1 text-sm font-bold truncate text-muted-foreground">
                            {profile?.username ?? 'Joueur'}
                            {isMe && (
                              <span className="ml-1.5 text-[10px] font-normal">(vous)</span>
                            )}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Pas inscrit
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
