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

interface StudentEnrollment {
  id: number
  student: number
  student_name: string
  student_email: string
  class_obj: number
  class_name: string
  subject: number
  subject_name: string
  enrollment_date: string
  is_active: boolean
}

interface Student {
  id: number
  user: number
  first_name: string
  last_name: string
  email: string
  user_email?: string
  user_name?: string
  user_data?: {
    id: number
    first_name: string
    last_name: string
    email: string
    username: string
  }
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

function StudentAssignmentsContent() {
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<ClassData[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isOpen, setIsOpen] = useState(false)
  const [editingEnrollment, setEditingEnrollment] = useState<StudentEnrollment | null>(null)
  const [formData, setFormData] = useState({ student: "", class_obj: "", subject: "" })

  const itemsPerPage = 10

  const fetchData = async () => {
    try {
      setLoading(true)
      const [enrollRes, studRes, classRes, subjRes] = await Promise.all([
        academicsAPI.enrollments(),
        usersAPI.students(),
        academicsAPI.classes(),
        academicsAPI.subjects(),
      ])

      setEnrollments(enrollRes.data.results || enrollRes.data || [])
      setStudents(studRes.data.results || studRes.data || [])
      setClasses(classRes.data.results || classRes.data || [])
      setSubjects(subjRes.data.results || subjRes.data || [])
    } catch (err) {
      console.error("Failed to fetch data:", err)
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
      if (!formData.student || !formData.class_obj || !formData.subject) {
        setError("Please select a student, class, and subject")
        return
      }

      const data = {
        student: Number.parseInt(formData.student),
        class_obj: Number.parseInt(formData.class_obj),
        subject: Number.parseInt(formData.subject),
      }

      console.log("[v0] Submitting enrollment data:", data)
      console.log("[v0] Student ID:", data.student, "Type:", typeof data.student)
      console.log("[v0] Class ID:", data.class_obj, "Type:", typeof data.class_obj)
      console.log("[v0] Subject ID:", data.subject, "Type:", typeof data.subject)

      if (editingEnrollment) {
        console.log("[v0] Updating enrollment:", editingEnrollment.id)
        await academicsAPI.updateEnrollment(editingEnrollment.id, data)
      } else {
        console.log("[v0] Creating new enrollment")
        await academicsAPI.createEnrollment(data)
      }

      setIsOpen(false)
      setEditingEnrollment(null)
      setFormData({ student: "", class_obj: "", subject: "" })
      setError(null)
      fetchData()
    } catch (err: any) {
      console.log("[v0] Error status:", err?.response?.status)
      console.log("[v0] Error data:", err?.response?.data)
      console.log("[v0] Full error:", err)
      setError(err?.response?.data?.detail || JSON.stringify(err?.response?.data) || "Failed to save enrollment")
    }
  }

  const handleEdit = (enrollment: StudentEnrollment) => {
    setEditingEnrollment(enrollment)
    setFormData({
      student: enrollment.student.toString(),
      class_obj: enrollment.class_obj.toString(),
      subject: enrollment.subject.toString(),
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to remove this student from the class?")) {
      try {
        await academicsAPI.deleteEnrollment(id)
        fetchData()
      } catch (err) {
        setError("Failed to delete enrollment")
      }
    }
  }

  const filteredEnrollments = enrollments.filter(
    (e) =>
      e.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.subject_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredEnrollments.length / itemsPerPage)
  const paginatedEnrollments = filteredEnrollments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-purple-700">Student Assignments</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => {
                setEditingEnrollment(null)
                setFormData({ student: "", class_obj: "", subject: "" })
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Assign Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEnrollment ? "Edit Assignment" : "Assign Student to Class"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="student">Student</Label>
                <select
                  id="student"
                  value={formData.student}
                  onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Select Student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.user}>
                      {s.first_name} {s.last_name} ({s.email || s.user_email})
                    </option>
                  ))}
                </select>
              </div>
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
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                {editingEnrollment ? "Update" : "Assign"}
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
            placeholder="Search by student name, class, or subject..."
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
                <th className="px-4 py-3 text-left font-semibold text-purple-700">STUDENT NAME</th>
                <th className="px-4 py-3 text-left font-semibold text-purple-700">EMAIL</th>
                <th className="px-4 py-3 text-left font-semibold text-purple-700">CLASS</th>
                <th className="px-4 py-3 text-left font-semibold text-purple-700">SUBJECT</th>
                <th className="px-4 py-3 text-left font-semibold text-purple-700">ENROLLMENT DATE</th>
                <th className="px-4 py-3 text-left font-semibold text-purple-700">STATUS</th>
                <th className="px-4 py-3 text-left font-semibold text-purple-700">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEnrollments.map((enrollment) => (
                <tr key={enrollment.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{enrollment.student_name}</td>
                  <td className="px-4 py-3">{enrollment.student_email}</td>
                  <td className="px-4 py-3">{enrollment.class_name}</td>
                  <td className="px-4 py-3">{enrollment.subject_name}</td>
                  <td className="px-4 py-3">{new Date(enrollment.enrollment_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${enrollment.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                    >
                      {enrollment.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(enrollment)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(enrollment.id)}
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
            Page {currentPage} of {totalPages} | Total: {filteredEnrollments.length}
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

export default function StudentAssignmentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudentAssignmentsContent />
    </Suspense>
  )
}
