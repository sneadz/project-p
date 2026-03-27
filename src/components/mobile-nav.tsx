'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Trophy, BarChart2, User } from 'lucide-react'

const navItems = [
  { href: '/',        label: 'Compétitions', icon: Trophy    },
  { href: '/profile', label: 'Statistiques', icon: BarChart2 },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-card/90 backdrop-blur">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-6 py-1.5 rounded-lg transition-colors
                ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
