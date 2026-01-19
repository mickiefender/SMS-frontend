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

interface SchoolEvent {
  id: number
  title: string
  description: string
  event_date: string
  event_time: string
  location: string
  created_by_name: string
}

export default function ManageEventsPage() {
  const [events, setEvents] = useState<SchoolEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const eventsRes = await academicsAPI.events()
      setEvents(eventsRes.data.results || eventsRes.data || [])
      setError(null)
    } catch (err: any) {
      console.error("Error:", err)
      setError("Failed to load events")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!formData.title || !formData.event_date) {
        setError("Please fill in required fields")
        return
      }

      const data = {
        title: formData.title,
        description: formData.description,
        event_date: formData.event_date,
        event_time: formData.event_time,
        location: formData.location,
      }

      if (editingEvent) {
        await academicsAPI.updateEvent(editingEvent.id, data)
      } else {
        await academicsAPI.createEvent(data)
      }

      setIsOpen(false)
      setEditingEvent(null)
      setFormData({ title: "", description: "", event_date: "", event_time: "", location: "" })
      setError(null)
      fetchData()
    } catch (err: any) {
      console.error("Error:", err?.response?.data)
      setError(err?.response?.data?.detail || "Failed to save event")
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure?")) {
      try {
        await academicsAPI.deleteEvent(id)
        fetchData()
      } catch (err) {
        setError("Failed to delete event")
      }
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Events</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingEvent(null)
                setFormData({ title: "", description: "", event_date: "", event_time: "", location: "" })
              }}
              className="bg-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Edit Event" : "Create New Event"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}

              <div>
                <Label>Event Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Annual Sports Day"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Event description..."
                  rows={4}
                />
              </div>

              <div>
                <Label>Event Date *</Label>
                <Input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                />
              </div>

              <div>
                <Label>Event Time</Label>
                <Input
                  type="time"
                  value={formData.event_time}
                  onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                />
              </div>

              <div>
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., School Ground"
                />
              </div>

              <Button type="submit" className="w-full bg-purple-600">
                {editingEvent ? "Update" : "Create"} Event
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Events List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Title</th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Time</th>
                  <th className="text-left py-3 px-4 font-semibold">Location</th>
                  <th className="text-left py-3 px-4 font-semibold">Created By</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{event.title}</td>
                    <td className="py-3 px-4">{new Date(event.event_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{event.event_time}</td>
                    <td className="py-3 px-4">{event.location}</td>
                    <td className="py-3 px-4">{event.created_by_name}</td>
                    <td className="py-3 px-4 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setEditingEvent(event); setIsOpen(true); }}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(event.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
