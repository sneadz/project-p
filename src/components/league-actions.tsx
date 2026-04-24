'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { leaveLeague } from '@/app/actions/leagues'

interface LeagueActionsProps {
  leagueId: string
  inviteCode: string
  isOwner: boolean
}

export function LeagueActions({ leagueId, inviteCode, isOwner }: LeagueActionsProps) {
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLeave = () => {
    startTransition(async () => {
      await leaveLeague(leagueId)
      router.push('/leagues')
    })
  }

  return (
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
          onClick={handleLeave}
          disabled={isPending}
          className="text-muted-foreground hover:text-destructive"
        >
          {isOwner ? 'Dissoudre' : 'Quitter'}
        </Button>
      </div>
    </div>
  )
}
