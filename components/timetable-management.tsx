"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { academicsAPI, usersAPI } from "@/lib/api"
import { CardLoader } from "@/components/circular-loader"
import { Plus, Calendar, Clock, BookOpen, User, MapPin, Building2, Edit2, Trash2, X } from "lucide-react"

interface TimeSlot {
  id: number
  class_obj: number
  class_obj_id?: number
  class_name?: string
  day: string
  start_time: string
  end_time: string
  subject: number
  subject_id?: number
  subject_name?: string
  subject_code?: string
  teacher: number
  teacher_id?: number
  teacher_name?: string
  venue?: string
}

const DAYS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
]

// Subject colors
const SUBJECT_COLORS = [
  "bg-indigo-100 border-indigo-300 text-indigo-700",
  "bg-blue-100 border-blue-300 text-blue-700",
  "bg-cyan-100 border-cyan-300 text-cyan-700",
  "bg-teal-100 border-teal-300 text-teal-700",
  "bg-emerald-100 border-emerald-300 text-emerald-700",
  "bg-green-100 border-green-300 text-green-700",
  "bg-yellow-100 border-yellow-300 text-yellow-700",
  "bg-orange-100 border-orange-300 text-orange-700",
  "bg-red-100 border-red-300 text-red-700",
  "bg-pink-100 border-pink-300 text-pink-700",
  "bg-purple-100 border-purple-300 text-purple-700",
  "bg-violet-100 border-violet-300 text-violet-700",
]

export function TimetableManagement() {
  const [timetable, setTimetable] = useState<TimeSlot[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null)
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

      const timetableData = timetablesRes.data.results || timetablesRes.data || []
      setTimetable(timetableData)
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

      if (editingSlot) {
        await academicsAPI.updateTimetable(editingSlot.id, data)
      } else {
        await academicsAPI.createTimetable(data)
      }

      setNewSlot({ class_obj: "", day: "monday", start_time: "", end_time: "", subject: "", teacher: "", venue: "" })
      setShowForm(false)
      setEditingSlot(null)
      await fetchData()
      alert(editingSlot ? "Timetable slot updated successfully!" : "Timetable slot created successfully!")
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

  const handleEdit = (slot: TimeSlot) => {
    setEditingSlot(slot)
    setNewSlot({
      class_obj: slot.class_obj?.toString() || slot.class_obj_id?.toString() || "",
      day: slot.day.toLowerCase(),
      start_time: slot.start_time,
      end_time: slot.end_time,
      subject: slot.subject?.toString() || slot.subject_id?.toString() || "",
      teacher: slot.teacher?.toString() || slot.teacher_id?.toString() || "",
      venue: slot.venue || "",
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this timetable slot?")) return
    try {
      await academicsAPI.deleteTimetable(id)
      await fetchData()
    } catch (error) {
      console.error("[v0] Failed to delete timetable slot:", error)
      alert("Failed to delete timetable slot")
    }
  }

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

  const getSubjectColor = (id: number) => {
    return SUBJECT_COLORS[id % SUBJECT_COLORS.length]
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingSlot(null)
    setNewSlot({ class_obj: "", day: "monday", start_time: "", end_time: "", subject: "", teacher: "", venue: "" })
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Timetable Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardLoader />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white pb-6">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calendar className="w-6 h-6" />
              Timetable Management
            </CardTitle>
            <CardDescription className="text-indigo-100 mt-1">
              Manage class schedules and weekly timetables
            </CardDescription>
          </div>
          <Button 
            size="sm" 
            onClick={() => setShowForm(!showForm)}
            className="bg-white text-indigo-600 hover:bg-indigo-50 gap-2"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cancel" : "Add Time Slot"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Form */}
          {showForm && (
            <div className="p-6 border rounded-xl bg-slate-50 space-y-4">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                {editingSlot ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingSlot ? "Edit Time Slot" : "Add New Time Slot"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-600">Class</Label>
                  <Select
                    value={newSlot.class_obj}
                    onValueChange={(value) => setNewSlot({ ...newSlot, class_obj: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-600">Day</Label>
                  <Select
                    value={newSlot.day}
                    onValueChange={(value) => setNewSlot({ ...newSlot, day: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-600">Start Time</Label>
                  <Input
                    type="time"
                    value={newSlot.start_time}
                    onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-600">End Time</Label>
                  <Input
                    type="time"
                    value={newSlot.end_time}
                    onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-600">Subject</Label>
                  <Select
                    value={newSlot.subject}
                    onValueChange={(value) => setNewSlot({ ...newSlot, subject: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.code ? `${s.code} - ` : ""}{s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-600">Teacher</Label>
                  <Select
                    value={newSlot.teacher}
                    onValueChange={(value) => setNewSlot({ ...newSlot, teacher: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((t) => (
                        <SelectItem key={t.id} value={t.user?.id?.toString() || t.id.toString()}>
                          {t.user?.first_name ? `${t.user.first_name} ${t.user.last_name}` : t.first_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <Label className="text-slate-600">Venue / Room</Label>
                  <Input
                    type="text"
                    value={newSlot.venue}
                    onChange={(e) => setNewSlot({ ...newSlot, venue: e.target.value })}
                    placeholder="e.g., Room 101, Lab A"
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={addSlot} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                  <Plus className="w-4 h-4" />
                  {editingSlot ? "Update Slot" : "Save Slot"}
                </Button>
                <Button size="sm" variant="outline" onClick={cancelForm}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            {timetable.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-600">No timetable entries</h3>
                <p className="text-slate-500 mt-1">Click "Add Time Slot" to create your first entry</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {timetable.map((slot) => {
                  const colorClass = getSubjectColor(slot.subject)
                  return (
                    <div
                      key={slot.id}
                      className={`flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-xl border ${colorClass}`}
                    >
                      {/* Day & Time */}
                      <div className="flex items-center gap-4 md:w-48 flex-shrink-0">
                        <div className="w-12 h-12 rounded-lg bg-white/50 flex items-center justify-center">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-semibold capitalize">{slot.day}</div>
                          <div className="text-xs opacity-80 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {slot.start_time} - {slot.end_time}
                          </div>
                        </div>
                      </div>

                      {/* Subject */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <BookOpen className="w-4 h-4 flex-shrink-0" />
                        <span className="font-semibold truncate">{getSubjectName(slot.subject)}</span>
                      </div>

                      {/* Class */}
                      <div className="flex items-center gap-2 md:w-32 flex-shrink-0">
                        <Building2 className="w-4 h-4 text-slate-500" />
                        <span className="truncate">{getClassName(slot.class_obj)}</span>
                      </div>

                      {/* Teacher */}
                      <div className="flex items-center gap-2 md:w-40 flex-shrink-0">
                        <User className="w-4 h-4 text-slate-500" />
                        <span className="truncate hidden md:inline">{getTeacherName(slot.teacher)}</span>
                      </div>

                      {/* Venue */}
                      {slot.venue && (
                        <div className="flex items-center gap-2 md:w-32 flex-shrink-0">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          <span className="truncate">{slot.venue}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-1 flex-shrink-0 md:ml-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(slot)}
                          className="h-8 w-8 p-0 hover:bg-white/50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(slot.id)}
                          className="h-8 w-8 p-0 hover:bg-white/50 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
