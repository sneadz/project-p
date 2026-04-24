'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Target, Crosshair, Copy, Check, User, LogIn } from 'lucide-react'
import { getAvatarSrc } from '@/lib/avatars'
import { createLeague, joinLeague, leaveLeague } from '@/app/actions/leagues'

interface LeagueMember {
  user_id: string
  username: string | null
  avatar_url: string | null
  correct_predictions: number
  exact_predictions: number
}

interface UserLeague {
  id: string
  name: string
  invite_code: string
  owner_id: string
}

interface LeagueSectionProps {
  serieId: number
  isJoined: boolean
  isLoggedIn: boolean
  currentUserId?: string
  userLeague: UserLeague | null
  leagueMembers: LeagueMember[]
}

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function LeagueSection({
  serieId,
  isJoined,
  isLoggedIn,
  currentUserId,
  userLeague,
  leagueMembers,
}: LeagueSectionProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [leagueName, setLeagueName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const handleCreate = () => {
    if (!leagueName.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await createLeague(leagueName.trim(), serieId)
      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
        router.refresh()
      }
    })
  }

  const handleJoin = () => {
    if (!inviteCode.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await joinLeague(inviteCode.trim(), serieId)
      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
        router.refresh()
      }
    })
  }

  const handleLeave = () => {
    if (!userLeague) return
    setError(null)
    startTransition(async () => {
      const result = await leaveLeague(userLeague.id, serieId)
      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
        router.refresh()
      }
    })
  }

  const handleCopy = () => {
    if (!userLeague) return
    navigator.clipboard.writeText(userLeague.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 font-bold uppercase tracking-widest text-sm px-5 py-2.5">
          <Users className="h-4 w-4" />
          Ligue
          {userLeague && (
            <span className="ml-1 text-[10px] bg-primary/20 text-primary rounded px-1.5 py-0.5 font-black">
              {leagueMembers.length}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="overflow-y-auto max-h-[85vh] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-black uppercase tracking-widest">
              {userLeague ? userLeague.name : 'Ligue privée'}
            </DialogTitle>
          </DialogHeader>

          {!isLoggedIn ? (
            <p className="text-sm text-muted-foreground py-4">
              Connectez-vous pour rejoindre ou créer une ligue.
            </p>
          ) : !isJoined ? (
            <p className="text-sm text-muted-foreground py-4">
              Inscrivez-vous à la compétition pour accéder aux ligues.
            </p>
          ) : userLeague ? (
            /* ── Dans une ligue ── */
            <div className="space-y-5">
              {/* Code d'invitation */}
              <div className="rounded-xl bg-muted/30 border border-border p-4 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Code d&apos;invitation
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-black tracking-widest text-primary flex-1">
                    {userLeague.invite_code}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                </div>
              </div>

              {/* Leaderboard */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Classement — {leagueMembers.length} membre{leagueMembers.length > 1 ? 's' : ''}
                </p>
                {leagueMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">Aucun membre pour l&apos;instant.</p>
                ) : (
                  leagueMembers.map((member, index) => {
                    const rank = index + 1
                    const medal = MEDALS[rank]
                    const isMe = member.user_id === currentUserId
                    const avatarSrc = getAvatarSrc(member.avatar_url)
                    return (
                      <div
                        key={member.user_id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                          isMe ? 'bg-primary/5 border-primary/30' : 'bg-card/50 border-border/40'
                        }`}
                      >
                        <div className="w-7 text-center shrink-0">
                          {medal ? (
                            <span className="text-lg">{medal}</span>
                          ) : (
                            <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
                          )}
                        </div>
                        <div className="h-8 w-8 rounded-lg overflow-hidden border border-border/40 bg-card flex items-center justify-center shrink-0">
                          {avatarSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <span className={`flex-1 text-sm font-bold truncate ${isMe ? 'text-primary' : ''}`}>
                          {member.username ?? 'Joueur'}
                          {isMe && (
                            <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                              (vous)
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-1 text-green-500">
                            <Target className="h-3.5 w-3.5" />
                            <span className="text-sm font-black tabular-nums">
                              {member.correct_predictions}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-primary">
                            <Crosshair className="h-3.5 w-3.5" />
                            <span className="text-sm font-black tabular-nums">
                              {member.exact_predictions}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Quitter */}
              {error && <p className="text-xs text-destructive font-medium">{error}</p>}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLeave}
                disabled={isPending}
                className="text-muted-foreground hover:text-destructive w-full"
              >
                {userLeague.owner_id === currentUserId ? 'Dissoudre la ligue' : 'Quitter la ligue'}
              </Button>
            </div>
          ) : (
            /* ── Pas encore dans une ligue ── */
            <div className="space-y-6">
              {error && <p className="text-xs text-destructive font-medium">{error}</p>}

              {/* Créer */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Créer une ligue
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nom de la ligue..."
                    value={leagueName}
                    onChange={(e) => setLeagueName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    maxLength={50}
                  />
                  <Button onClick={handleCreate} disabled={isPending || !leagueName.trim()}>
                    Créer
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-border" />
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">ou</span>
                <div className="flex-1 border-t border-border" />
              </div>

              {/* Rejoindre */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Rejoindre via code
                </p>
                <div className="flex gap-2">
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
                    onClick={handleJoin}
                    disabled={isPending || !inviteCode.trim()}
                    className="gap-1.5"
                  >
                    <LogIn className="h-4 w-4" />
                    Rejoindre
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
