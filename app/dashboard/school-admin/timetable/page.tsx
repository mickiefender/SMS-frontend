"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { academicsAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, Trash2, Edit2, Search } from "lucide-react"

interface Timetable {
  id: number
  class_obj_id?: number
  subject_id?: number
  teacher_id?: number
  day: string
  start_time: string
  end_time: string
  venue?: string
}

export default function TimetablePage() {
  const [timetables, setTimetables] = useState<Timetable[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
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

  const itemsPerPage = 10

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

  useEffect(() => {
    fetchTimetables()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingTimetable) {
        await academicsAPI.updateTimetable(editingTimetable.id, formData)
      } else {
        await academicsAPI.createTimetable(formData)
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
    } catch (err) {
      console.error("Failed to save timetable")
    }
  }

  const handleEdit = (timetable: Timetable) => {
    setEditingTimetable(timetable)
    setFormData({
      class_obj_id: timetable.class_obj_id?.toString() || "",
      subject_id: timetable.subject_id?.toString() || "",
      teacher_id: timetable.teacher_id?.toString() || "",
      day: timetable.day,
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

  const totalPages = Math.ceil(filteredTimetables.length / itemsPerPage)
  const paginatedTimetables = filteredTimetables.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

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
                <Label>Class ID</Label>
                <Input
                  type="number"
                  value={formData.class_obj_id}
                  onChange={(e) => setFormData({ ...formData, class_obj_id: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Subject ID</Label>
                <Input
                  type="number"
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Teacher ID</Label>
                <Input
                  type="number"
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                />
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
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Day</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Start Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">End Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Venue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTimetables.map((timetable) => (
              <tr key={timetable.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 font-medium">{timetable.day}</td>
                <td className="px-6 py-3">{timetable.start_time}</td>
                <td className="px-6 py-3">{timetable.end_time}</td>
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
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">{itemsPerPage} / page</span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={18} />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
              className={currentPage === page ? "bg-purple-600" : ""}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>
    </div>
  )
}
