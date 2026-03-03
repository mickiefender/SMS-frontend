"use client"

import { useAuthContext } from "@/lib/auth-context"
import { useNotifications } from "@/lib/notifications-context"
import { useState, useEffect, useRef } from "react"
import { academicsAPI } from "@/lib/api"
import Image from "next/image"

export function TopBar() {
  const { user, logout } = useAuthContext()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [profilePic, setProfilePic] = useState<string>("")
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchProfilePic = async () => {
      if (!user?.id) return
      try {
        const picRes = await academicsAPI.profilePictureByUser(user.id)
        const pics = picRes.data.results || picRes.data || []
        if (pics.length > 0) {
          const picUrl = pics[0].display_url || pics[0].storage_url || pics[0].picture || ""
          setProfilePic(picUrl)
        }
      } catch (err) {
        // silent
      }
    }
    fetchProfilePic()
  }, [user?.id])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (!user) return null

  const roleLabels = {
    super_admin: "Super Administrator",
    school_admin: "School Administrator",
    teacher: "Teacher",
    student: "Student",
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "payment":
        return "💰"
      case "withdrawal":
        return "🏦"
      default:
        return "📢"
    }
  }

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <header className="border-b border-[#e0e0e0] bg-white h-16 flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Left side - Welcome text */}
      <h2 className="text-lg text-[#666] font-medium">Dashboard</h2>

      {/* Right side - Search, language, notifications, profile */}
      <div className="flex items-center gap-6">
        {/* Search Bar */}
        <div className="hidden md:flex items-center bg-[#f5f5f5] rounded-lg px-4 py-2 w-64">
          <span className="text-[#999]"></span>
          <input
            type="text"
            placeholder="Search here ..."
            className="bg-transparent outline-none ml-2 text-sm text-[#666] flex-1"
          />
        </div>

        {/* Language Selector */}
        <select className="bg-transparent text-sm text-[#666] font-medium outline-none cursor-pointer hover:text-[#1a3a52]">
          <option>English</option>
          <option>Bangla</option>
          <option>Arabic</option>
        </select>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications)
              setShowProfileMenu(false)
            }}
            className="relative text-[#999] hover:text-[#1a3a52] transition-colors"
          >
            <span className="text-2xl">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 bg-white border border-[#e0e0e0] rounded-lg shadow-xl w-96 max-h-[480px] overflow-hidden z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#e0e0e0] bg-[#f9f9f9]">
                <h3 className="font-semibold text-[#333] text-sm">Notifications</h3>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                      {unreadCount} new
                    </span>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto max-h-[380px]">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <span className="text-4xl block mb-2">🔔</span>
                    <p className="text-sm text-[#999]">No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 20).map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`w-full text-left px-4 py-3 border-b border-[#f0f0f0] hover:bg-[#f9f9f9] transition-colors ${
                        !notif.read ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        <span className="text-lg flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notif.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm ${!notif.read ? "font-semibold text-[#333]" : "text-[#555]"}`}>
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-[#888] mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-xs text-[#aaa] mt-1">{formatTimeAgo(notif.created_at)}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu)
              setShowNotifications(false)
            }}
            className="flex items-center gap-3 hover:bg-[#f5f5f5] px-3 py-2 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-[#ffc107] rounded-full flex items-center justify-center text-sm font-bold text-[#1a3a52] overflow-hidden">
              {profilePic ? (
                <Image src={profilePic} alt="Profile" width={32} height={32} className="w-full h-full object-cover" />
              ) : (
                user.first_name?.[0]
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-[#333]">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-[#999]">{roleLabels[user.role as keyof typeof roleLabels]}</p>
            </div>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 bg-white border border-[#e0e0e0] rounded-lg shadow-lg w-48">
              <button className="w-full text-left px-4 py-2 text-sm text-[#666] hover:bg-[#f5f5f5]">My Profile</button>
              <button className="w-full text-left px-4 py-2 text-sm text-[#666] hover:bg-[#f5f5f5]">Settings</button>
              <hr className="my-2" />
              <button
                onClick={() => {
                  setShowProfileMenu(false)
                  logout()
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
