import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { User, Trophy } from 'lucide-react'

export default async function Navbar() {
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

  const displayName = profile?.username || user?.email

  return (
    <nav className="sticky top-0 z-50 border-b border-primary/20 bg-card/50 py-4 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between px-4">
        <Link href="/">
          <h1 className="text-2xl font-bold tracking-tighter text-primary cursor-pointer">
            PROJECT P
          </h1>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/leaderboard" className="hidden sm:flex items-center gap-1.5 text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
            <Trophy className="h-4 w-4" />
            Classement
          </Link>
          {user ? (
            <>
              <span className="text-sm font-medium hidden sm:block truncate max-w-[160px]">
                {displayName}
              </span>
              <Link href="/profile">
                <div className="relative h-9 w-9 rounded-xl overflow-hidden border-2 border-primary/30 hover:border-primary transition-colors bg-card flex items-center justify-center cursor-pointer">
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url.split('?')[0]}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </Link>
              <form action="/auth/signout" method="post">
                <Button variant="outline" size="sm" type="submit">
                  Sign Out
                </Button>
              </form>
            </>
          ) : (
            <Link href="/login">
              <Button variant="default" size="sm">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
