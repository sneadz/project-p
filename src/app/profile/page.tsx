import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Pencil, User } from 'lucide-react'
import { getAvatarSrc } from '@/lib/avatars'

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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto max-w-2xl px-4 py-16 space-y-10">

        {/* Header profil */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-primary/40 bg-card flex items-center justify-center shrink-0">
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
            </div>

            {/* Infos */}
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">{displayName}</h1>
              {profile?.username && (
                <p className="text-sm text-muted-foreground">{user.email}</p>
              )}
            </div>
          </div>

          {/* Bouton édition */}
          <Link href="/profile/edit">
            <Button variant="outline" size="sm" className="gap-2">
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </Button>
          </Link>
        </div>

        {/* Séparateur */}
        <div className="border-t border-border" />

        {/* Stats — à venir */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold uppercase tracking-wider text-muted-foreground">Statistiques</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Paris placés', value: '—' },
              { label: 'Paris gagnés', value: '—' },
              { label: 'Taux de réussite', value: '—' },
              { label: 'Points totaux', value: '—' },
              { label: 'Meilleure série', value: '—' },
              { label: 'Rang global', value: '—' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-border bg-card p-4 space-y-1"
              >
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                <p className="text-2xl font-black text-primary">{stat.value}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2">
            Les statistiques seront disponibles prochainement.
          </p>
        </div>

      </section>
    </main>
  )
}
