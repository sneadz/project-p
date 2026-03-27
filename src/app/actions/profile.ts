'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(username: string, avatarUrl?: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Non connecté' }

  const updates: Record<string, string> = { updated_at: new Date().toISOString() }
  if (username.trim()) updates.username = username.trim()
  if (avatarUrl) updates.avatar_url = avatarUrl

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, ...updates })

  if (error) return { error: error.message }

  revalidatePath('/profile')
  revalidatePath('/', 'layout')
  return { success: true }
}
