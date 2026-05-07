'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Check, EyeOff, Lock } from 'lucide-react'
import { AVATARS, getAvatarSrc } from '@/lib/avatars'
import { BorderSelector } from '@/components/border-selector'

interface ProfileFormProps {
  userId: string
  initialUsername: string | null
  initialAvatarUrl: string | null
  initialHideCs2?: boolean
  initialHideValorant?: boolean
  initialActiveBorder: string | null
  correctPredictions: number
  ownedItemIds: string[]
}

export function ProfileForm({
  userId,
  initialUsername,
  initialAvatarUrl,
  initialHideCs2 = false,
  initialHideValorant = false,
  initialActiveBorder,
  correctPredictions,
  ownedItemIds,
}: ProfileFormProps) {
  const [username, setUsername] = useState(initialUsername || '')
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(initialAvatarUrl)
  const [hideCs2, setHideCs2] = useState(initialHideCs2)
  const [hideValorant, setHideValorant] = useState(initialHideValorant)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()
  const router = useRouter()

  const handleSave = async () => {
    setLoading(true)
    const updates: Record<string, string | null | boolean> = {
      updated_at: new Date().toISOString(),
      avatar_url: selectedAvatar,
      hide_cs2: hideCs2,
      hide_valorant: hideValorant,
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
            const isPremium = avatar.premium === true
            const isUnlocked = !isPremium || ownedItemIds.includes(avatar.id)
            return (
              <button
                key={avatar.id}
                onClick={() => isUnlocked && setSelectedAvatar(avatar.id)}
                disabled={!isUnlocked}
                className={`relative h-16 w-16 mx-auto rounded-xl overflow-hidden border-2 transition-all duration-150
                  ${
                    isUnlocked
                      ? isSelected
                        ? 'border-primary scale-110 shadow-[0_0_10px_2px] shadow-primary/40'
                        : 'border-border hover:border-primary/50 hover:scale-105'
                      : 'border-border/30 opacity-40 cursor-not-allowed'
                  }`}
                title={avatar.label}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatar.src} alt={avatar.label} className="h-full w-full object-cover" />
                {isSelected && isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Check className="h-4 w-4 text-white drop-shadow" />
                  </div>
                )}
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Lock className="h-3 w-3 text-white/60" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Les avatars verrouillés sont disponibles en boutique.
        </p>
      </div>

      {/* Bordures */}
      <div className="space-y-3">
        <Label>Bordure</Label>
        <BorderSelector
          correctPredictions={correctPredictions}
          ownedBorderIds={ownedItemIds.filter((id) => id.startsWith('border_'))}
          activeBorderId={initialActiveBorder}
          avatarId={selectedAvatar}
        />
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

      {/* Filtres jeux */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
          Masquer un jeu
        </Label>
        <p className="text-xs text-muted-foreground -mt-1">
          Les compétitions masquées restent visibles si une de tes équipes favorites y joue.
        </p>
        <div className="flex flex-col gap-2">
          {[
            { label: 'CS2', value: hideCs2, set: setHideCs2, color: 'blue' },
            { label: 'Valorant', value: hideValorant, set: setHideValorant, color: 'red' },
          ].map(({ label, value, set, color }) => (
            <button
              key={label}
              type="button"
              onClick={() => set(!value)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm font-bold ${
                value
                  ? 'bg-muted/30 border-muted/40 text-muted-foreground'
                  : color === 'blue'
                    ? 'bg-blue-500/5 border-blue-500/30 text-blue-400'
                    : 'bg-red-500/5 border-red-500/30 text-red-400'
              }`}
            >
              <span>{label}</span>
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${
                  value ? 'text-muted-foreground' : 'text-green-500'
                }`}
              >
                {value ? 'Masqué' : 'Affiché'}
              </span>
            </button>
          ))}
        </div>
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
