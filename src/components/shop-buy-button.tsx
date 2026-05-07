'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { purchaseItem } from '@/app/actions/shop'
import { useToast } from '@/hooks/use-toast'

interface ShopBuyButtonProps {
  itemId: string
  price: number
  canAfford: boolean
}

export function ShopBuyButton({ itemId, price, canAfford }: ShopBuyButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleBuy = async () => {
    if (!canAfford) return
    setLoading(true)
    const result = await purchaseItem(itemId)
    if (result.error) {
      toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Achat réussi !' })
    }
    setLoading(false)
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleBuy}
      disabled={loading || !canAfford}
      className="text-[10px] font-black uppercase tracking-widest h-7 px-3"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : canAfford ? (
        `Acheter · ${price}`
      ) : (
        'Insuffisant'
      )}
    </Button>
  )
}
