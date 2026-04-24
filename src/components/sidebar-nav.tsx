'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Trophy, BarChart2, Medal, Users, Shield } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Compétitions', icon: Trophy },
  { href: '/profile', label: 'Statistiques', icon: BarChart2 },
  { href: '/leaderboard', label: 'Classement', icon: Medal },
  { href: '/friends', label: 'Amis', icon: Users },
  { href: '/leagues', label: 'Ligues', icon: Shield },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-1 px-3">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold uppercase tracking-wide transition-all
              ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:bg-muted/10 hover:text-foreground border border-transparent'
              }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
