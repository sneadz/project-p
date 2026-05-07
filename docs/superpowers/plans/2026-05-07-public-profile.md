# Public Profile Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public `/u/[username]` page showing any player's stats, rank, competition history, and a friend button for authenticated visitors.

**Architecture:** Pure Server Component at `src/app/u/[username]/page.tsx` — fetches `profiles`, `serie_stats`, `friendships`, and rank count in parallel, renders the hero-centred layout (option B). Friend button states are handled via inline Server Action forms (same pattern as `/friends`). Three existing pages get profile links added.

**Tech Stack:** Next.js 15 App Router, Supabase server client, Tailwind CSS, shadcn/ui, `lucide-react`

---

## File Map

| Action | Path |
|---|---|
| **Create** | `src/app/u/[username]/page.tsx` |
| **Modify** | `src/app/leaderboard/page.tsx` |
| **Modify** | `src/app/friends/page.tsx` |
| **Modify** | `src/components/serie-leaderboard-modal.tsx` |

---

## Task 1 — Public profile page

**Files:**
- Create: `src/app/u/[username]/page.tsx`

- [ ] **Step 1: Create the file with data fetching**

```tsx
// src/app/u/[username]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { getAvatarSrc } from '@/lib/avatars'
import {
  User, Target, Crosshair, Gem, Trophy, UserPlus, UserCheck, Clock, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
} from '@/app/actions/friends'

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string }
}) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, total_shards, correct_predictions, exact_predictions')
    .eq('username', params.username)
    .single()

  if (!profile) notFound()

  const [
    { data: serieStats },
    { count: betterCount },
    { data: { user } },
  ] = await Promise.all([
    supabase
      .from('serie_stats')
      .select('serie_id, league_name, serie_name, rank, total_bets, correct_predictions, exact_predictions')
      .eq('user_id', profile.id)
      .order('archived_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gt('correct_predictions', profile.correct_predictions),
    supabase.auth.getUser(),
  ])

  const rank = (betterCount ?? 0) + 1
  const totalBets = (serieStats ?? []).reduce((acc, s) => acc + (s.total_bets ?? 0), 0)
  const winrate = totalBets > 0
    ? Math.round((profile.correct_predictions / totalBets) * 100)
    : null

  const isOwnProfile = user?.id === profile.id
  let friendship: { id: string; status: string; iRequested: boolean } | null = null

  if (user && !isOwnProfile) {
    const { data: rel } = await supabase
      .from('friendships')
      .select('id, status, requester_id')
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),` +
        `and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`
      )
      .maybeSingle()

    if (rel) {
      friendship = {
        id: rel.id,
        status: rel.status,
        iRequested: rel.requester_id === user.id,
      }
    }
  }

  const avatarSrc = getAvatarSrc(profile.avatar_url)
  const username = params.username

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto max-w-2xl px-4 py-16 space-y-10">

        {/* Hero */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-primary/40 bg-card flex items-center justify-center shrink-0">
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarSrc} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">
            {profile.username ?? username}
          </h1>

          {/* Friend button — 5 states */}
          {!user && (
            <Button disabled variant="outline" size="sm" className="gap-2">
              <UserPlus className="h-3.5 w-3.5" />
              Ajouter en ami
            </Button>
          )}
          {user && !isOwnProfile && !friendship && (
            <form
              action={async () => {
                'use server'
                await sendFriendRequest(profile.id)
                revalidatePath(`/u/${username}`)
              }}
            >
              <Button type="submit" variant="outline" size="sm" className="gap-2">
                <UserPlus className="h-3.5 w-3.5" />
                Ajouter en ami
              </Button>
            </form>
          )}
          {user && !isOwnProfile && friendship?.status === 'pending' && friendship.iRequested && (
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Demande envoyée
            </span>
          )}
          {user && !isOwnProfile && friendship?.status === 'pending' && !friendship.iRequested && (
            <form
              action={async () => {
                'use server'
                await acceptFriendRequest(friendship!.id)
                revalidatePath(`/u/${username}`)
              }}
            >
              <Button type="submit" variant="default" size="sm" className="gap-2">
                <Check className="h-3.5 w-3.5" />
                Accepter la demande
              </Button>
            </form>
          )}
          {user && !isOwnProfile && friendship?.status === 'accepted' && (
            <form
              action={async () => {
                'use server'
                await removeFriend(friendship!.id)
                revalidatePath(`/u/${username}`)
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5" />
                  Déjà amis
                </span>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive text-xs"
                >
                  Retirer
                </Button>
              </div>
            </form>
          )}
        </div>

        <div className="border-t border-border" />

        {/* Stats highlight */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-card p-5 text-center space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Rang global</p>
            <p className="text-3xl font-black text-yellow-500">
              {profile.correct_predictions > 0 ? `#${rank}` : '—'}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 text-center space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Winrate</p>
            <p className="text-3xl font-black text-green-500">
              {winrate !== null ? `${winrate}%` : '—'}
            </p>
          </div>
        </div>

        {/* Stats secondaires */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-lg border border-border bg-card p-3 text-center space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Paris</p>
            <p className="text-xl font-black">{totalBets || '—'}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Réussis</p>
            <p className="text-xl font-black text-green-500 flex items-center justify-center gap-1">
              <Target className="h-4 w-4" />
              {profile.correct_predictions}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Exacts</p>
            <p className="text-xl font-black text-primary flex items-center justify-center gap-1">
              <Crosshair className="h-4 w-4" />
              {profile.exact_predictions}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Shards</p>
            <p className="text-xl font-black text-primary flex items-center justify-center gap-1">
              <Gem className="h-4 w-4" />
              {profile.total_shards}
            </p>
          </div>
        </div>

        {/* Historique compétitions */}
        {serieStats && serieStats.length > 0 && (
          <>
            <div className="border-t border-border" />
            <div className="space-y-4">
              <h2 className="text-lg font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Compétitions jouées
              </h2>
              <div className="space-y-2">
                {serieStats.map((s) => (
                  <div
                    key={s.serie_id}
                    className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{s.league_name}</p>
                      <p className="text-xs text-muted-foreground italic truncate">{s.serie_name}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
                      {s.rank && (
                        <span className="text-base font-black text-yellow-500 uppercase tracking-widest">
                          Top #{s.rank}
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-green-500" title="Paris réussis">
                        <Target className="h-3.5 w-3.5" />
                        <span className="text-sm font-black tabular-nums">
                          {s.correct_predictions}/{s.total_bets}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-primary" title="Scores exacts">
                        <Crosshair className="h-3.5 w-3.5" />
                        <span className="text-sm font-black tabular-nums">{s.exact_predictions}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Verify the build compiles**

```bash
npm run build
```

Expected: no TypeScript errors, build succeeds (or only pre-existing warnings).

- [ ] **Step 3: Commit**

```bash
git add src/app/u/
git commit -m "feat: add public profile page /u/[username]"
```

---

## Task 2 — Add profile links on leaderboard

**Files:**
- Modify: `src/app/leaderboard/page.tsx`

- [ ] **Step 1: Add `Link` import at top of file**

Find:
```tsx
import { User, Target, Crosshair } from 'lucide-react'
```
Replace with:
```tsx
import Link from 'next/link'
import { User, Target, Crosshair } from 'lucide-react'
```

- [ ] **Step 2: Wrap each top-20 row in a Link**

Find the `return (` of each leaderboard row — it currently starts with:
```tsx
            <div
              key={player.id}
              className={`flex items-center gap-4 rounded-xl border transition-colors
                ${style ? style.card : 'bg-card/50 border-border/40 px-4 py-3'}`}
            >
```
Replace with:
```tsx
            <Link
              key={player.id}
              href={`/u/${player.username}`}
              className={`flex items-center gap-4 rounded-xl border transition-colors hover:border-primary/40
                ${style ? style.card : 'bg-card/50 border-border/40 px-4 py-3'}`}
            >
```
And its closing `</div>` with `</Link>`.

- [ ] **Step 3: Wrap the "current player" card in a Link**

Find:
```tsx
            <div className="flex items-center gap-4 rounded-xl border bg-primary/5 border-primary/30 px-4 py-3">
```
Replace with:
```tsx
            <Link
              href={`/u/${currentPlayer.username}`}
              className="flex items-center gap-4 rounded-xl border bg-primary/5 border-primary/30 px-4 py-3 hover:border-primary/60 transition-colors"
            >
```
And its closing `</div>` with `</Link>`.

Note: if `currentPlayer.username` is null, the link will go to `/u/null` — guard with a conditional:
```tsx
            {currentPlayer.username ? (
              <Link href={`/u/${currentPlayer.username}`} className="...">
                ...
              </Link>
            ) : (
              <div className="...">
                ...
              </div>
            )}
```
Apply the same pattern to the top-20 rows: only wrap in `<Link>` when `player.username` is not null.

- [ ] **Step 4: Verify build and commit**

```bash
npm run build
git add src/app/leaderboard/page.tsx
git commit -m "feat: add profile links on leaderboard"
```

---

## Task 3 — Add profile links on friends page

**Files:**
- Modify: `src/app/friends/page.tsx`

- [ ] **Step 1: Add `Link` import**

Find at the top of `src/app/friends/page.tsx`:
```tsx
import { User, UserPlus, Check, X, Users } from 'lucide-react'
```
Replace with:
```tsx
import Link from 'next/link'
import { User, UserPlus, Check, X, Users } from 'lucide-react'
```

- [ ] **Step 2: Make search result rows clickable**

In the search results section, each result is rendered as:
```tsx
                  <div
                    key={result.id}
                    className="rounded-lg border border-border bg-card p-3 flex items-center justify-between gap-3"
                  >
```
Wrap the username/avatar part in a Link (not the whole row, since the row has an action button on the right). Add a `<Link>` around the left side only:

Find the inner div with avatar + username:
```tsx
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg overflow-hidden border border-primary/20 bg-muted flex items-center justify-center shrink-0">
```
Wrap it with:
```tsx
                    <Link
                      href={`/u/${result.username}`}
                      className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
                    >
                      <div className="h-9 w-9 rounded-lg overflow-hidden border border-primary/20 bg-muted flex items-center justify-center shrink-0">
```
And close the `</div>` of that inner section with `</Link>` instead. Only add the Link when `result.username` is not null.

- [ ] **Step 3: Make friends list rows clickable**

In the friends list, each friend row has:
```tsx
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg overflow-hidden border border-primary/20 bg-muted flex items-center justify-center shrink-0">
```
Same pattern — wrap the avatar+name left side in a `<Link href={/u/${friend?.username}}>` when `friend?.username` is not null.

- [ ] **Step 4: Verify build and commit**

```bash
npm run build
git add src/app/friends/page.tsx
git commit -m "feat: add profile links on friends page"
```

---

## Task 4 — Add profile links in serie leaderboard modal

**Files:**
- Modify: `src/components/serie-leaderboard-modal.tsx`

- [ ] **Step 1: Add `Link` import**

This is a client component. Find:
```tsx
import { Trophy, Target, Crosshair, User, RefreshCw } from 'lucide-react'
```
Replace with:
```tsx
import Link from 'next/link'
import { Trophy, Target, Crosshair, User, RefreshCw } from 'lucide-react'
```

- [ ] **Step 2: Wrap each entry's name in a profile Link**

Find the username span inside the entry map:
```tsx
                    <span className={`flex-1 text-sm font-bold truncate ${isMe ? 'text-primary' : ''}`}>
                      {entry.username ?? 'Joueur'}
                      {isMe && <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">(vous)</span>}
                    </span>
```
Replace with a conditional Link:
```tsx
                    {entry.username ? (
                      <Link
                        href={`/u/${entry.username}`}
                        className={`flex-1 text-sm font-bold truncate hover:underline ${isMe ? 'text-primary' : ''}`}
                      >
                        {entry.username}
                        {isMe && <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">(vous)</span>}
                      </Link>
                    ) : (
                      <span className="flex-1 text-sm font-bold truncate text-muted-foreground">Joueur</span>
                    )}
```

- [ ] **Step 3: Verify build and commit**

```bash
npm run build
git add src/components/serie-leaderboard-modal.tsx
git commit -m "feat: add profile links in serie leaderboard modal"
```

---

## Manual Verification Checklist

After all tasks are done, verify these scenarios in the browser (`npm run dev`):

- [ ] `/u/[existing-username]` renders correctly with hero, stats, and history
- [ ] `/u/[nonexistent]` returns 404
- [ ] Friend button shows "Ajouter en ami" when not logged in (disabled)
- [ ] Friend button shows "Ajouter en ami" form when logged in with no relation
- [ ] Friend button shows "Demande envoyée" after sending a request
- [ ] Friend button shows "Accepter la demande" on the recipient's view
- [ ] Friend button shows "Déjà amis" + "Retirer" after accepting
- [ ] Own profile shows no friend button
- [ ] Leaderboard rows are clickable → navigate to `/u/[username]`
- [ ] Friends list rows navigate to profiles
- [ ] Serie leaderboard modal usernames are clickable
