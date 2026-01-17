"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { announcementsAPI } from "@/lib/api"

interface Announcement {
  id: number
  title: string
  content: string
  created_at: string
  audience: string
  priority: "normal" | "urgent" | "critical"
}

export function AnnouncementsMessaging() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newAnn, setNewAnn] = useState({
    title: "",
    content: "",
    audience: "all",
    priority: "normal" as const,
  })

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await announcementsAPI.list()
      const data = response.data.results || response.data
      setAnnouncements(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching announcements:", error)
      setAnnouncements([])
    } finally {
      setLoading(false)
    }
  }

  const addAnnouncement = async () => {
    if (newAnn.title && newAnn.content) {
      try {
        await announcementsAPI.create(newAnn)
        setNewAnn({ title: "", content: "", audience: "all", priority: "normal" })
        setShowForm(false)
        await fetchAnnouncements()
      } catch (error) {
        console.error("Error creating announcement:", error)
      }
    }
  }

  const priorityColors = {
    normal: "bg-blue-100 text-blue-800",
    urgent: "bg-yellow-100 text-yellow-800",
    critical: "bg-red-100 text-red-800",
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">Loading announcements...</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Announcements & Messaging</CardTitle>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            New Announcement
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {showForm && (
            <div className="p-4 border rounded-lg space-y-3">
              <input
                type="text"
                placeholder="Announcement title"
                value={newAnn.title}
                onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
              <textarea
                placeholder="Announcement content"
                value={newAnn.content}
                onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
                rows={3}
              />
              <select
                value={newAnn.audience}
                onChange={(e) => setNewAnn({ ...newAnn, audience: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Users</option>
                <option value="students">Students</option>
                <option value="teachers">Teachers</option>
                <option value="parents">Parents</option>
                <option value="staff">Staff</option>
              </select>
              <select
                value={newAnn.priority}
                onChange={(e) => setNewAnn({ ...newAnn, priority: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="normal">Normal Priority</option>
                <option value="urgent">Urgent Priority</option>
                <option value="critical">Critical Priority</option>
              </select>
              <div className="flex gap-2">
                <Button size="sm" onClick={addAnnouncement}>
                  Post Announcement
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements yet</p>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{ann.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[ann.priority]}`}>
                      {ann.priority}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{ann.content}</p>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Audience: {ann.audience}</span>
                    <span>{new Date(ann.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
