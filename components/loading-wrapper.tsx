'use client'

import React from 'react'
import Loader from '@/components/loader'

interface LoadingWrapperProps {
  isLoading: boolean
  children: React.ReactNode
  color?: string
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({ 
  isLoading, 
  children, 
  color = '#f5c607' 
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Loader size="md" color={color} />
      </div>
    )
  }

  return <>{children}</>
}

export default LoadingWrapper
