import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMatchesBySerie } from '@/lib/pandascore'
import { calculateSerieStats } from '@/lib/scoring'

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return auth === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const serieIdParam = searchParams.get('serie_id')

  try {
    const supabase = createAdminClient()

    // Récupérer les série IDs à traiter
    let serieIds: number[]
    if (serieIdParam) {
      serieIds = [parseInt(serieIdParam)]
    } else {
      const { data: regs } = await supabase.from('registrations').select('serie_id')
      serieIds = [...new Set((regs ?? []).map((r: { serie_id: number }) => r.serie_id))]
    }

    const affectedUserIds = new Set<string>()
    const results: { serie_id: number; updated: number; skipped: boolean }[] = []

    for (const serieId of serieIds) {
      // Récupérer les matchs - skip si aucun match terminé
      const matches = await getMatchesBySerie(serieId).catch(() => [])
      if (!matches.some((m) => m.status === 'finished')) {
        results.push({ serie_id: serieId, updated: 0, skipped: true })
        continue
      }

      // Récupérer toutes les inscriptions + tous les bets de la série en parallèle
      const [{ data: registrations }, { data: allBets }] = await Promise.all([
        supabase.from('registrations').select('user_id').eq('serie_id', serieId),
        supabase.from('bets').select('user_id, match_id, score').eq('serie_id', serieId),
      ])

      if (!registrations || registrations.length === 0) continue

      // Grouper les bets par user_id
      const betsByUser: Record<string, Record<number, string>> = {}
      for (const bet of allBets ?? []) {
        if (!betsByUser[bet.user_id]) betsByUser[bet.user_id] = {}
        betsByUser[bet.user_id][bet.match_id] = bet.score
      }

      // Calculer les stats et mettre à jour chaque inscription
      await Promise.all(
        registrations.map(async (reg: { user_id: string }) => {
          const userBets = betsByUser[reg.user_id] ?? {}
          const { correct, exact } = calculateSerieStats(matches, userBets)
          await supabase
            .from('registrations')
            .update({ correct_predictions: correct, exact_predictions: exact })
            .eq('user_id', reg.user_id)
            .eq('serie_id', serieId)
          affectedUserIds.add(reg.user_id)
        })
      )

      results.push({ serie_id: serieId, updated: registrations.length, skipped: false })
    }

    // Recalculer les stats globales des profils impactés
    let profilesUpdated = 0
    if (affectedUserIds.size > 0) {
      const userIds = [...affectedUserIds]

      // Sommer les stats de toutes les séries pour chaque user
      const { data: allRegs } = await supabase
        .from('registrations')
        .select('user_id, correct_predictions, exact_predictions')
        .in('user_id', userIds)

      const statsByUser: Record<string, { correct: number; exact: number }> = {}
      for (const reg of allRegs ?? []) {
        if (!statsByUser[reg.user_id]) statsByUser[reg.user_id] = { correct: 0, exact: 0 }
        statsByUser[reg.user_id].correct += reg.correct_predictions ?? 0
        statsByUser[reg.user_id].exact += reg.exact_predictions ?? 0
      }

      await Promise.all(
        Object.entries(statsByUser).map(([userId, stats]) =>
          supabase
            .from('profiles')
            .update({
              correct_predictions: stats.correct,
              exact_predictions: stats.exact,
              total_shards: stats.correct + stats.exact,
              shards_earned: stats.correct + stats.exact,
            })
            .eq('id', userId)
        )
      )

      profilesUpdated = userIds.length
    }

    return NextResponse.json({ ok: true, series: results, profiles_updated: profilesUpdated })
  } catch (err) {
    console.error('[cron/score]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
