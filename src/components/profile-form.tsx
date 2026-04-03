'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Check } from 'lucide-react'
import { AVATARS, getAvatarSrc } from '@/lib/avatars'

interface ProfileFormProps {
  userId: string
  initialUsername: string | null
  initialAvatarUrl: string | null
}

export function ProfileForm({ userId, initialUsername, initialAvatarUrl }: ProfileFormProps) {
  const [username, setUsername] = useState(initialUsername || '')
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(initialAvatarUrl)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()
  const router = useRouter()

  const handleSave = async () => {
    setLoading(true)

    const updates: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
      avatar_url: selectedAvatar,
    }
    if (username.trim()) updates.username = username.trim()

    const { error } = await supabase.from('profiles').upsert({ id: userId, ...updates })

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Profil mis à jour !' })
      router.refresh()
    }
    setLoading(false)
  }

  const currentAvatarSrc = getAvatarSrc(selectedAvatar)

  return (
    <div className="space-y-10">
      {/* Avatar actuel */}
      <div className="flex flex-col items-center gap-3">
        <div className="h-24 w-24 rounded-xl overflow-hidden border-2 border-primary/40 bg-card flex items-center justify-center">
          {currentAvatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentAvatarSrc}
              alt="Avatar sélectionné"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-3xl text-muted-foreground">?</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">Avatar sélectionné</span>
      </div>

      {/* Grille de sélection */}
      <div className="space-y-3">
        <Label>Choisir un avatar</Label>
        <div className="grid grid-cols-4 gap-3">
          {AVATARS.map((avatar) => {
            const isSelected = selectedAvatar === avatar.id
            return (
              <button
                key={avatar.id}
                onClick={() => setSelectedAvatar(avatar.id)}
                className={`relative h-16 w-16 mx-auto rounded-xl overflow-hidden border-2 transition-all duration-150
                  ${
                    isSelected
                      ? 'border-primary scale-110 shadow-[0_0_10px_2px] shadow-primary/40'
                      : 'border-border hover:border-primary/50 hover:scale-105'
                  }`}
                title={avatar.label}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatar.src} alt={avatar.label} className="h-full w-full object-cover" />
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Check className="h-4 w-4 text-white drop-shadow" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          D&apos;autres avatars seront disponibles prochainement.
        </p>
      </div>

      {/* Username */}
      <div className="space-y-2">
        <Label htmlFor="username">Pseudo</Label>
        <Input
          id="username"
          placeholder="Ton pseudo..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <Button
        onClick={handleSave}
        disabled={loading}
        className="w-full font-bold uppercase tracking-widest"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sauvegarder'}
      </Button>
    </div>
  )
}
