'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { equipBorder } from '@/app/actions/shop'
import { useToast } from '@/hooks/use-toast'

interface ShopEquipButtonProps {
  borderId: string | null
}

export function ShopEquipButton({ borderId }: ShopEquipButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleEquip = async () => {
    setLoading(true)
    const result = await equipBorder(borderId)
    if (result.error) {
      toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Bordure équipée !' })
    }
    setLoading(false)
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleEquip}
      disabled={loading}
      className="text-[10px] font-black uppercase tracking-widest h-7 px-3"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Équiper'}
    </Button>
  )
}
