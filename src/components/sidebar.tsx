import { createClient } from '@/lib/supabase/server'
import { getAvatarSrc } from '@/lib/avatars'
import { SidebarNav } from '@/components/sidebar-nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { User, LogOut } from 'lucide-react'
import Link from 'next/link'

export default async function Sidebar() {
  const supabase = createClient()
  let user = null
  let profile = null

  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
    if (user) {
      const { data: p } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single()
      profile = p
    }
  } catch {}

  const displayName = profile?.username || user?.email?.split('@')[0] || 'Invité'
  const avatarSrc = getAvatarSrc(profile?.avatar_url)

  return (
    <aside className="flex flex-col w-64 h-full rounded-2xl bg-card backdrop-blur-sm shrink-0 overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.10)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.5)]">

      {/* Logo */}
      <div className="px-6 py-6 border-b border-border/50">
        <Link href="/">
          <span className="text-xl font-black tracking-tighter text-primary cursor-pointer">
            PROJECT P
          </span>
        </Link>
      </div>

      {/* Profil */}
      <Link href="/profile" className="group flex items-center gap-3 px-5 py-4 border-b border-border/50 hover:bg-muted/10 transition-colors">
        <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary/30 group-hover:border-primary/60 transition-colors bg-background flex items-center justify-center shrink-0">
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarSrc} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <User className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{displayName}</p>
          {profile?.username && (
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          )}
        </div>
      </Link>

      {/* Navigation */}
      <div className="flex-1 py-4">
        {user ? (
          <SidebarNav />
        ) : (
          <div className="px-5">
            <Link
              href="/login"
              className="flex items-center justify-center w-full rounded-lg bg-primary py-2 text-sm font-bold uppercase tracking-wide text-primary-foreground"
            >
              Se connecter
            </Link>
          </div>
        )}
      </div>

      {/* Sign out */}
      {/* Theme toggle + Sign out */}
      <div className="px-3 py-4 border-t border-border/50 space-y-1">
        <ThemeToggle />
        {user && <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all border border-transparent"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Déconnexion
            </button>
          </form>}
      </div>
    </aside>
  )
}
