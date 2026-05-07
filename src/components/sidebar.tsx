import { createClient } from '@/lib/supabase/server'
import { AvatarWithBorder } from '@/components/avatar-with-border'
import { SidebarNav } from '@/components/sidebar-nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogOut } from 'lucide-react'
import Link from 'next/link'

export default async function Sidebar() {
  const supabase = await createClient()
  let user = null
  let profile = null

  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
    if (user) {
      const { data: p } = await supabase
        .from('profiles')
        .select('username, avatar_url, active_border')
        .eq('id', user.id)
        .single()
      profile = p
    }
  } catch {}

  const displayName = profile?.username || user?.email?.split('@')[0] || 'Invité'

  return (
    <aside className="flex flex-col w-64 h-full rounded-2xl bg-card backdrop-blur-sm shrink-0 overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.10)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-border/50">
        <Link href="/">
          <div className="flex items-center gap-3 h-10">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 shadow-[0_0_12px_0px] shadow-primary/20 shrink-0">
              <span
                className="text-xs font-bold text-primary leading-none"
                style={{ fontFamily: 'var(--font-oxanium)' }}
              >
                G.GG
              </span>
            </div>
            <span
              className="text-4xl font-bold text-foreground tracking-tight leading-none"
              style={{ fontFamily: 'var(--font-oxanium)' }}
            >
              GRIND<span className="text-primary">.GG</span>
            </span>
          </div>
        </Link>
      </div>

      {/* Profil */}
      <Link
        href="/profile"
        className="group flex flex-col items-center gap-3 px-4 py-5 border-b border-border/50 hover:bg-muted/10 transition-colors"
      >
        <AvatarWithBorder
          avatarId={profile?.avatar_url ?? null}
          borderId={profile?.active_border ?? null}
          size="xl"
          alt="Avatar"
        />
        <p className="text-sm font-bold truncate">{displayName}</p>
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

      {/* Theme toggle + Sign out */}
      <div className="px-3 py-4 border-t border-border/50 space-y-1">
        <ThemeToggle />
        {user && (
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all border border-transparent"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Déconnexion
            </button>
          </form>
        )}
      </div>
    </aside>
  )
}
