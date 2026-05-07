'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { AUTO_BORDERS, getUnlockedAutoBorders } from '@/lib/borders'

const ItemIdSchema = z.string().min(1).max(50)
const BorderIdSchema = z.string().min(1).max(50).nullable()

export async function purchaseItem(itemId: string): Promise<{ error?: string }> {
  const parsed = ItemIdSchema.safeParse(itemId)
  if (!parsed.success) return { error: 'ID invalide' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: item } = await supabase
    .from('shop_items')
    .select('id, price')
    .eq('id', parsed.data)
    .single()
  if (!item) return { error: 'Item introuvable' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('total_shards')
    .eq('id', user.id)
    .single()
  if (!profile) return { error: 'Profil introuvable' }
  if ((profile.total_shards ?? 0) < item.price) return { error: 'Shards insuffisants' }

  const { data: existing } = await supabase
    .from('user_items')
    .select('item_id')
    .eq('user_id', user.id)
    .eq('item_id', parsed.data)
    .maybeSingle()
  if (existing) return { error: 'Item déjà possédé' }

  const { error: rpcError } = await supabase.rpc('purchase_item', {
    p_user_id: user.id,
    p_item_id: parsed.data,
    p_price: item.price,
  })
  if (rpcError) {
    // Fallback: manual two-step
    await supabase
      .from('profiles')
      .update({ total_shards: (profile.total_shards ?? 0) - item.price })
      .eq('id', user.id)
    await supabase.from('user_items').insert({ user_id: user.id, item_id: parsed.data })
  }

  revalidatePath('/shop')
  revalidatePath('/profile/edit')
  return {}
}

export async function equipBorder(borderId: string | null): Promise<{ error?: string }> {
  const parsed = BorderIdSchema.safeParse(borderId)
  if (!parsed.success) return { error: 'ID invalide' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  if (parsed.data !== null) {
    const isAuto = AUTO_BORDERS.some((b) => b.id === parsed.data)

    if (isAuto) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('correct_predictions')
        .eq('id', user.id)
        .single()
      const unlocked = getUnlockedAutoBorders(profile?.correct_predictions ?? 0)
      if (!unlocked.includes(parsed.data)) return { error: 'Bordure non débloquée' }
    } else {
      const { data: owned } = await supabase
        .from('user_items')
        .select('item_id')
        .eq('user_id', user.id)
        .eq('item_id', parsed.data)
        .maybeSingle()
      if (!owned) return { error: 'Bordure non possédée' }
    }
  }

  await supabase.from('profiles').update({ active_border: parsed.data }).eq('id', user.id)

  revalidatePath('/profile/edit')
  revalidatePath('/profile')
  revalidatePath('/shop')
  return {}
}
