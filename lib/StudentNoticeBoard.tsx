'use client'

import { useState, useEffect } from "react"
import { messagingAPI } from "@/lib/api"
import { Bell, Megaphone, Pin } from "lucide-react"

interface Notice {
  id: number
  title: string
  content: string
  priority: "urgent" | "high" | "medium" | "low"
  created_at: string
  is_pinned: boolean
}

interface Announcement {
  id: number
  title: string
  content: string
  created_at: string
}

const StudentNoticeBoard = () => {
  const [notices, setNotices] = useState<Notice[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [noticesRes, announcementsRes] = await Promise.all([messagingAPI.notices(), messagingAPI.announcements()])

        const allNotices = noticesRes.data.results || noticesRes.data || []
        const allAnnouncements = announcementsRes.data.results || announcementsRes.data || []

        // Pinned notices first, then by date
        allNotices.sort((a: Notice, b: Notice) => {
          if (a.is_pinned && !b.is_pinned) return -1
          if (!a.is_pinned && b.is_pinned) return 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })

        allAnnouncements.sort(
          (a: Announcement, b: Announcement) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )

        setNotices(allNotices)
        setAnnouncements(allAnnouncements)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch notices and announcements", err)
        setError("Could not load board items.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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

  if (loading) {
    return <div>Loading notice board...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
          <Megaphone className="text-blue-600" />
          Announcements
        </h2>
        <div className="space-y-4">
          {announcements.length > 0 ? announcements.map(item => <div key={`announcement-${item.id}`} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="font-bold text-lg">{item.title}</h3>
            <p className="text-gray-700 my-2">{item.content}</p>
            <p className="text-xs text-gray-500 text-right">{new Date(item.created_at).toLocaleDateString()}</p>
          </div>) : <p>No announcements at the moment.</p>}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
          <Bell className="text-yellow-600" />
          Notices
        </h2>
        <div className="space-y-4">
          {notices.length > 0 ? notices.map(item => <div key={`notice-${item.id}`} className={`bg-white p-4 rounded-lg shadow-md border-l-4 ${getPriorityColor(item.priority)}`}>
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">{item.title}</h3>
              {item.is_pinned && <Pin className="text-gray-500" size={16} />}
            </div>
            <p className="text-gray-700 my-2">{item.content}</p>
            <p className="text-xs text-gray-500 text-right">{new Date(item.created_at).toLocaleDateString()}</p>
          </div>) : <p>No notices at the moment.</p>}
        </div>
      </div>
    </div>
  )
}

export default StudentNoticeBoard