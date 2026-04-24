import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User, UserPlus, Check, X, Users } from 'lucide-react'
import { getAvatarSrc } from '@/lib/avatars'
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from '@/app/actions/friends'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface FriendsPageProps {
  searchParams: { q?: string }
}

export default async function FriendsPage({ searchParams }: FriendsPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const query = searchParams.q?.trim() ?? ''

  // Toutes mes relations (pour connaître le statut dans les résultats de recherche)
  const { data: myFriendships } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, status')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  const friendshipMap = new Map<
    string,
    { id: string; status: string; iRequested: boolean }
  >()
  for (const f of myFriendships ?? []) {
    const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id
    friendshipMap.set(otherId, {
      id: f.id,
      status: f.status,
      iRequested: f.requester_id === user.id,
    })
  }

  // Recherche d'utilisateurs
  let searchResults: { id: string; username: string | null; avatar_url: string | null }[] = []
  if (query.length >= 2) {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .ilike('username', `%${query}%`)
      .neq('id', user.id)
      .limit(10)
    searchResults = data ?? []
  }

  // Demandes reçues en attente
  const { data: pendingReceived } = await supabase
    .from('friendships')
    .select('id, requester:profiles!requester_id(id, username, avatar_url)')
    .eq('addressee_id', user.id)
    .eq('status', 'pending')

  // Amis acceptés
  const { data: friendships } = await supabase
    .from('friendships')
    .select(
      'id, requester:profiles!requester_id(id, username, avatar_url), addressee:profiles!addressee_id(id, username, avatar_url)'
    )
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq('status', 'accepted')

  type ProfileSnippet = { id: string; username: string | null; avatar_url: string | null }

  const friends = (friendships ?? []).map((f) => {
    const requester = (f.requester as unknown as ProfileSnippet | null)
    const addressee = (f.addressee as unknown as ProfileSnippet | null)
    const friend = requester?.id === user.id ? addressee : requester
    return { friendshipId: f.id, friend }
  })

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto max-w-2xl px-4 py-16 space-y-10">
        <h1 className="text-2xl font-black uppercase tracking-tighter">Amis</h1>

        {/* Recherche */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Rechercher un joueur
          </h2>
          <form method="GET" action="/friends" className="flex gap-2">
            <Input
              name="q"
              defaultValue={query}
              placeholder="Rechercher par pseudo..."
              className="flex-1"
              autoComplete="off"
            />
            <Button type="submit" variant="default" size="default">
              Chercher
            </Button>
          </form>

          {query.length >= 2 && searchResults.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun joueur trouvé pour « {query} ».</p>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((result) => {
                const rel = friendshipMap.get(result.id)
                return (
                  <div
                    key={result.id}
                    className="rounded-lg border border-border bg-card p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg overflow-hidden border border-primary/20 bg-muted flex items-center justify-center shrink-0">
                        {getAvatarSrc(result.avatar_url) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getAvatarSrc(result.avatar_url)!}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-sm font-bold truncate">
                        {result.username ?? 'Anonyme'}
                      </span>
                    </div>
                    <div className="shrink-0">
                      {!rel ? (
                        <form
                          action={async () => {
                            'use server'
                            await sendFriendRequest(result.id)
                          }}
                        >
                          <Button type="submit" size="sm" variant="default" className="gap-1.5">
                            <UserPlus className="h-3.5 w-3.5" />
                            Ajouter
                          </Button>
                        </form>
                      ) : rel.status === 'accepted' ? (
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                          Déjà amis
                        </span>
                      ) : rel.iRequested ? (
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                          Demande envoyée
                        </span>
                      ) : (
                        <form
                          action={async () => {
                            'use server'
                            await acceptFriendRequest(rel.id)
                          }}
                        >
                          <Button type="submit" size="sm" variant="outline" className="gap-1.5">
                            <Check className="h-3.5 w-3.5" />
                            Accepter
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Demandes reçues */}
        {pendingReceived && pendingReceived.length > 0 && (
          <>
            <div className="border-t border-border" />
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Demandes reçues ({pendingReceived.length})
              </h2>
              <div className="space-y-2">
                {pendingReceived.map((req) => {
                  const requester = req.requester as unknown as ProfileSnippet | null
                  return (
                    <div
                      key={req.id}
                      className="rounded-lg border border-border bg-card p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg overflow-hidden border border-primary/20 bg-muted flex items-center justify-center shrink-0">
                          {getAvatarSrc(requester?.avatar_url ?? null) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={getAvatarSrc(requester?.avatar_url ?? null)!}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="text-sm font-bold truncate">
                          {requester?.username ?? 'Anonyme'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <form
                          action={async () => {
                            'use server'
                            await acceptFriendRequest(req.id)
                          }}
                        >
                          <Button type="submit" size="sm" variant="default" className="gap-1.5">
                            <Check className="h-3.5 w-3.5" />
                            Accepter
                          </Button>
                        </form>
                        <form
                          action={async () => {
                            'use server'
                            await declineFriendRequest(req.id)
                          }}
                        >
                          <Button type="submit" size="sm" variant="outline" className="gap-1.5">
                            <X className="h-3.5 w-3.5" />
                            Refuser
                          </Button>
                        </form>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Liste amis */}
        <div className="border-t border-border" />
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Mes amis ({friends.length})
          </h2>
          {friends.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Vous n&apos;avez pas encore d&apos;amis. Cherchez un joueur par pseudo pour commencer !
            </p>
          ) : (
            <div className="space-y-2">
              {friends.map(({ friendshipId, friend }) => (
                <div
                  key={friendshipId}
                  className="rounded-lg border border-border bg-card p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg overflow-hidden border border-primary/20 bg-muted flex items-center justify-center shrink-0">
                      {friend && getAvatarSrc(friend.avatar_url) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getAvatarSrc(friend!.avatar_url)!}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-sm font-bold truncate">
                      {friend?.username ?? 'Anonyme'}
                    </span>
                  </div>
                  <form
                    action={async () => {
                      'use server'
                      await removeFriend(friendshipId)
                    }}
                  >
                    <Button type="submit" size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive gap-1.5">
                      <X className="h-3.5 w-3.5" />
                      Retirer
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
