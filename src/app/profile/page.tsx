import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/profile-form'

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto max-w-md px-4 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-black uppercase tracking-tighter">Mon profil</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <ProfileForm
          userId={user.id}
          initialUsername={profile?.username ?? null}
          initialAvatarUrl={profile?.avatar_url ?? null}
        />
      </section>
    </main>
  )
}
