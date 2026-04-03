import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/profile-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function ProfileEditPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url, hide_cs2, hide_valorant')
    .eq('id', user.id)
    .single()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto max-w-md px-4 py-16">
        {/* Header */}
        <div className="mb-10 space-y-4">
          <Link href="/profile">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au profil
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Modifier le profil</h1>
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <ProfileForm
          userId={user.id}
          initialUsername={profile?.username ?? null}
          initialAvatarUrl={profile?.avatar_url ?? null}
          initialHideCs2={profile?.hide_cs2 ?? false}
          initialHideValorant={profile?.hide_valorant ?? false}
        />
      </section>
    </main>
  )
}
