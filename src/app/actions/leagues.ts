'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createLeagueSchema = z.object({
  name: z.string().min(1).max(50),
  serieId: z.number().int().positive(),
})

const joinLeagueSchema = z.object({
  inviteCode: z.string().min(1).max(20),
})

const leaveLeagueSchema = z.object({
  leagueId: z.string().uuid(),
})

export async function createLeague(name: string, serieId: number) {
  const parsed = createLeagueSchema.safeParse({ name, serieId })
  if (!parsed.success) return { error: 'Données invalides.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Vous devez être connecté.' }

  // Vérifier que l'user est inscrit à la série
  const { data: reg } = await supabase
    .from('registrations')
    .select('id')
    .eq('user_id', user.id)
    .eq('serie_id', serieId)
    .single()

  if (!reg) return { error: 'Vous devez être inscrit à la compétition pour créer une ligue.' }

  // Vérifier qu'il n'est pas déjà dans une ligue sur cette série
  const { data: existing } = await supabase
    .from('league_members')
    .select('league_id, leagues!inner(serie_id)')
    .eq('user_id', user.id)
    .eq('leagues.serie_id', serieId)
    .maybeSingle()

  if (existing) return { error: 'Vous êtes déjà dans une ligue pour cette compétition.' }

  // Créer la ligue
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .insert({ name: parsed.data.name, serie_id: serieId, owner_id: user.id })
    .select('id')
    .single()

  if (leagueError || !league) return { error: 'Erreur lors de la création de la ligue.' }

  // Ajouter le créateur comme membre
  await supabase.from('league_members').insert({ league_id: league.id, user_id: user.id })

  revalidatePath(`/series/${serieId}`)
  revalidatePath('/leagues')
  return { success: true }
}

export async function joinLeague(inviteCode: string, serieId: number) {
  const parsed = joinLeagueSchema.safeParse({ inviteCode })
  if (!parsed.success) return { error: 'Code invalide.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Vous devez être connecté.' }

  // Vérifier que l'user est inscrit à la série
  const { data: reg } = await supabase
    .from('registrations')
    .select('id')
    .eq('user_id', user.id)
    .eq('serie_id', serieId)
    .single()

  if (!reg) return { error: 'Vous devez être inscrit à la compétition pour rejoindre une ligue.' }

  // Trouver la ligue par code
  const { data: league } = await supabase
    .from('leagues')
    .select('id, serie_id')
    .eq('invite_code', parsed.data.inviteCode.toLowerCase())
    .single()

  if (!league) return { error: 'Code d\'invitation invalide.' }
  if (league.serie_id !== serieId) return { error: 'Ce code est pour une autre compétition.' }

  // Vérifier qu'il n'est pas déjà membre
  const { data: alreadyMember } = await supabase
    .from('league_members')
    .select('league_id')
    .eq('league_id', league.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (alreadyMember) return { error: 'Vous êtes déjà membre de cette ligue.' }

  // Vérifier qu'il n'est pas dans une autre ligue sur cette série
  const { data: otherLeague } = await supabase
    .from('league_members')
    .select('league_id, leagues!inner(serie_id)')
    .eq('user_id', user.id)
    .eq('leagues.serie_id', serieId)
    .maybeSingle()

  if (otherLeague) return { error: 'Vous êtes déjà dans une ligue pour cette compétition.' }

  const { error } = await supabase
    .from('league_members')
    .insert({ league_id: league.id, user_id: user.id })

  if (error) return { error: 'Erreur lors de l\'adhésion.' }

  revalidatePath(`/series/${serieId}`)
  revalidatePath('/leagues')
  return { success: true }
}

export async function leaveLeague(leagueId: string, serieId: number) {
  const parsed = leaveLeagueSchema.safeParse({ leagueId })
  if (!parsed.success) return { error: 'ID invalide.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Vous devez être connecté.' }

  const { error } = await supabase
    .from('league_members')
    .delete()
    .eq('league_id', leagueId)
    .eq('user_id', user.id)

  if (error) return { error: 'Erreur lors de la sortie de la ligue.' }

  revalidatePath(`/series/${serieId}`)
  revalidatePath('/leagues')
  return { success: true }
}
