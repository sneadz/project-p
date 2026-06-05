'use client'

interface MatchWinRateBarProps {
  team1Id: number
  team2Id: number
  winRates: Record<number, number | null>
}

export function MatchWinRateBar({ team1Id, team2Id, winRates }: MatchWinRateBarProps) {
  const r1 = winRates[team1Id] ?? null
  const r2 = winRates[team2Id] ?? null
  if (r1 === null && r2 === null) return null

  const v1 = r1 ?? 50
  const v2 = r2 ?? 50
  const total = v1 + v2
  const pct1 = total > 0 ? Math.round((v1 / total) * 100) : 50
  const pct2 = 100 - pct1

  return (
    <div className="mt-5 space-y-1.5">
      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
        <span className="text-primary">{pct1}%</span>
        <span className="text-muted-foreground/60">Chance de victoire</span>
        <span className="text-muted-foreground">{pct2}%</span>
      </div>
      <div className="h-1 w-full rounded-full overflow-hidden bg-muted/20 flex">
        <div
          className="h-full bg-primary rounded-l-full transition-all duration-700"
          style={{ width: `${pct1}%` }}
        />
        <div
          className="h-full bg-muted-foreground/25 rounded-r-full transition-all duration-700"
          style={{ width: `${pct2}%` }}
        />
      </div>
    </div>
  )
}
