'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { leaveLeague } from '@/app/actions/leagues'

interface LeagueActionsProps {
  leagueId: string
  inviteCode: string
  isOwner: boolean
  leagueName: string
}

export function LeagueActions({ leagueId, inviteCode, isOwner, leagueName }: LeagueActionsProps) {
  const [copied, setCopied] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConfirm = () => {
    startTransition(async () => {
      await leaveLeague(leagueId)
      router.push('/leagues')
    })
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Code d&apos;invitation
          </p>
          <p className="font-mono text-xl font-black tracking-widest text-primary">{inviteCode}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copié !' : 'Copier'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            className="text-muted-foreground hover:text-destructive"
          >
            {isOwner ? 'Dissoudre' : 'Quitter'}
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {isOwner ? 'Dissoudre la ligue ?' : 'Quitter la ligue ?'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              {isOwner
                ? <>La ligue <span className="font-bold text-foreground">{leagueName}</span> sera supprimée définitivement pour tous les membres. Cette action est irréversible.</>
                : <>Vous quitterez la ligue <span className="font-bold text-foreground">{leagueName}</span>. Vous pourrez la rejoindre à nouveau avec le code d&apos;invitation.</>
              }
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirm}
                disabled={isPending}
              >
                {isOwner ? 'Dissoudre définitivement' : 'Quitter'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
