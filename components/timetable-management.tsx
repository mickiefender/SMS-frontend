"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { academicsAPI, usersAPI } from "@/lib/api"

interface TimeSlot {
  id: number
  class_obj: number
  day: string
  start_time: string
  end_time: string
  subject: number
  teacher: number
  venue?: string
}

export function TimetableManagement() {
  const [timetable, setTimetable] = useState<TimeSlot[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newSlot, setNewSlot] = useState({
    class_obj: "",
    day: "monday",
    start_time: "",
    end_time: "",
    subject: "",
    teacher: "",
    venue: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [timetablesRes, classesRes, subjectsRes, teachersRes] = await Promise.all([
        academicsAPI.timetables(),
        academicsAPI.classes(),
        academicsAPI.subjects(),
        usersAPI.teachers(),
      ])

      setTimetable(timetablesRes.data.results || timetablesRes.data || [])
      setClasses(classesRes.data.results || classesRes.data || [])
      setSubjects(subjectsRes.data.results || subjectsRes.data || [])

      const teacherData = teachersRes.data.results || teachersRes.data || []
      setTeachers(Array.isArray(teacherData) ? teacherData : [])
    } catch (error) {
      console.error("[v0] Failed to fetch timetable data:", error)
    } finally {
      setLoading(false)
    }
  }

  const addSlot = async () => {
    if (
      !newSlot.class_obj ||
      !newSlot.day ||
      !newSlot.start_time ||
      !newSlot.end_time ||
      !newSlot.subject ||
      !newSlot.teacher
    ) {
      alert("Please fill all required fields: Class, Day, Start Time, End Time, Subject, and Teacher")
      return
    }

    try {
      const data = {
        class_obj: Number.parseInt(newSlot.class_obj),
        day: newSlot.day,
        start_time: newSlot.start_time,
        end_time: newSlot.end_time,
        subject: Number.parseInt(newSlot.subject),
        teacher: newSlot.teacher ? Number.parseInt(newSlot.teacher) : null,
        venue: newSlot.venue || "",
      }

      console.log("[v0] Creating timetable with data:", JSON.stringify(data, null, 2))

      const response = await academicsAPI.createTimetable(data)
      console.log("[v0] Timetable created successfully:", response.data)

      setNewSlot({ class_obj: "", day: "monday", start_time: "", end_time: "", subject: "", teacher: "", venue: "" })
      setShowForm(false)
      await fetchData()
      alert("Timetable slot created successfully!")
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.subject?.[0] ||
        error?.response?.data?.teacher?.[0] ||
        Object.values(error?.response?.data || {})?.[0] ||
        error?.message ||
        "Failed to create timetable"

      console.error("[v0] Failed to create timetable slot:", {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message,
        errorMessage,
      })
      alert(`Error: ${errorMessage}`)
    }
  }

  const days = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ]

  const getTeacherName = (id: number) => {
    const teacher = teachers.find((t) => (t.user?.id || t.id) === id)
    return teacher?.user?.get_full_name?.() || teacher?.first_name
      ? `${teacher?.first_name} ${teacher?.last_name}`
      : `Teacher ${id}`
  }

  const getClassName = (id: number) => {
    const classObj = classes.find((c) => c.id === id)
    return classObj?.name || `Class ${id}`
  }

  const getSubjectName = (id: number) => {
    const subject = subjects.find((s) => s.id === id)
    return subject?.name || subject?.code || `Subject ${id}`
  }

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
                value={newSlot.class_obj}
                onChange={(e) => setNewSlot({ ...newSlot, class_obj: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={newSlot.day}
                onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                {days.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={newSlot.start_time}
                onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="Start Time"
              />
              <input
                type="time"
                value={newSlot.end_time}
                onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="End Time"
              />
              <select
                value={newSlot.subject}
                onChange={(e) => setNewSlot({ ...newSlot, subject: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
              <select
                value={newSlot.teacher}
                onChange={(e) => setNewSlot({ ...newSlot, teacher: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Select Teacher</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.user?.id || t.id}>
                    {t.user?.first_name ? `${t.user.first_name} ${t.user.last_name}` : t.first_name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newSlot.venue}
                onChange={(e) => setNewSlot({ ...newSlot, venue: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="Venue"
              />
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
                  <th className="text-left py-2 px-2">Venue</th>
                </tr>
              </thead>
              <tbody>
                {timetable.map((slot) => (
                  <tr key={slot.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2 font-medium">{getClassName(slot.class_obj)}</td>
                    <td className="py-2 px-2 capitalize">{slot.day}</td>
                    <td className="py-2 px-2">
                      {slot.start_time} - {slot.end_time}
                    </td>
                    <td className="py-2 px-2">{getSubjectName(slot.subject)}</td>
                    <td className="py-2 px-2">{getTeacherName(slot.teacher)}</td>
                    <td className="py-2 px-2">{slot.venue || "N/A"}</td>
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
