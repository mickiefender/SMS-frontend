"use client"

import React from "react"
import Image from "next/image"

interface ProfileAvatarProps {
  src?: string | null
  alt: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
}

const sizeClassesImage = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
}

export function ProfileAvatar({ src, alt, size = "md", className = "" }: ProfileAvatarProps) {
  const hasImage = src && src.length > 0
  
  // Get initials from alt text (name)
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return (parts[0]?.[0] || "?").toUpperCase()
  }

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        relative rounded-full overflow-hidden flex-shrink-0
        ${hasImage ? "bg-transparent" : "bg-gradient-to-br from-purple-400 to-blue-500"}
        ${className}
      `}
    >
      {hasImage ? (
        <Image
          src={src}
          alt={alt}
          width={sizeClassesImage[size]}
          height={sizeClassesImage[size]}
          className="w-full h-full object-cover"
          unoptimized={src.startsWith("http") ? true : false}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white font-medium">
          {getInitials(alt)}
        </div>
      )}
    </div>
  )
}

