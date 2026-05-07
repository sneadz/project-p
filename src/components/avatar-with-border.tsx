import { getBorderClasses } from '@/lib/borders'
import { getAvatarSrc } from '@/lib/avatars'

interface AvatarWithBorderProps {
  avatarId: string | null
  borderId: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  alt?: string
  className?: string
}

const SIZE_CLASSES = {
  sm: 'h-8 w-8 rounded-lg',
  md: 'h-12 w-12 rounded-xl',
  lg: 'h-20 w-20 rounded-2xl',
  xl: 'h-24 w-24 rounded-2xl',
}

export function AvatarWithBorder({
  avatarId,
  borderId,
  size = 'md',
  alt = 'Avatar',
  className = '',
}: AvatarWithBorderProps) {
  const avatarSrc = getAvatarSrc(avatarId)
  const { className: borderClass, style: borderStyle } = getBorderClasses(borderId)
  const sizeClass = SIZE_CLASSES[size]

  return (
    <div
      className={`${sizeClass} overflow-hidden border-2 bg-card flex items-center justify-center shrink-0 ${borderClass} ${className}`}
      style={borderStyle}
    >
      {avatarSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarSrc} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span className="text-muted-foreground text-lg">?</span>
      )}
    </div>
  )
}
