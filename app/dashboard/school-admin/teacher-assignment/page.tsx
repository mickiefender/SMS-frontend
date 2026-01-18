"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { academicsAPI, usersAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, Trash2, Edit2, Search, Plus } from "lucide-react"
import { Suspense } from "react"

interface ClassSubject {
  id: number
  class_obj: number
  class_name: string
  subject: number
  subject_name: string
  subject_code: string
  teacher: number | null
  teacher_name: string | null
  created_at: string
}

interface Teacher {
  id: number
  user: number
  first_name: string
  last_name: string
  email: string
  user_email?: string
}

interface ClassData {
  id: number
  name: string
}

interface Subject {
  id: number
  name: string
  code: string
}

function TeacherAssignmentsContent() {
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classes, setClasses] = useState<ClassData[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isOpen, setIsOpen] = useState(false)
  const [editingClassSubject, setEditingClassSubject] = useState<ClassSubject | null>(null)
  const [formData, setFormData] = useState({ class_obj: "", subject: "", teacher: "" })

  const itemsPerPage = 10

  const fetchData = async () => {
    try {
      setLoading(true)
      const [csRes, teachRes, classRes, subjRes] = await Promise.all([
        academicsAPI.classSubjects(),
        usersAPI.teachers(),
        academicsAPI.classes(),
        academicsAPI.subjects(),
      ])

      console.log("[v0] Teachers response:", teachRes.data)
      setClassSubjects(csRes.data.results || csRes.data || [])
      setTeachers(teachRes.data.results || teachRes.data || [])
      setClasses(classRes.data.results || classRes.data || [])
      setSubjects(subjRes.data.results || subjRes.data || [])
      setError(null)
    } catch (err: any) {
      console.error("[v0] Failed to fetch data:", err?.response?.data || err?.message)
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!formData.class_obj || !formData.subject) {
        setError("Please select a class and subject")
        return
      }

      const data = {
        class_obj: Number.parseInt(formData.class_obj),
        subject: Number.parseInt(formData.subject),
        teacher: formData.teacher ? Number.parseInt(formData.teacher) : null,
      }

      console.log("[v0] Submitting class subject data:", data)

      if (editingClassSubject) {
        await academicsAPI.updateClassSubject(editingClassSubject.id, data)
      } else {
        await academicsAPI.createClassSubject(data)
      }

      setIsOpen(false)
      setEditingClassSubject(null)
      setFormData({ class_obj: "", subject: "", teacher: "" })
      setError(null)
      fetchData()
    } catch (err: any) {
      console.log("[v0] Error details:", err?.response?.data)
      setError(err?.response?.data?.detail || JSON.stringify(err?.response?.data) || "Failed to save assignment")
    }
  }

  const handleEdit = (cs: ClassSubject) => {
    setEditingClassSubject(cs)
    setFormData({
      class_obj: cs.class_obj.toString(),
      subject: cs.subject.toString(),
      teacher: cs.teacher?.toString() || "",
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to remove this teacher assignment?")) {
      try {
        await academicsAPI.deleteClassSubject(id)
        fetchData()
      } catch (err) {
        setError("Failed to delete assignment")
      }
    }
  }

  const filteredClassSubjects = classSubjects.filter(
    (cs) =>
      cs.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cs.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cs.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false,
  )

  const totalPages = Math.ceil(filteredClassSubjects.length / itemsPerPage)
  const paginatedClassSubjects = filteredClassSubjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-purple-700">Teacher Assignments</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => {
                setEditingClassSubject(null)
                setFormData({ class_obj: "", subject: "", teacher: "" })
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Assign Teacher
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingClassSubject ? "Edit Assignment" : "Assign Teacher to Class-Subject"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="class_obj">Class</Label>
                <select
                  id="class_obj"
                  value={formData.class_obj}
                  onChange={(e) => setFormData({ ...formData, class_obj: e.target.value })}
                  className="w-full border rounded px-3 py-2"
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
                <Label htmlFor="subject">Subject</Label>
                <select
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full border rounded px-3 py-2"
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
                <Label htmlFor="teacher">Teacher (Optional)</Label>
                <select
                  id="teacher"
                  value={formData.teacher}
                  onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Teacher (Optional)</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.user}>
                      {t.first_name} {t.last_name} ({t.email || t.user_email})
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                {editingClassSubject ? "Update" : "Assign"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-6 bg-gray-100 rounded-lg px-4 py-2">
          <Search className="w-5 h-5 text-gray-500" />
          <Input
            placeholder="Search by class, subject, or teacher..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="border-0 bg-transparent focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-purple-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-purple-700">CLASS</th>
                <th className="px-4 py-3 text-left font-semibold text-purple-700">SUBJECT</th>
                <th className="px-4 py-3 text-left font-semibold text-purple-700">SUBJECT CODE</th>
                <th className="px-4 py-3 text-left font-semibold text-purple-700">ASSIGNED TEACHER</th>
                <th className="px-4 py-3 text-left font-semibold text-purple-700">CREATED DATE</th>
                <th className="px-4 py-3 text-left font-semibold text-purple-700">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClassSubjects.map((cs) => (
                <tr key={cs.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{cs.class_name}</td>
                  <td className="px-4 py-3">{cs.subject_name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{cs.subject_code}</td>
                  <td className="px-4 py-3">
                    {cs.teacher_name ? (
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs">
                        {cs.teacher_name}
                      </span>
                    ) : (
                      <span className="text-gray-500 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{new Date(cs.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(cs)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cs.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages} | Total: {filteredClassSubjects.length}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
              <Button
                key={i + 1}
                variant={currentPage === i + 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(i + 1)}
                className={currentPage === i + 1 ? "bg-purple-600" : ""}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TeacherAssignmentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeacherAssignmentsContent />
    </Suspense>
  )
}
