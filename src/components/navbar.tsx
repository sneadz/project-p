import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function Navbar() {
  const supabase = createClient()
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {}


  return (
    <nav className="sticky top-0 z-50 border-b border-primary/20 bg-card/50 py-4 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between px-4">
        <Link href="/">
          <h1 className="text-2xl font-bold tracking-tighter text-primary cursor-pointer">PROJECT P</h1>
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm font-medium hidden sm:block">{user.email}</span>
              <form action="/auth/signout" method="post">
                <Button variant="outline" size="sm" type="submit">Sign Out</Button>
              </form>
            </>
          ) : (
            <Link href="/login">
              <Button variant="default" size="sm">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
