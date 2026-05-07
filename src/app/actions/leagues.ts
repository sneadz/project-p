'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createLeagueSchema = z.object({
  name: z.string().min(1).max(50),
})

const joinLeagueSchema = z.object({
  inviteCode: z.string().min(1).max(20),
})

const leaveLeagueSchema = z.object({
  leagueId: z.string().uuid(),
})

export async function createLeague(name: string) {
  const parsed = createLeagueSchema.safeParse({ name })
  if (!parsed.success) return { error: 'Nom invalide.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Vous devez être connecté.' }

  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .insert({ name: parsed.data.name, owner_id: user.id })
    .select('id')
    .single()

  if (leagueError || !league) return { error: 'Erreur lors de la création de la ligue.' }

  await supabase.from('league_members').insert({ league_id: league.id, user_id: user.id })

  revalidatePath('/leagues')
  return { success: true, leagueId: league.id }
}

export async function joinLeague(inviteCode: string) {
  const parsed = joinLeagueSchema.safeParse({ inviteCode })
  if (!parsed.success) return { error: 'Code invalide.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Vous devez être connecté.' }

  const { data: league } = await supabase
    .from('leagues')
    .select('id')
    .eq('invite_code', parsed.data.inviteCode.toLowerCase())
    .single()

  if (!league) return { error: "Code d'invitation invalide." }

  const { data: alreadyMember } = await supabase
    .from('league_members')
    .select('league_id')
    .eq('league_id', league.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (alreadyMember) return { error: 'Vous êtes déjà membre de cette ligue.' }

  const { error } = await supabase
    .from('league_members')
    .insert({ league_id: league.id, user_id: user.id })

  if (error) return { error: "Erreur lors de l'adhésion." }

  revalidatePath('/leagues')
  return { success: true, leagueId: league.id }
}

export async function leaveLeague(leagueId: string) {
  const parsed = leaveLeagueSchema.safeParse({ leagueId })
  if (!parsed.success) return { error: 'ID invalide.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Vous devez être connecté.' }

  const { data: league } = await supabase
    .from('leagues')
    .select('owner_id')
    .eq('id', leagueId)
    .single()

  if (league?.owner_id === user.id) return { error: 'Le propriétaire ne peut pas quitter la ligue, il doit la dissoudre.' }

  const { error } = await supabase
    .from('league_members')
    .delete()
    .eq('league_id', leagueId)
    .eq('user_id', user.id)

  if (error) return { error: 'Erreur lors de la sortie de la ligue.' }

  revalidatePath('/leagues')
  return { success: true }
}

export async function dissolveLeague(leagueId: string) {
  const parsed = leaveLeagueSchema.safeParse({ leagueId })
  if (!parsed.success) return { error: 'ID invalide.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Vous devez être connecté.' }

  const { data: league } = await supabase
    .from('leagues')
    .select('owner_id')
    .eq('id', leagueId)
    .single()

  if (!league || league.owner_id !== user.id) return { error: 'Vous n\'êtes pas le propriétaire de cette ligue.' }

  const { error } = await supabase.from('leagues').delete().eq('id', leagueId)

  if (error) return { error: 'Erreur lors de la dissolution de la ligue.' }

  revalidatePath('/leagues')
  return { success: true }
}
