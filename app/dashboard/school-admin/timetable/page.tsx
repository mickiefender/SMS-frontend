"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { academicsAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Trash2, Edit2, Search } from "lucide-react"

interface Timetable {
  id: number
  class_obj_id?: number
  subject_id?: number
  teacher_id?: number
  class_obj?: any
  subject?: any
  teacher?: any
  day: string
  start_time: string
  end_time: string
  venue?: string
}

export default function TimetablePage() {
  const [timetables, setTimetables] = useState<Timetable[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [editingTimetable, setEditingTimetable] = useState<Timetable | null>(null)
  const [formData, setFormData] = useState({
    class_obj_id: "",
    subject_id: "",
    teacher_id: "",
    day: "",
    start_time: "",
    end_time: "",
    venue: "",
  })

  const fetchTimetables = async () => {
    try {
      setLoading(true)
      const response = await academicsAPI.timetables()
      setTimetables(response.data.results || response.data || [])
    } catch (err) {
      console.error("Failed to load timetables")
    } finally {
      setLoading(false)
    }
  }

  const fetchDropdownData = async () => {
    try {
      const classesRes = await academicsAPI.classes()
      setClasses(classesRes.data.results || classesRes.data || [])
    } catch (err) {
      console.error("Failed to load classes:", err)
    }

    try {
      const subjectsRes = await academicsAPI.subjects()
      setSubjects(subjectsRes.data.results || subjectsRes.data || [])
    } catch (err) {
      console.error("Failed to load subjects:", err)
    }

    try {
      const teachersRes = await academicsAPI.teachers()
      setTeachers(teachersRes.data.results || teachersRes.data || [])
    } catch (err) {
      console.error("Failed to load teachers:", err)
    }
  }

  useEffect(() => {
    fetchTimetables()
    fetchDropdownData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      class_obj: formData.class_obj_id ? parseInt(formData.class_obj_id) : null,
      subject: formData.subject_id ? parseInt(formData.subject_id) : null,
      teacher: formData.teacher_id ? parseInt(formData.teacher_id) : null,
      day: formData.day,
      start_time: formData.start_time,
      end_time: formData.end_time,
      venue: formData.venue,
    }

    try {
      if (editingTimetable) {
        await academicsAPI.updateTimetable(editingTimetable.id, payload)
      } else {
        await academicsAPI.createTimetable(payload)
      }
      setIsOpen(false)
      setEditingTimetable(null)
      setFormData({
        class_obj_id: "",
        subject_id: "",
        teacher_id: "",
        day: "",
        start_time: "",
        end_time: "",
        venue: "",
      })
      fetchTimetables()
    } catch (err: any) {
      console.error("Failed to save timetable:", err)
      if (err.response?.data) {
        console.error("Error details:", err.response.data)
        alert(`Error: ${JSON.stringify(err.response.data)}`)
      }
    }
  }

  const handleEdit = (timetable: Timetable) => {
    setEditingTimetable(timetable)
    setFormData({
      class_obj_id: (timetable.class_obj_id || (typeof timetable.class_obj === 'object' ? timetable.class_obj?.id : timetable.class_obj))?.toString() || "",
      subject_id: (timetable.subject_id || (typeof timetable.subject === 'object' ? timetable.subject?.id : timetable.subject))?.toString() || "",
      teacher_id: (timetable.teacher_id || (typeof timetable.teacher === 'object' ? timetable.teacher?.id : timetable.teacher))?.toString() || "",
      day: timetable.day.toLowerCase(),
      start_time: timetable.start_time,
      end_time: timetable.end_time,
      venue: timetable.venue || "",
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure?")) {
      try {
        await academicsAPI.deleteTimetable(id)
        fetchTimetables()
      } catch (err) {
        console.error("Failed to delete timetable")
      }
    }
  }

  const filteredTimetables = timetables.filter(
    (t) =>
      t.day.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.start_time.includes(searchTerm) ||
      t.end_time.includes(searchTerm),
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-purple-700">Timetable</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">+ Add Slot</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTimetable ? "Edit Timetable" : "Add Timetable Slot"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Class</Label>
                <select
                  value={formData.class_obj_id}
                  onChange={(e) => setFormData({ ...formData, class_obj_id: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Subject</Label>
                <select
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Teacher</Label>
                <select
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name || t.name || t.username}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Day</Label>
                <select
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                  required
                >
                  <option value="">Select Day</option>
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Venue</Label>
                <Input value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} />
              </div>
              <Button type="submit" className="w-full bg-purple-600">
                {editingTimetable ? "Update" : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <Input
          placeholder="Search timetable..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-8">
        {classes.map((classObj) => {
          const classTimetables = filteredTimetables
            .filter((t) => {
              const tClassId = t.class_obj_id || (typeof t.class_obj === 'object' ? t.class_obj?.id : t.class_obj)
              return tClassId === classObj.id
            })
            .sort((a, b) => {
              const days: { [key: string]: number } = {
                monday: 1,
                tuesday: 2,
                wednesday: 3,
                thursday: 4,
                friday: 5,
                saturday: 6,
                sunday: 7,
              }
              const dayA = days[a.day.toLowerCase()] || 8
              const dayB = days[b.day.toLowerCase()] || 8
              if (dayA !== dayB) return dayA - dayB
              return a.start_time.localeCompare(b.start_time)
            })

          if (classTimetables.length === 0) return null

          return (
            <div key={classObj.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-purple-50 px-6 py-4 border-b border-purple-100">
                <h2 className="text-xl font-bold text-purple-800">{classObj.name}</h2>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Day</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Teacher</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Venue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {classTimetables.map((timetable) => {
                    const subjectId = timetable.subject_id || (typeof timetable.subject === 'object' ? timetable.subject?.id : timetable.subject)
                    const teacherId = timetable.teacher_id || (typeof timetable.teacher === 'object' ? timetable.teacher?.id : timetable.teacher)

                    const subject = subjects.find((s) => s.id === subjectId)
                    const teacher = teachers.find((t) => t.id === teacherId)

                    return (
                      <tr key={timetable.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium capitalize">{timetable.day}</td>
                        <td className="px-6 py-3">{subject?.name || "Unknown"}</td>
                        <td className="px-6 py-3">{teacher?.full_name || teacher?.username || "Unknown"}</td>
                        <td className="px-6 py-3">
                          {timetable.start_time.slice(0, 5)} - {timetable.end_time.slice(0, 5)}
                        </td>
                        <td className="px-6 py-3">{timetable.venue || "N/A"}</td>
                        <td className="px-6 py-3 flex gap-2">
                          <button onClick={() => handleEdit(timetable)} className="text-blue-600">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => handleDelete(timetable.id)} className="text-red-600">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        })}
        {filteredTimetables.length === 0 && <div className="text-center py-8 text-gray-500">No timetables found.</div>}
      </div>
    </div>
  )
}
