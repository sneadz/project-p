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

  const supabase = createClient()
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
  const supabase = createClient()
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
