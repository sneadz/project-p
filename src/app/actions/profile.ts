'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Minimum 3 caractères')
    .max(30, 'Maximum 30 caractères')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Caractères autorisés : lettres, chiffres, _ et -'),
  avatarUrl: z.string().url().optional(),
})

export async function updateProfile(username: string, avatarUrl?: string) {
  const parsed = updateProfileSchema.safeParse({ username, avatarUrl })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Non connecté' }

  const updates: Record<string, string> = { updated_at: new Date().toISOString() }
  if (username.trim()) updates.username = username.trim()
  if (avatarUrl) updates.avatar_url = avatarUrl

  const { error } = await supabase.from('profiles').upsert({ id: user.id, ...updates })

  if (error) return { error: error.message }

  revalidatePath('/profile')
  revalidatePath('/', 'layout')
  return { success: true }
}
