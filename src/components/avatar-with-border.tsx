import { getBorderStyle } from '@/lib/borders'
import { getAvatarSrc } from '@/lib/avatars'

interface AvatarWithBorderProps {
  avatarId: string | null
  borderId: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  alt?: string
  className?: string
}

const SIZE_CLASSES: Record<string, { outer: string; inner: string }> = {
  sm: { outer: 'h-8 w-8 rounded-lg', inner: 'rounded-lg' },
  md: { outer: 'h-12 w-12 rounded-xl', inner: 'rounded-xl' },
  lg: { outer: 'h-20 w-20 rounded-2xl', inner: 'rounded-2xl' },
  xl: { outer: 'h-24 w-24 rounded-2xl', inner: 'rounded-2xl' },
}

export function AvatarWithBorder({
  avatarId,
  borderId,
  size = 'md',
  alt = 'Avatar',
  className = '',
}: AvatarWithBorderProps) {
  const avatarSrc = getAvatarSrc(avatarId)
  const borderStyle = getBorderStyle(borderId)
  const { outer, inner } = SIZE_CLASSES[size]

  return (
    // border-primary/40 is the default when no border equipped
    <div
      className={`${outer} relative border-2 shrink-0 ${!borderId ? 'border-primary/40' : ''} ${className}`}
      style={borderId ? borderStyle : undefined}
    >
      <div
        className={`absolute inset-0 overflow-hidden ${inner} bg-card flex items-center justify-center`}
      >
        {avatarSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarSrc} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <span className="text-muted-foreground text-lg">?</span>
        )}
      </div>
    </div>
  )
}
