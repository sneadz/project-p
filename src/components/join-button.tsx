'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { joinCompetition } from '@/app/actions/competition'
import { useToast } from '@/hooks/use-toast'
import { Loader2, UserPlus } from 'lucide-react'

interface JoinButtonProps {
  serieId: number
  isJoined: boolean
  isLoggedIn: boolean
}

export function JoinButton({ serieId, isJoined, isLoggedIn }: JoinButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  if (isJoined) {
    return (
      <Button variant="secondary" disabled className="gap-2">
        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        Déjà inscrit
      </Button>
    )
  }

  const handleJoin = async () => {
    if (!isLoggedIn) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour participer à une compétition.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const result = await joinCompetition(serieId)
      if (result.error) {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Succès !",
          description: "Vous participez maintenant à cette compétition.",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleJoin} 
      disabled={loading}
      className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest px-8"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      Participer
    </Button>
  )
}
