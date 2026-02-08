"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { usersAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useAuthContext } from "@/lib/auth-context"
import { ChevronLeft, ChevronRight, Trash2, Edit2, Search } from "lucide-react"

interface Student {
  id: number
  user?: { id: number; first_name: string; last_name: string; email: string; username: string }
  user_data?: { id: number; first_name: string; last_name: string; email: string; username: string }
  first_name?: string
  last_name?: string
  email?: string
  username?: string
  user_email?: string
  phone?: string
  address?: string
  date_of_birth?: string
  student_id?: string
  enrollment_date?: string
  is_active?: boolean
}

function StudentsPageContent() {
  const searchParams = useSearchParams()
  const { user } = useAuthContext()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isOpen, setIsOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    phone: "",
    address: "",
  })

  const itemsPerPage = 10

  const fetchStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await usersAPI.students()
      const data = response.data.results || response.data || []
      setStudents(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError("Failed to load students")
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      if (editingStudent) {
        await usersAPI.updateStudent(editingStudent.id, formData)
      } else {
        const schoolId = user?.school_id
        if (!schoolId) {
          setError("No school associated with your account")
          return
        }
        await usersAPI.createStudent({ ...formData, school_id: schoolId })
      }
      setIsOpen(false)
      setEditingStudent(null)
      setFormData({ username: "", email: "", first_name: "", last_name: "", password: "", phone: "", address: "" })
      fetchStudents()
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to save student")
    }
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setFormData({
      username: student.username || student.user_data?.username || student.user?.username || "",
      email: student.email || student.user_email || student.user_data?.email || student.user?.email || "",
      first_name: student.first_name || student.user_data?.first_name || student.user?.first_name || "",
      last_name: student.last_name || student.user_data?.last_name || student.user?.last_name || "",
      password: "",
      phone: student.phone || "",
      address: student.address || "",
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this student?")) {
      try {
        await usersAPI.deleteStudent(id)
        fetchStudents()
      } catch (err: any) {
        setError("Failed to delete student")
      }
    }
  }

  const getStudentName = (student: Student) => {
    if (student.first_name || student.last_name) {
      return `${student.first_name || ""} ${student.last_name || ""}`.trim() || student.username || "N/A"
    }
    if (student.user_data) {
      return (
        `${student.user_data.first_name || ""} ${student.user_data.last_name || ""}`.trim() ||
        student.user_data.username
      )
    }
    if (student.user) {
      return `${student.user.first_name || ""} ${student.user.last_name || ""}`.trim() || student.user.username
    }
    return student.username || "N/A"
  }

  const getStudentEmail = (student: Student) => {
    return student.email || student.user_email || student.user_data?.email || student.user?.email || "N/A"
  }

  const filteredStudents = students.filter(
    (student) =>
      getStudentName(student).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getStudentEmail(student).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.student_id || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage)

  if (loading) {
    return <div className="text-center py-8 text-lg">Loading students...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-purple-700">Students List</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => {
                setEditingStudent(null)
                setFormData({
                  username: "",
                  email: "",
                  first_name: "",
                  last_name: "",
                  password: "",
                  phone: "",
                  address: "",
                })
                setError(null)
              }}
            >
              + Add Students
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
            </DialogHeader>
            {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              {!editingStudent && (
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              )}
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                {editingStudent ? "Update Student" : "Create Student"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <Input
            placeholder="Search by name or roll"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                <input type="checkbox" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Students Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Roll</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No students found
                </td>
              </tr>
            ) : (
              paginatedStudents.map((student) => (
                <tr key={student.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <input type="checkbox" />
                  </td>
                  <td className="px-6 py-3">
                    <Link href={`/dashboard/school-admin/students/${student.id}`}>
                      <div className="flex items-center gap-3 cursor-pointer hover:text-purple-600">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-500" />
                        <span className="font-medium text-gray-900">{getStudentName(student)}</span>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-gray-700">#{student.student_id || "N/A"}</td>
                  <td className="px-6 py-3 text-gray-700">{student.address || "N/A"}</td>
                  <td className="px-6 py-3 text-gray-700">{student.phone || "N/A"}</td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(student)} className="text-blue-600 hover:text-blue-700">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:text-red-700">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
              className={currentPage === page ? "bg-purple-600 text-white" : ""}
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

export default function StudentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudentsPageContent />
    </Suspense>
  )
}
