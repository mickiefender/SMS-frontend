"use client"

import React from "react"
import { Loader2 } from "lucide-react"

interface CircularLoaderProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  color?: string
}

/**
 * Professional circular loader component for API calls
 * Industry standard loading indicator
 */
export function CircularLoader({ size = "md", className = "", color }: CircularLoaderProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  }

  const defaultColor = "text-blue-600"
  const spinnerColor = color || defaultColor

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} ${spinnerColor} animate-spin`} />
    </div>
  )
}

/**
 * Full page overlay loader - blocks interaction while loading
 */
export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
          <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-blue-400 opacity-20" />
        </div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  )
}

/**
 * Inline loader with optional message
 */
export function InlineLoader({ message = "Loading...", className = "" }: { message?: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 py-4 ${className}`}>
      <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      <span className="text-gray-600">{message}</span>
    </div>
  )
}

/**
 * Card loader - for loading content within cards
 */
export function CardLoader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="text-sm text-gray-500">Loading data...</span>
      </div>
    </div>
  )
}

/**
 * Table loader - for loading table content
 */
export function TableLoader({ rows = 5, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header skeleton */}
      <div className="flex gap-4 px-4 py-2">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
      </div>
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 bg-gray-50 rounded">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}

/**
 * Full screen loader with branding
 */
export function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="relative mb-6">
        <Loader2 className="h-16 w-16 text-indigo-600 animate-spin" />
        <div className="absolute inset-0 h-16 w-16 animate-pulse rounded-full bg-indigo-400 opacity-20" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">School Management System</h2>
      <p className="text-gray-600">Loading your dashboard...</p>
    </div>
  )
}

/**
 * Compact spinner for buttons
 */
export function ButtonSpinner({ className = "" }: { className?: string }) {
  return <Loader2 className={`h-4 w-4 animate-spin ${className}`} />
}

export default CircularLoader

