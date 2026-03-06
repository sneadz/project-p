'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function joinCompetition(serieId: number) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Vous devez être connecté pour participer.' }
  }

  const { error } = await supabase
    .from('registrations')
    .insert({
      user_id: user.id,
      serie_id: serieId,
      email: user.email
    })

  if (error) {
    console.error('Error joining competition:', error)
    return { error: 'Une erreur est survenue lors de l\'inscription.' }
  }

  revalidatePath(`/series/${serieId}`)
  return { success: true }
}

export async function placeBet(matchId: number, serieId: number, score: string) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Vous devez être connecté pour parier.' }
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

  const { error } = await supabase
    .from('bets')
    .upsert({
      user_id: user.id,
      match_id: matchId,
      serie_id: serieId,
      score: score,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,match_id'
    })

  if (error) {
    console.error('Error placing bet:', error)
    return { error: 'Une erreur est survenue lors du pari.' }
  }

  revalidatePath(`/series/${serieId}`)
  return { success: true }
}
