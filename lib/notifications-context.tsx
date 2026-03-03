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

  // Load notifications from user's store and merge school payment notifications for admins
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem(getStorageKey(userId))
      let userNotifs: Notification[] = stored ? JSON.parse(stored) : []

      // For school admins, also load school-level payment notifications
      const userStr = sessionStorage.getItem("user")
      if (userStr) {
        try {
          const userData = JSON.parse(userStr)
          if (userData.role === "school_admin") {
            const schoolId = userData.school_id || "default"
            const schoolNotifKey = `school_payment_notifications_${schoolId}`
            const schoolNotifs: Notification[] = JSON.parse(localStorage.getItem(schoolNotifKey) || "[]")

            // Merge school notifications that aren't already in user's notifications
            const existingIds = new Set(userNotifs.map((n) => n.id))
            const newSchoolNotifs = schoolNotifs.filter((n) => !existingIds.has(n.id))
            if (newSchoolNotifs.length > 0) {
              userNotifs = [...newSchoolNotifs, ...userNotifs]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 50)
            }
          }
        } catch {
          // ignore
        }
      }

      setNotifications(userNotifs)
    } catch {
      // ignore parse errors
    }
  }, [userId])

  // Poll for new school payment notifications (for school admins)
  useEffect(() => {
    if (typeof window === "undefined") return
    const userStr = sessionStorage.getItem("user")
    if (!userStr) return

    let userData: any
    try {
      userData = JSON.parse(userStr)
    } catch {
      return
    }

    if (userData.role !== "school_admin") return

    const schoolId = userData.school_id || "default"
    const schoolNotifKey = `school_payment_notifications_${schoolId}`

    const pollInterval = setInterval(() => {
      try {
        const schoolNotifs: Notification[] = JSON.parse(localStorage.getItem(schoolNotifKey) || "[]")
        setNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id))
          const newNotifs = schoolNotifs.filter((n) => !existingIds.has(n.id))
          if (newNotifs.length === 0) return prev
          return [...newNotifs, ...prev]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 50)
        })
      } catch {
        // ignore
      }
    }, 10000) // Poll every 10 seconds

    return () => clearInterval(pollInterval)
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
