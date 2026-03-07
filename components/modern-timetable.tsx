"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Grid3X3, 
  List,
  Building2,
  User,
  MapPin,
  BookOpen,
  Filter,
  X
} from "lucide-react"
import { academicsAPI, usersAPI } from "@/lib/api"
import { useAuthContext } from "@/lib/auth-context"
import { CardLoader } from "@/components/circular-loader"

// Days configuration
const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday", short: "MON" },
  { value: "tuesday", label: "Tuesday", short: "TUE" },
  { value: "wednesday", label: "Wednesday", short: "WED" },
  { value: "thursday", label: "Thursday", short: "THU" },
  { value: "friday", label: "Friday", short: "FRI" },
  { value: "saturday", label: "Saturday", short: "SAT" },
  { value: "sunday", label: "Sunday", short: "SUN" },
]

// Time slots
const TIME_SLOTS = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", 
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00"
]

// Professional subject colors palette
const SUBJECT_COLORS = [
  { bg: "bg-indigo-100", border: "border-indigo-300", text: "text-indigo-700", ring: "ring-indigo-500" },
  { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-700", ring: "ring-blue-500" },
  { bg: "bg-cyan-100", border: "border-cyan-300", text: "text-cyan-700", ring: "ring-cyan-500" },
  { bg: "bg-teal-100", border: "border-teal-300", text: "text-teal-700", ring: "ring-teal-500" },
  { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-700", ring: "ring-emerald-500" },
  { bg: "bg-green-100", border: "border-green-300", text: "text-green-700", ring: "ring-green-500" },
  { bg: "bg-lime-100", border: "border-lime-300", text: "text-lime-700", ring: "ring-lime-500" },
  { bg: "bg-yellow-100", border: "border-yellow-300", text: "text-yellow-700", ring: "ring-yellow-500" },
  { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-700", ring: "ring-amber-500" },
  { bg: "bg-orange-100", border: "border-orange-300", text: "text-orange-700", ring: "ring-orange-500" },
  { bg: "bg-red-100", border: "border-red-300", text: "text-red-700", ring: "ring-red-500" },
  { bg: "bg-rose-100", border: "border-rose-300", text: "text-rose-700", ring: "ring-rose-500" },
  { bg: "bg-pink-100", border: "border-pink-300", text: "text-pink-700", ring: "ring-pink-500" },
  { bg: "bg-fuchsia-100", border: "border-fuchsia-300", text: "text-fuchsia-700", ring: "ring-fuchsia-500" },
  { bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-700", ring: "ring-purple-500" },
  { bg: "bg-violet-100", border: "border-violet-300", text: "text-violet-700", ring: "ring-violet-500" },
]

// Day header colors
const DAY_COLORS: { [key: string]: { bg: string; text: string } } = {
  monday: { bg: "bg-indigo-50", text: "text-indigo-700" },
  tuesday: { bg: "bg-blue-50", text: "text-blue-700" },
  wednesday: { bg: "bg-cyan-50", text: "text-cyan-700" },
  thursday: { bg: "bg-teal-50", text: "text-teal-700" },
  friday: { bg: "bg-emerald-50", text: "text-emerald-700" },
  saturday: { bg: "bg-amber-50", text: "text-amber-700" },
  sunday: { bg: "bg-rose-50", text: "text-rose-700" },
}

interface TimetableEntry {
  id: number
  class_obj: number | { id: number; name: string }
  class_name?: string
  subject: number | { id: number; name: string; code?: string }
  subject_name?: string
  subject_code?: string
  teacher: number | { id: number; user?: { first_name: string; last_name: string }; first_name?: string; last_name?: string }
  teacher_name?: string
  day: string
  start_time: string
  end_time: string
  venue?: string
}

interface ClassData {
  id: number
  name: string
}

interface SubjectData {
  id: number
  name: string
  code?: string
}

interface TeacherData {
  id: number
  first_name?: string
  last_name?: string
  user?: { first_name: string; last_name: string }
}

export function ModernTimetable() {
  const { user } = useAuthContext()
  const [timetables, setTimetables] = useState<TimetableEntry[]>([])
  const [classes, setClasses] = useState<ClassData[]>([])
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [teachers, setTeachers] = useState<TeacherData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [selectedDay, setSelectedDay] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null)
  const [formData, setFormData] = useState({
    class_obj: "",
    subject: "",
    teacher: "",
    day: "",
    start_time: "",
    end_time: "",
    venue: "",
  })

  const isAdmin = user?.role === "school_admin"

  const fetchData = async () => {
    try {
      setLoading(true)
      const [timetablesRes, classesRes, subjectsRes, teachersRes] = await Promise.all([
        academicsAPI.timetables(),
        academicsAPI.classes(),
        academicsAPI.subjects(),
        usersAPI.teachers(),
      ])

      setTimetables(timetablesRes.data.results || timetablesRes.data || [])
      setClasses(classesRes.data.results || classesRes.data || [])
      setSubjects(subjectsRes.data.results || subjectsRes.data || [])
      setTeachers(teachersRes.data.results || teachersRes.data || [])
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filter timetables
  const filteredTimetables = timetables.filter((entry) => {
    const classId = typeof entry.class_obj === 'object' ? entry.class_obj?.id : entry.class_obj
    const matchesClass = selectedClass === "all" || classId?.toString() === selectedClass
    const matchesDay = selectedDay === "all" || entry.day.toLowerCase() === selectedDay
    const subjectName = entry.subject_name || (typeof entry.subject === 'object' ? entry.subject?.name : '')
    const teacherName = entry.teacher_name || (typeof entry.teacher === 'object' ? `${entry.teacher?.user?.first_name || entry.teacher?.first_name || ''} ${entry.teacher?.user?.last_name || entry.teacher?.last_name || ''}` : '')
    const matchesSearch = !searchTerm || 
      subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.venue || "").toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesClass && matchesDay && matchesSearch
  })

  // Get unique time slots from filtered data
  const getTimeSlots = () => {
    const times = new Set<string>()
    filteredTimetables.forEach(entry => {
      if (entry.start_time && entry.end_time) {
        times.add(entry.start_time.substring(0, 5))
      }
    })
    return Array.from(times).sort()
  }

  // Get class at specific day and time
  const getClassAtTime = (day: string, time: string) => {
    const timeHour = time.split(":")[0]
    return filteredTimetables.find(entry => {
      const entryDay = entry.day.toLowerCase()
      const entryTime = entry.start_time.substring(0, 5)
      return entryDay === day.toLowerCase() && entryTime.startsWith(timeHour.split(":")[0])
    })
  }

  // Get subject color
  const getSubjectColor = (subjectId: number) => {
    const colorIndex = subjectId % SUBJECT_COLORS.length
    return SUBJECT_COLORS[colorIndex]
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const payload = {
      class_obj: formData.class_obj ? parseInt(formData.class_obj) : null,
      subject: formData.subject ? parseInt(formData.subject) : null,
      teacher: formData.teacher ? parseInt(formData.teacher) : null,
      day: formData.day,
      start_time: formData.start_time,
      end_time: formData.end_time,
      venue: formData.venue,
    }

    try {
      if (editingEntry) {
        await academicsAPI.updateTimetable(editingEntry.id, payload)
      } else {
        await academicsAPI.createTimetable(payload)
      }
      setIsDialogOpen(false)
      resetForm()
      fetchData()
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to save timetable entry")
    }
  }

  // Handle edit
  const handleEdit = (entry: TimetableEntry) => {
    const classId = typeof entry.class_obj === 'object' ? entry.class_obj?.id : entry.class_obj
    const subjectId = typeof entry.subject === 'object' ? entry.subject?.id : entry.subject
    const teacherId = typeof entry.teacher === 'object' ? entry.teacher?.id : entry.teacher
    
    setFormData({
      class_obj: classId?.toString() || "",
      subject: subjectId?.toString() || "",
      teacher: teacherId?.toString() || "",
      day: entry.day.toLowerCase(),
      start_time: entry.start_time,
      end_time: entry.end_time,
      venue: entry.venue || "",
    })
    setEditingEntry(entry)
    setIsDialogOpen(true)
  }

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this timetable entry?")) return
    try {
      await academicsAPI.deleteTimetable(id)
      fetchData()
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to delete entry")
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      class_obj: "",
      subject: "",
      teacher: "",
      day: "",
      start_time: "",
      end_time: "",
      venue: "",
    })
    setEditingEntry(null)
  }

  // Get display name helpers
  const getClassName = (entry: TimetableEntry) => {
    if (entry.class_name) return entry.class_name
    if (typeof entry.class_obj === 'object') return entry.class_obj?.name
    return classes.find(c => c.id === entry.class_obj)?.name || `Class ${entry.class_obj}`
  }

  const getSubjectName = (entry: TimetableEntry) => {
    if (entry.subject_name) return entry.subject_name
    if (typeof entry.subject === 'object') return entry.subject?.name
    return subjects.find(s => s.id === entry.subject)?.name || `Subject ${entry.subject}`
  }

  const getTeacherName = (entry: TimetableEntry) => {
    if (entry.teacher_name) return entry.teacher_name
    if (typeof entry.teacher === 'object') {
      const t = entry.teacher
      return t?.user ? `${t.user.first_name} ${t.user.last_name}` : `${t?.first_name || ''} ${t?.last_name || ''}`
    }
    const teacher = teachers.find(t => t.id === entry.teacher)
    return teacher ? `${teacher.first_name} ${teacher.last_name}` : `Teacher ${entry.teacher}`
  }

  const getSubjectId = (entry: TimetableEntry) => {
    if (typeof entry.subject === 'object') return entry.subject?.id
    return entry.subject
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
        <CardContent className="p-6">
          <CardLoader />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white pb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calendar className="w-6 h-6" />
              Timetable Management
            </CardTitle>
            <CardDescription className="text-indigo-100 mt-1">
              Manage class schedules and weekly timetables
            </CardDescription>
          </div>
          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button className="bg-white text-indigo-600 hover:bg-indigo-50 gap-2">
                  <Plus className="w-4 h-4" />
                  Add Slot
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingEntry ? "Edit Timetable Entry" : "Create Timetable Entry"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="class">Class</Label>
                      <Select 
                        value={formData.class_obj} 
                        onValueChange={(value) => setFormData({ ...formData, class_obj: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id.toString()}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Select 
                        value={formData.subject} 
                        onValueChange={(value) => setFormData({ ...formData, subject: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subj) => (
                            <SelectItem key={subj.id} value={subj.id.toString()}>
                              {subj.code ? `${subj.code} - ` : ""}{subj.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teacher">Teacher</Label>
                      <Select 
                        value={formData.teacher} 
                        onValueChange={(value) => setFormData({ ...formData, teacher: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((t) => (
                            <SelectItem key={t.id} value={t.id.toString()}>
                              {t.user ? `${t.user.first_name} ${t.user.last_name}` : `${t.first_name} ${t.last_name}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="day">Day</Label>
                      <Select 
                        value={formData.day} 
                        onValueChange={(value) => setFormData({ ...formData, day: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day) => (
                            <SelectItem key={day.value} value={day.value}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="start_time">Start Time</Label>
                      <Select 
                        value={formData.start_time} 
                        onValueChange={(value) => setFormData({ ...formData, start_time: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end_time">End Time</Label>
                      <Select 
                        value={formData.end_time} 
                        onValueChange={(value) => setFormData({ ...formData, end_time: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="venue">Venue / Room</Label>
                      <Input
                        id="venue"
                        placeholder="e.g., Room 101, Lab A"
                        value={formData.venue}
                        onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                      {editingEntry ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>

      {/* Filters */}
      <CardContent className="p-4 bg-slate-50 border-b">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search subjects, teachers, venues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>

          {/* Class Filter */}
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-full md:w-48 bg-white">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id.toString()}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Day Filter */}
          <Select value={selectedDay} onValueChange={setSelectedDay}>
            <SelectTrigger className="w-full md:w-40 bg-white">
              <SelectValue placeholder="All Days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Days</SelectItem>
              {DAYS_OF_WEEK.map((day) => (
                <SelectItem key={day.value} value={day.value}>
                  {day.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex rounded-lg bg-white p-1 border">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:text-slate-700"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardContent>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <span className="text-red-700 text-sm">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Content */}
      <CardContent className="p-4">
        {filteredTimetables.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-600">No timetable entries found</h3>
            <p className="text-slate-500 mt-1">Try adjusting your filters or add new entries</p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Grid Header */}
              <div className="grid gap-1" style={{ gridTemplateColumns: "80px repeat(7, 1fr)" }}>
                <div className="p-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 rounded-tl-lg">
                  Time
                </div>
                {DAYS_OF_WEEK.map((day) => (
                  <div
                    key={day.value}
                    className={`p-2 text-center text-xs font-semibold uppercase tracking-wider rounded-t-lg ${DAY_COLORS[day.value]?.bg || 'bg-slate-100'} ${DAY_COLORS[day.value]?.text || 'text-slate-600'}`}
                  >
                    {day.short}
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              {getTimeSlots().map((time) => (
                <div key={time} className="grid gap-1" style={{ gridTemplateColumns: "80px repeat(7, 1fr)" }}>
                  <div className="p-2 text-center text-xs font-medium text-slate-600 bg-slate-50 border-t">
                    {time}
                  </div>
                  {DAYS_OF_WEEK.map((day) => {
                    const entry = getClassAtTime(day.value, time)
                    if (entry) {
                      const color = getSubjectColor(getSubjectId(entry))
                      return (
                        <div
                          key={`${day.value}-${time}`}
                          className={`p-2 rounded-lg border text-xs ${color.bg} ${color.border} ${color.text}`}
                        >
                          <div className="font-semibold truncate">{getSubjectName(entry)}</div>
                          <div className="flex items-center gap-1 mt-1 opacity-80">
                            <Clock className="w-3 h-3" />
                            {entry.start_time?.substring(0, 5)}-{entry.end_time?.substring(0, 5)}
                          </div>
                          {entry.venue && (
                            <div className="flex items-center gap-1 mt-1 opacity-80">
                              <MapPin className="w-3 h-3" />
                              {entry.venue}
                            </div>
                          )}
                          {isAdmin && (
                            <div className="flex gap-1 mt-2">
                              <button
                                onClick={() => handleEdit(entry)}
                                className="p-1 rounded hover:bg-white/50"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="p-1 rounded hover:bg-white/50"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    }
                    return (
                      <div
                        key={`${day.value}-${time}`}
                        className="p-2 border border-dashed border-slate-200 bg-slate-50/50 min-h-[80px]"
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filteredTimetables
              .sort((a, b) => {
                const dayOrder = DAYS_OF_WEEK.findIndex(d => d.value === a.day.toLowerCase())
                const dayOrderB = DAYS_OF_WEEK.findIndex(d => d.value === b.day.toLowerCase())
                if (dayOrder !== dayOrderB) return dayOrder - dayOrderB
                return a.start_time.localeCompare(b.start_time)
              })
              .map((entry, index) => {
                const color = getSubjectColor(getSubjectId(entry))
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border ${color.bg} ${color.border} ${color.text}`}
                  >
                    {/* Day Badge */}
                    <div className="flex-shrink-0 w-20 text-center">
                      <div className="text-lg font-bold capitalize">{entry.day.substring(0, 3)}</div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">
                        {entry.start_time?.substring(0, 5)} - {entry.end_time?.substring(0, 5)}
                      </span>
                    </div>

                    {/* Subject */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <BookOpen className="w-4 h-4 flex-shrink-0" />
                      <span className="font-semibold truncate">{getSubjectName(entry)}</span>
                    </div>

                    {/* Class */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Building2 className="w-4 h-4" />
                      <span className="truncate">{getClassName(entry)}</span>
                    </div>

                    {/* Teacher */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <User className="w-4 h-4" />
                      <span className="truncate hidden md:inline">{getTeacherName(entry)}</span>
                    </div>

                    {/* Venue */}
                    {entry.venue && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{entry.venue}</span>
                      </div>
                    )}

                    {/* Actions */}
                    {isAdmin && (
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(entry)}
                          className="h-8 w-8 p-0 hover:bg-white/50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(entry.id)}
                          className="h-8 w-8 p-0 hover:bg-white/50 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        )}

        {/* Summary Stats */}
        {filteredTimetables.length > 0 && (
          <div className="mt-6 pt-4 border-t flex flex-wrap gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
              <span>{filteredTimetables.length} total entries</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>{classes.length} classes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
              <span>{subjects.length} subjects</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-teal-500"></div>
              <span>{teachers.length} teachers</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ModernTimetable

