"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

export interface Notification {
  id: string
  type: "payment" | "withdrawal" | "general"
  title: string
  message: string
  read: boolean
  created_at: string
  metadata?: Record<string, any>
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, "id" | "read" | "created_at">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
  removeNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

function getStorageKey(userId?: number | string): string {
  return `notifications_${userId || "guest"}`
}

export function NotificationProvider({ children, userId }: { children: React.ReactNode; userId?: number | string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem(getStorageKey(userId))
      if (stored) {
        setNotifications(JSON.parse(stored))
      }
    } catch {
      // ignore parse errors
    }
  }, [userId])

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem(getStorageKey(userId), JSON.stringify(notifications))
  }, [notifications, userId])

  const unreadCount = notifications.filter((n) => !n.read).length

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "read" | "created_at">) => {
      const newNotification: Notification = {
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        read: false,
        created_at: new Date().toISOString(),
      }
      setNotifications((prev) => [newNotification, ...prev].slice(0, 50))
    },
    []
  )

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll, removeNotification }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider")
  }
  return context
}
