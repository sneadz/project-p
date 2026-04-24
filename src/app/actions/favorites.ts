'use server'

import { createClient } from '@/lib/supabase/server'
import { searchTeams } from '@/lib/pandascore'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const MAX_FAVORITES = 5

const addSchema = z.object({
  teamId: z.number().int().positive(),
  teamName: z.string().min(1).max(100),
  teamImageUrl: z.string().url().nullable().optional(),
})

export async function addGlobalFavorite(
  teamId: number,
  teamName: string,
  teamImageUrl?: string | null
) {
  const parsed = addSchema.safeParse({ teamId, teamName, teamImageUrl })
  if (!parsed.success) return { error: 'Données invalides.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Vous devez être connecté.' }

  const { count } = await supabase
    .from('global_favorite_teams')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) >= MAX_FAVORITES) {
    return { error: `Maximum ${MAX_FAVORITES} équipes favorites.` }
  }

  const { error } = await supabase.from('global_favorite_teams').upsert(
    { user_id: user.id, team_id: teamId, team_name: teamName, team_image_url: teamImageUrl ?? null },
    { onConflict: 'user_id,team_id' }
  )

  if (error) return { error: error.message }
  revalidatePath('/')
  return { success: true }
}

export async function removeGlobalFavorite(teamId: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Vous devez être connecté.' }

  const { error } = await supabase
    .from('global_favorite_teams')
    .delete()
    .eq('user_id', user.id)
    .eq('team_id', teamId)

  if (error) return { error: error.message }
  revalidatePath('/')
  return { success: true }
}

export async function searchTeamsAction(query: string) {
  if (!query.trim() || query.length < 2) return []
  return searchTeams(query)
}

export async function refreshSerieStats(serieId: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non connecté' }

  const { getMatchesBySerie } = await import('@/lib/pandascore')
  const { calculateSerieStats } = await import('@/lib/scoring')

  const [matches, betsData] = await Promise.all([
    getMatchesBySerie(serieId).catch(() => []),
    supabase.from('bets').select('match_id, score').eq('user_id', user.id).eq('serie_id', serieId),
  ])

  const userBets = (betsData.data ?? []).reduce((acc, b) => {
    acc[b.match_id] = b.score
    return acc
  }, {} as Record<number, string>)

  const { correct, exact } = calculateSerieStats(matches, userBets)

  await supabase.from('registrations')
    .update({ correct_predictions: correct, exact_predictions: exact })
    .eq('user_id', user.id)
    .eq('serie_id', serieId)

  const { count: betterCount } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('serie_id', serieId)
    .gt('correct_predictions', correct)

  revalidatePath(`/series/${serieId}`)
  return { success: true, correct, exact, rank: (betterCount ?? 0) + 1 }
}
