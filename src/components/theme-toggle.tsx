'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Evite le flash SSR
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-muted-foreground hover:bg-muted/10 hover:text-foreground transition-all border border-transparent"
    >
      {isDark ? (
        <>
          <Sun className="h-4 w-4 shrink-0" />
          Mode clair
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 shrink-0" />
          Mode sombre
        </>
      )}
    </button>
  )
}
