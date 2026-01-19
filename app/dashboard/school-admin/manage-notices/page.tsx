"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { academicsAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Edit2, Plus } from "lucide-react"

interface Notice {
  id: number
  title: string
  content: string
  priority: string
  posted_by_name: string
  created_at: string
  is_active: boolean
}

export default function ManageNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "medium",
    is_active: true,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const noticesRes = await academicsAPI.notices()
      setNotices(noticesRes.data.results || noticesRes.data || [])
      setError(null)
    } catch (err: any) {
      console.error("Error:", err)
      setError("Failed to load notices")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!formData.title || !formData.content) {
        setError("Please fill in all required fields")
        return
      }

      const data = {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        is_active: formData.is_active,
      }

      if (editingNotice) {
        await academicsAPI.updateNotice(editingNotice.id, data)
      } else {
        await academicsAPI.createNotice(data)
      }

      setIsOpen(false)
      setEditingNotice(null)
      setFormData({ title: "", content: "", priority: "medium", is_active: true })
      setError(null)
      fetchData()
    } catch (err: any) {
      console.error("Error:", err?.response?.data)
      setError(err?.response?.data?.detail || "Failed to save notice")
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure?")) {
      try {
        await academicsAPI.deleteNotice(id)
        fetchData()
      } catch (err) {
        setError("Failed to delete notice")
      }
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Notices</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingNotice(null)
                setFormData({ title: "", content: "", priority: "medium", is_active: true })
              }}
              className="bg-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Post Notice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingNotice ? "Edit Notice" : "Post New Notice"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}

              <div>
                <Label>Notice Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Holiday Announcement"
                />
              </div>

              <div>
                <Label>Notice Content *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your notice here..."
                  rows={6}
                />
              </div>

              <div>
                <Label>Priority</Label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Make this notice active
                </Label>
              </div>

              <Button type="submit" className="w-full bg-purple-600">
                {editingNotice ? "Update" : "Post"} Notice
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Notices List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notices.map((notice) => (
              <div key={notice.id} className={`border-l-4 ${notice.priority === "high" ? "border-red-500" : notice.priority === "low" ? "border-green-500" : "border-yellow-500"} pl-4 py-3 bg-gray-50 rounded`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{notice.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{notice.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      By {notice.posted_by_name} • {new Date(notice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingNotice(notice)
                        setFormData({
                          title: notice.title,
                          content: notice.content,
                          priority: notice.priority,
                          is_active: notice.is_active,
                        })
                        setIsOpen(true)
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(notice.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
