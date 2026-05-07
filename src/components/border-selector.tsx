'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { AUTO_BORDERS, PURCHASABLE_BORDERS, getUnlockedAutoBorders } from '@/lib/borders'
import { AvatarWithBorder } from '@/components/avatar-with-border'
import { equipBorder } from '@/app/actions/shop'
import { useToast } from '@/hooks/use-toast'

interface BorderSelectorProps {
  correctPredictions: number
  ownedBorderIds: string[]
  activeBorderId: string | null
  avatarId: string | null
}

export function BorderSelector({
  correctPredictions,
  ownedBorderIds,
  activeBorderId,
  avatarId,
}: BorderSelectorProps) {
  const [selected, setSelected] = useState<string | null>(activeBorderId)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const unlockedAutoIds = getUnlockedAutoBorders(correctPredictions)
  const availableBorders = [
    ...AUTO_BORDERS.filter((b) => unlockedAutoIds.includes(b.id)).map((b) => ({
      id: b.id,
      label: b.label,
    })),
    ...PURCHASABLE_BORDERS.filter((b) => ownedBorderIds.includes(b.id)).map((b) => ({
      id: b.id,
      label: b.label,
    })),
  ]

  const handleSelect = async (borderId: string | null) => {
    setSelected(borderId)
    setLoading(true)
    const result = await equipBorder(borderId)
    if (result.error) {
      toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
      setSelected(activeBorderId)
    } else {
      toast({ title: 'Bordure équipée !' })
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <p className="text-sm font-bold text-muted-foreground">Prévisualisation</p>
        {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>
      <div className="flex justify-center">
        <AvatarWithBorder avatarId={avatarId} borderId={selected} size="xl" />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2">
        <button
          onClick={() => handleSelect(null)}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${
            selected === null
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:border-primary/50'
          }`}
        >
          <div className="h-8 w-8 rounded-lg border-2 border-dashed border-current flex items-center justify-center">
            <span className="text-[10px]">∅</span>
          </div>
          Aucune
        </button>

        {availableBorders.map((border) => (
          <button
            key={border.id}
            onClick={() => handleSelect(border.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${
              selected === border.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            <AvatarWithBorder avatarId={avatarId} borderId={border.id} size="sm" />
            {border.label}
          </button>
        ))}
      </div>

      {availableBorders.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Aucune bordure débloquée. Réussis 10 paris ou visite la boutique.
        </p>
      )}
    </div>
  )
}
