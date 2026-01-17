"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { academicsAPI } from "@/lib/api"

interface TimeSlot {
  id: number
  class: string
  day: string
  time: string
  subject: string
  teacher: string
}

export function TimetableManagement() {
  const [timetable, setTimetable] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newSlot, setNewSlot] = useState({ class: "", day: "", time: "", subject: "", teacher: "" })

  useEffect(() => {
    const fetchTimetables = async () => {
      try {
        const response = await academicsAPI.timetables()
        setTimetable(response.data.results || [])
        setLoading(false)
      } catch (error) {
        console.error("[v0] Failed to fetch timetables:", error)
        setLoading(false)
      }
    }

    fetchTimetables()
  }, [])

  const addSlot = async () => {
    if (newSlot.class && newSlot.day && newSlot.time && newSlot.subject && newSlot.teacher) {
      try {
        const data = {
          class_id: newSlot.class,
          day: newSlot.day,
          time: newSlot.time,
          subject_id: newSlot.subject,
          teacher_id: newSlot.teacher,
        }
        await academicsAPI.createTimetable(data)
        setNewSlot({ class: "", day: "", time: "", subject: "", teacher: "" })
        setShowForm(false)
      } catch (error) {
        console.error("[v0] Failed to create timetable slot:", error)
      }
    }
  }

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

  if (loading) {
    return <div className="text-center py-4">Loading timetables...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Timetable Management</CardTitle>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            Add Time Slot
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {showForm && (
            <div className="p-4 border rounded-lg space-y-3">
              <select
                value={newSlot.class}
                onChange={(e) => setNewSlot({ ...newSlot, class: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Select Class</option>
              </select>
              <select
                value={newSlot.day}
                onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Select Day</option>
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={newSlot.time}
                onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
              <select
                value={newSlot.subject}
                onChange={(e) => setNewSlot({ ...newSlot, subject: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Select Subject</option>
              </select>
              <select
                value={newSlot.teacher}
                onChange={(e) => setNewSlot({ ...newSlot, teacher: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Select Teacher</option>
              </select>
              <div className="flex gap-2">
                <Button size="sm" onClick={addSlot}>
                  Save Slot
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Class</th>
                  <th className="text-left py-2 px-2">Day</th>
                  <th className="text-left py-2 px-2">Time</th>
                  <th className="text-left py-2 px-2">Subject</th>
                  <th className="text-left py-2 px-2">Teacher</th>
                </tr>
              </thead>
              <tbody>
                {timetable.map((slot) => (
                  <tr key={slot.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2 font-medium">{slot.class}</td>
                    <td className="py-2 px-2">{slot.day}</td>
                    <td className="py-2 px-2">{slot.time}</td>
                    <td className="py-2 px-2">{slot.subject}</td>
                    <td className="py-2 px-2">{slot.teacher}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
