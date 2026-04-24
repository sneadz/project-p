'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const uuidSchema = z.object({ id: z.string().uuid() })

export async function sendFriendRequest(addresseeId: string) {
  const parsed = uuidSchema.safeParse({ id: addresseeId })
  if (!parsed.success) return { error: 'ID invalide.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Vous devez être connecté.' }
  if (user.id === addresseeId) return { error: 'Vous ne pouvez pas vous ajouter vous-même.' }

  const { error } = await supabase.from('friendships').insert({
    requester_id: user.id,
    addressee_id: addresseeId,
    status: 'pending',
  })

  if (error) {
    if (error.code === '23505') return { error: 'Demande déjà envoyée.' }
    return { error: "Erreur lors de l'envoi de la demande." }
  }

  revalidatePath('/friends')
  return { success: true }
}

export async function acceptFriendRequest(friendshipId: string) {
  const parsed = uuidSchema.safeParse({ id: friendshipId })
  if (!parsed.success) return { error: 'ID invalide.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Vous devez être connecté.' }

  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId)
    .eq('addressee_id', user.id)
    .eq('status', 'pending')

  if (error) return { error: "Erreur lors de l'acceptation." }

  revalidatePath('/friends')
  return { success: true }
}

export async function declineFriendRequest(friendshipId: string) {
  const parsed = uuidSchema.safeParse({ id: friendshipId })
  if (!parsed.success) return { error: 'ID invalide.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Vous devez être connecté.' }

  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
    .eq('addressee_id', user.id)

  if (error) return { error: 'Erreur lors du refus.' }

  revalidatePath('/friends')
  return { success: true }
}

export async function removeFriend(friendshipId: string) {
  const parsed = uuidSchema.safeParse({ id: friendshipId })
  if (!parsed.success) return { error: 'ID invalide.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Vous devez être connecté.' }

  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  if (error) return { error: 'Erreur lors de la suppression.' }

  revalidatePath('/friends')
  return { success: true }
}
