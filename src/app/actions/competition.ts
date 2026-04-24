'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getMatchById } from '@/lib/pandascore'
import { z } from 'zod'

const betSchema = z.object({
  matchId: z.number().int().positive(),
  serieId: z.number().int().positive(),
  score: z.string().regex(/^\d+-\d+$/, 'Format de score invalide (ex: 2-1)'),
})

const joinSchema = z.object({
  serieId: z.number().int().positive(),
})

const favoriteTeamSchema = z.object({
  serieId: z.number().int().positive(),
  teamId: z.number().int().positive(),
  teamName: z.string().min(1).max(100),
  teamImageUrl: z.string().url().nullable().optional(),
})

export async function joinCompetition(serieId: number) {
  const parsed = joinSchema.safeParse({ serieId })
  if (!parsed.success) return { error: 'Données invalides.' }
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Vous devez être connecté pour participer.' }
  }

  const { error } = await supabase.from('registrations').insert({
    user_id: user.id,
    serie_id: serieId,
    email: user.email,
  })

  if (error) {
    console.error('Error joining competition:', error)
    return { error: "Une erreur est survenue lors de l'inscription." }
  }

  revalidatePath(`/series/${serieId}`)
  return { success: true }
}

export async function placeBet(matchId: number, serieId: number, score: string) {
  const parsed = betSchema.safeParse({ matchId, serieId, score })
  if (!parsed.success) return { error: 'Données invalides.' }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Vous devez être connecté pour parier.' }
  }

  // Vérifier le statut réel du match côté PandaScore
  const match = await getMatchById(matchId)
  if (match && (match.status === 'running' || match.status === 'finished')) {
    revalidatePath(`/series/${serieId}`)
    return { error: 'MATCH_STARTED' }
  }

  // Vérifier si l'utilisateur est inscrit à la compétition
  const { data: registration, error: regError } = await supabase
    .from('registrations')
    .select('id')
    .eq('user_id', user.id)
    .eq('serie_id', serieId)
    .single()

  if (regError || !registration) {
    return { error: 'Vous devez participer à la compétition pour parier.' }
  }

  const { error } = await supabase.from('bets').upsert(
    {
      user_id: user.id,
      match_id: matchId,
      serie_id: serieId,
      score,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,match_id',
    }
  )

  if (error) {
    console.error('Error placing bet:', error)
    return { error: 'Une erreur est survenue lors du pari.' }
  }

  revalidatePath(`/series/${serieId}`)
  return { success: true }
}

export async function setFavoriteTeam(
  serieId: number,
  teamId: number,
  teamName: string,
  teamImageUrl?: string | null
) {
  const parsed = favoriteTeamSchema.safeParse({ serieId, teamId, teamName, teamImageUrl })
  if (!parsed.success) return { error: 'Données invalides.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Vous devez être connecté.' }

  const { error } = await supabase.from('favorite_teams').upsert(
    {
      user_id: user.id,
      serie_id: serieId,
      team_id: teamId,
      team_name: teamName,
      team_image_url: teamImageUrl ?? null,
    },
    { onConflict: 'user_id,serie_id' }
  )

  if (error) return { error: error.message }
  revalidatePath(`/series/${serieId}`)
  return { success: true }
}
