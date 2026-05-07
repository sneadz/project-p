import type React from 'react'

export interface AutoBorder {
  id: string
  label: string
  threshold: number
  color: string
  glow: string
}

export interface PurchasableBorder {
  id: string
  label: string
  style: React.CSSProperties
}

export const AUTO_BORDERS: AutoBorder[] = [
  {
    id: 'border_bronze',
    label: 'Bronze',
    threshold: 10,
    color: '#d97706',
    glow: '0 0 8px #d9770655',
  },
  {
    id: 'border_silver',
    label: 'Argent',
    threshold: 25,
    color: '#94a3b8',
    glow: '0 0 8px #94a3b855',
  },
  {
    id: 'border_gold',
    label: 'Or',
    threshold: 50,
    color: '#eab308',
    glow: '0 0 10px #eab30855',
  },
  {
    id: 'border_diamond',
    label: 'Diamant',
    threshold: 100,
    color: '#67e8f9',
    glow: '0 0 16px #67e8f966, 0 0 4px #67e8f9aa',
  },
]

export const PURCHASABLE_BORDERS: PurchasableBorder[] = [
  {
    id: 'border_neon',
    label: 'Néon',
    style: {
      borderColor: 'transparent',
      background:
        'linear-gradient(#0a0a0a, #0a0a0a) padding-box, linear-gradient(135deg, #a855f7, #06b6d4, #ec4899) border-box',
      animation: 'neon-pulse 2s ease-in-out infinite',
    },
  },
  {
    id: 'border_phantom',
    label: 'Phantom',
    style: {
      borderColor: '#e2e8f0',
      animation: 'phantom-pulse 2.5s ease-in-out infinite',
    },
  },
]

export function getUnlockedAutoBorders(correctPredictions: number): string[] {
  return AUTO_BORDERS.filter((b) => correctPredictions >= b.threshold).map((b) => b.id)
}

export function getBorderStyle(borderId: string | null): React.CSSProperties {
  if (!borderId) return {}

  const auto = AUTO_BORDERS.find((b) => b.id === borderId)
  if (auto) {
    return { borderColor: auto.color, boxShadow: auto.glow }
  }

  const purchasable = PURCHASABLE_BORDERS.find((b) => b.id === borderId)
  if (purchasable) {
    return purchasable.style
  }

  return {}
}
