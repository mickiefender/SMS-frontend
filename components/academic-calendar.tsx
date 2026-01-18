"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { academicsAPI } from "@/lib/api"
import { useAuthContext } from "@/lib/auth-context"

interface CalendarEvent {
  id: number
  title: string
  start_date: string
  end_date: string
  event_type: "holiday" | "exam" | "event" | "break"
  description?: string
}

export function AcademicCalendar() {
  const { user } = useAuthContext()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: "",
    start_date: "",
    end_date: "",
    event_type: "event" as const,
    description: "",
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await academicsAPI.calendarEvents()
      const data = response.data.results || response.data
      setEvents(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching calendar events:", error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const addEvent = async () => {
    if (newEvent.title && newEvent.start_date && newEvent.end_date) {
      if (!user?.school_id) {
        console.error("[v0] No school_id found for user")
        return
      }

      try {
        const payload = {
          school: user.school_id,
          title: newEvent.title,
          start_date: newEvent.start_date,
          end_date: newEvent.end_date,
          event_type: newEvent.event_type,
          description: newEvent.description || "",
        }

        console.log("[v0] Creating calendar event with payload:", payload)
        await academicsAPI.createCalendarEvent(payload)
        setNewEvent({ title: "", start_date: "", end_date: "", event_type: "event", description: "" })
        setShowForm(false)
        await fetchEvents()
      } catch (error: any) {
        console.error("[v0] Error creating event:", error?.response?.data || error)
      }
    }
  }

  const typeColors = {
    holiday: "bg-red-100 text-red-800",
    exam: "bg-blue-100 text-blue-800",
    event: "bg-green-100 text-green-800",
    break: "bg-yellow-100 text-yellow-800",
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">Loading calendar events...</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Academic Calendar</CardTitle>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            Add Event
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {showForm && (
            <div className="p-4 border rounded-lg space-y-3">
              <input
                type="text"
                placeholder="Event title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
              <input
                type="date"
                value={newEvent.start_date}
                onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
              <input
                type="date"
                value={newEvent.end_date}
                onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
              <select
                value={newEvent.event_type}
                onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="event">Event</option>
                <option value="holiday">Holiday</option>
                <option value="exam">Exam</option>
                <option value="break">Break</option>
              </select>
              <textarea
                placeholder="Description (optional)"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={addEvent}>
                  Save Event
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events scheduled</p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.start_date} to {event.end_date}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[event.event_type]}`}>
                    {event.event_type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
