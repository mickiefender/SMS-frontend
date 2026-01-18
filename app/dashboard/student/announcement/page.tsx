"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/lib/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true)
        const res = await apiClient.get("/schools/announcements/")
        setAnnouncements(res.data || [])
      } catch (err: any) {
        setError("Failed to load announcements")
        console.error("[v0] Failed to fetch announcements:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/student">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Announcements</h1>
        </div>

        {error && <div className="text-red-500">{error}</div>}

        <div className="grid grid-cols-1 gap-4">
          {announcements.length > 0 ? (
            announcements.map((announcement) => (
              <Card key={announcement.id}>
                <CardHeader>
                  <CardTitle>{announcement.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>{announcement.content}</p>
                  <p className="text-sm text-muted-foreground">
                    Posted on {new Date(announcement.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">No announcements available</div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
