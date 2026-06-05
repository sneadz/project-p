import { createClient } from '@/lib/supabase/server'
import { AUTO_BORDERS, PURCHASABLE_BORDERS, getUnlockedAutoBorders } from '@/lib/borders'
import { AVATARS } from '@/lib/avatars'
import { AvatarWithBorder } from '@/components/avatar-with-border'
import { ShopBuyButton } from '@/components/shop-buy-button'
import { ShopEquipButton } from '@/components/shop-equip-button'
import { Gem, Target } from 'lucide-react'

const PURCHASABLE_PRICES: Record<string, number> = {
  border_neon: 150,
  border_phantom: 100,
}

export default async function ShopPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: {
    total_shards: number
    correct_predictions: number
    active_border: string | null
    avatar_url: string | null
  } | null = null
  let ownedItemIds: string[] = []

  if (user) {
    const [{ data: p }, { data: items }] = await Promise.all([
      supabase
        .from('profiles')
        .select('total_shards, correct_predictions, active_border, avatar_url')
        .eq('id', user.id)
        .single(),
      supabase.from('user_items').select('item_id').eq('user_id', user.id),
    ])
    profile = p ?? null
    ownedItemIds = (items ?? []).map((i: { item_id: string }) => i.item_id)
  }

  const unlockedAutoIds = getUnlockedAutoBorders(profile?.correct_predictions ?? 0)
  const premiumAvatars = AVATARS.filter((a) => a.premium)

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto max-w-3xl px-4 py-16 space-y-16">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black uppercase tracking-tighter">Boutique</h1>
          <p className="text-muted-foreground text-sm">
            Dépense tes shards pour des cosmétiques.
          </p>
          {profile && (() => {
            const correct = profile.correct_predictions ?? 0
            const nextBorder = AUTO_BORDERS.find((b) => b.threshold > correct)
            return (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Gem className="h-4 w-4 text-cyan-400" />
                  <span className="text-cyan-400">{profile.total_shards ?? 0}</span>
                  <span className="text-muted-foreground">shards disponibles</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-green-500" />
                  <span className="font-bold text-green-500">{correct}</span>
                  <span className="text-muted-foreground">
                    paris réussis{nextBorder && (
                      <> · encore <span className="font-bold text-foreground">{nextBorder.threshold - correct}</span> pour débloquer la bordure {nextBorder.label}</>
                    )}
                  </span>
                </div>
              </div>
            )
          })()}
        </div>

        {/* Bordures auto */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Bordures - Paliers</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Débloquées automatiquement selon le nombre de paris réussis.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {AUTO_BORDERS.map((border) => {
              const isUnlocked = unlockedAutoIds.includes(border.id)
              const isEquipped = profile?.active_border === border.id
              return (
                <div
                  key={border.id}
                  className="rounded-xl border border-border p-4 flex flex-col items-center gap-3"
                >
                  <AvatarWithBorder
                    avatarId={profile?.avatar_url ?? null}
                    borderId={border.id}
                    size="md"
                  />
                  <div className="text-center space-y-0.5">
                    <p className="text-sm font-bold">{border.label}</p>
                    <p className="text-xs text-muted-foreground">{border.threshold} paris réussis</p>
                  </div>
                  {isUnlocked ? (
                    isEquipped ? (
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                        Équipé
                      </span>
                    ) : (
                      <ShopEquipButton borderId={border.id} />
                    )
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                      Verrouillé
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Bordures achetables */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Bordures - Boutique</h2>
            <p className="text-xs text-muted-foreground mt-1">Bordures animées achetables en shards.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {PURCHASABLE_BORDERS.map((border) => {
              const isOwned = ownedItemIds.includes(border.id)
              const isEquipped = profile?.active_border === border.id
              const price = PURCHASABLE_PRICES[border.id] ?? 100
              return (
                <div
                  key={border.id}
                  className="rounded-xl border border-border p-4 flex flex-col items-center gap-3"
                >
                  <AvatarWithBorder
                    avatarId={profile?.avatar_url ?? null}
                    borderId={border.id}
                    size="md"
                  />
                  <div className="text-center space-y-0.5">
                    <p className="text-sm font-bold">{border.label}</p>
                    {!isOwned && (
                      <p className="text-xs text-cyan-400 font-bold">{price} shards</p>
                    )}
                  </div>
                  {isOwned ? (
                    isEquipped ? (
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                        Équipé
                      </span>
                    ) : (
                      <ShopEquipButton borderId={border.id} />
                    )
                  ) : user ? (
                    <ShopBuyButton
                      itemId={border.id}
                      price={price}
                      canAfford={(profile?.total_shards ?? 0) >= price}
                    />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Connexion requise</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Avatars premium */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Avatars Premium</h2>
            <p className="text-xs text-muted-foreground mt-1">75 shards chacun.</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {premiumAvatars.map((avatar) => {
              const isOwned = ownedItemIds.includes(avatar.id)
              return (
                <div
                  key={avatar.id}
                  className="rounded-xl border border-border p-4 flex flex-col items-center gap-3"
                >
                  <div className="h-16 w-16 rounded-xl overflow-hidden border-2 border-border bg-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatar.src}
                      alt={avatar.label}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="text-center space-y-0.5">
                    <p className="text-sm font-bold">{avatar.label}</p>
                    {!isOwned && (
                      <p className="text-xs text-cyan-400 font-bold">75 shards</p>
                    )}
                  </div>
                  {isOwned ? (
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-500">
                      Possédé
                    </span>
                  ) : user ? (
                    <ShopBuyButton
                      itemId={avatar.id}
                      price={75}
                      canAfford={(profile?.total_shards ?? 0) >= 75}
                    />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Connexion requise</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
