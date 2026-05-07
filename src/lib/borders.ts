import type React from 'react'

export interface AutoBorder {
  id: string
  label: string
  threshold: number
  style: string
  glowStyle?: string
}

export interface PurchasableBorder {
  id: string
  label: string
  style: string
  animationStyle?: React.CSSProperties
}

export const AUTO_BORDERS: AutoBorder[] = [
  {
    id: 'border_bronze',
    label: 'Bronze',
    threshold: 10,
    style: 'border-amber-700',
  },
  {
    id: 'border_silver',
    label: 'Argent',
    threshold: 25,
    style: 'border-slate-400',
  },
  {
    id: 'border_gold',
    label: 'Or',
    threshold: 50,
    style: 'border-yellow-400',
    glowStyle: '0 0 10px #eab30855',
  },
  {
    id: 'border_diamond',
    label: 'Diamant',
    threshold: 100,
    style: 'border-cyan-400',
    glowStyle: '0 0 16px #67e8f966, 0 0 4px #67e8f9aa',
  },
]

export const PURCHASABLE_BORDERS: PurchasableBorder[] = [
  {
    id: 'border_neon',
    label: 'Néon',
    style: 'border-transparent',
    animationStyle: {
      background:
        'linear-gradient(#0a0a0a, #0a0a0a) padding-box, linear-gradient(135deg, #a855f7, #06b6d4, #ec4899) border-box',
      animation: 'neon-pulse 2s ease-in-out infinite',
    },
  },
  {
    id: 'border_phantom',
    label: 'Phantom',
    style: 'border-slate-200',
    animationStyle: {
      animation: 'phantom-pulse 2.5s ease-in-out infinite',
    },
  },
]

export function getUnlockedAutoBorders(correctPredictions: number): string[] {
  return AUTO_BORDERS.filter((b) => correctPredictions >= b.threshold).map((b) => b.id)
}

export function getBorderClasses(borderId: string | null): {
  className: string
  style?: React.CSSProperties
} {
  if (!borderId) return { className: 'border-primary/40' }

  const auto = AUTO_BORDERS.find((b) => b.id === borderId)
  if (auto) {
    return {
      className: auto.style,
      style: auto.glowStyle ? { boxShadow: auto.glowStyle } : undefined,
    }
  }

  const purchasable = PURCHASABLE_BORDERS.find((b) => b.id === borderId)
  if (purchasable) {
    return {
      className: purchasable.style,
      style: purchasable.animationStyle,
    }
  }

  return { className: 'border-primary/40' }
}
