'use client'

import { useState } from 'react'

interface TeamImageProps {
  src: string | null | undefined
  name: string
  size?: number
  className?: string
}

export function TeamImage({ src, name, size = 48, className = '' }: TeamImageProps) {
  const [errored, setErrored] = useState(false)
  const initials = name.slice(0, 2).toUpperCase()

  if (!src || errored) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center rounded bg-muted text-muted-foreground text-xs font-bold shrink-0 ${className}`}
      >
        {initials}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      onError={() => setErrored(true)}
    />
  )
}
