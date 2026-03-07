"use client"

import { useState, useEffect } from "react"
import { messagingAPI } from "@/lib/api"
import { Bell, Megaphone, Pin } from "lucide-react"
import { CardLoader } from "@/components/circular-loader"

interface Notice {
  id: number
  title: string
  content: string
  priority: "urgent" | "high" | "medium" | "low"
  created_at: string
  is_pinned: boolean
  author_name?: string
}

interface Announcement {
  id: number
  title: string
  content: string
  created_at: string
  author_name?: string
}

export function NoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"notices" | "announcements">("notices")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [noticesRes, announcementsRes] = await Promise.all([
          messagingAPI.notices(),
          messagingAPI.announcements(),
        ])

        const allNotices = noticesRes.data.results || noticesRes.data || []
        const allAnnouncements = announcementsRes.data.results || announcementsRes.data || []

        // Sort notices: pinned first, then by date
        allNotices.sort((a: Notice, b: Notice) => {
          if (a.is_pinned && !b.is_pinned) return -1
          if (!a.is_pinned && b.is_pinned) return 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })

        // Sort announcements by date (newest first)
        allAnnouncements.sort(
          (a: Announcement, b: Announcement) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )

        setNotices(allNotices)
        setAnnouncements(allAnnouncements)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch notices and announcements", err)
        setError("Could not load notices.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "border-red-500"
      case "high":
        return "border-orange-500"
      case "medium":
        return "border-yellow-500"
      default:
        return "border-blue-500"
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800">Notice Board</h3>
        </div>
        <CardLoader />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800">Notice Board</h3>
        </div>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    )
  }

  const combinedItems = [
    ...notices.map((n) => ({ ...n, type: "notice" as const })),
    ...announcements.map((a) => ({ ...a, type: "announcement" as const })),
  ]

  // Sort combined items by date (newest first)
  combinedItems.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">Notice Board</h3>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      </div>

      {/* Tab buttons for mobile/small screens */}
      <div className="flex gap-2 mb-4 md:hidden">
        <button
          onClick={() => setActiveTab("notices")}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded ${
            activeTab === "notices"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Bell size={14} className="inline mr-1" />
          Notices ({notices.length})
        </button>
        <button
          onClick={() => setActiveTab("announcements")}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded ${
            activeTab === "announcements"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Megaphone size={14} className="inline mr-1" />
          Announcements ({announcements.length})
        </button>
      </div>

      {/* Desktop view - show both tabs inline */}
      <div className="hidden md:flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("notices")}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded ${
            activeTab === "notices"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Bell size={14} />
          Notices ({notices.length})
        </button>
        <button
          onClick={() => setActiveTab("announcements")}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded ${
            activeTab === "announcements"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Megaphone size={14} />
          Announcements ({announcements.length})
        </button>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {activeTab === "notices" && notices.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Bell size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No notices available</p>
          </div>
        )}

        {activeTab === "announcements" && announcements.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Megaphone size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No announcements available</p>
          </div>
        )}

        {/* Notices Tab */}
        {activeTab === "notices" &&
          notices.map((notice) => (
            <div
              key={`notice-${notice.id}`}
              className={`border-l-4 pl-3 py-2 pr-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors ${getPriorityColor(
                notice.priority,
              )}`}
            >
              <div className="flex items-center gap-2 mb-1">
                {notice.is_pinned && <Pin size={12} className="text-gray-500" />}
                <span className="font-semibold text-sm text-gray-800 line-clamp-1">
                  {notice.title}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-1">{formatTimeAgo(notice.created_at)}</p>
              <p className="text-sm text-gray-600 line-clamp-2">{notice.content}</p>
            </div>
          ))}

        {/* Announcements Tab */}
        {activeTab === "announcements" &&
          announcements.map((announcement) => (
            <div
              key={`announcement-${announcement.id}`}
              className="border-l-4 border-blue-500 pl-3 py-2 pr-2 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <Megaphone size={14} className="text-blue-600" />
                <span className="font-semibold text-sm text-gray-800 line-clamp-1">
                  {announcement.title}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-1">{formatTimeAgo(announcement.created_at)}</p>
              <p className="text-sm text-gray-600 line-clamp-2">{announcement.content}</p>
            </div>
          ))}
      </div>
    </div>
  )
}


