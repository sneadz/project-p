'use client'

import { useEffect } from 'react'

interface ScrollToUpcomingProps {
  matchId: number | null
}

export function ScrollToUpcoming({ matchId }: ScrollToUpcomingProps) {
  useEffect(() => {
    if (matchId) {
      // Un petit délai pour s'assurer que le rendu est terminé et que les styles sont appliqués
      const timer = setTimeout(() => {
        const element = document.getElementById(`match-${matchId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [matchId])

  return null
}
