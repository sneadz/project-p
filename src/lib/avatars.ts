export interface Avatar {
  id: string
  label: string
  src: string
  color: string
}

export const AVATARS: Avatar[] = [
  { id: 'avatar_01', label: 'Cyan', src: '/avatars/avatar_01.svg', color: '#00d4ff' },
  { id: 'avatar_02', label: 'Purple', src: '/avatars/avatar_02.svg', color: '#a855f7' },
  { id: 'avatar_03', label: 'Orange', src: '/avatars/avatar_03.svg', color: '#f97316' },
  { id: 'avatar_04', label: 'Green', src: '/avatars/avatar_04.svg', color: '#22c55e' },
  { id: 'avatar_05', label: 'Red', src: '/avatars/avatar_05.svg', color: '#ef4444' },
  { id: 'avatar_06', label: 'Blue', src: '/avatars/avatar_06.svg', color: '#3b82f6' },
  { id: 'avatar_07', label: 'Pink', src: '/avatars/avatar_07.svg', color: '#ec4899' },
  { id: 'avatar_08', label: 'Gold', src: '/avatars/avatar_08.svg', color: '#eab308' },
]

export function getAvatarSrc(avatarId: string | null | undefined): string | null {
  if (!avatarId) return null
  const avatar = AVATARS.find((a) => a.id === avatarId)
  return avatar?.src ?? null
}
