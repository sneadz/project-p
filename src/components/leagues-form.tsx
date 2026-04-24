'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createLeague, joinLeague } from '@/app/actions/leagues'

export function LeaguesForm() {
  const [leagueName, setLeagueName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleCreate = () => {
    if (!leagueName.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await createLeague(leagueName.trim())
      if (result.error) {
        setError(result.error)
      } else {
        router.push(`/leagues/${result.leagueId}`)
      }
    })
  }

  const handleJoin = () => {
    if (!inviteCode.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await joinLeague(inviteCode.trim())
      if (result.error) {
        setError(result.error)
      } else {
        router.push(`/leagues/${result.leagueId}`)
      }
    })
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive font-medium">{error}</p>}

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">Créer une ligue</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Invitez vos amis avec un code unique.
            </p>
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Nom de la ligue..."
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              maxLength={50}
            />
            <Button
              className="w-full gap-2"
              onClick={handleCreate}
              disabled={isPending || !leagueName.trim()}
            >
              <Plus className="h-4 w-4" />
              Créer
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">Rejoindre</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Entrez le code partagé par un ami.
            </p>
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Code d'invitation..."
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              maxLength={20}
              className="font-mono"
            />
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleJoin}
              disabled={isPending || !inviteCode.trim()}
            >
              <LogIn className="h-4 w-4" />
              Rejoindre
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
