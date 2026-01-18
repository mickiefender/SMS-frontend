"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { usersAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useAuthContext } from "@/lib/auth-context"
import { ChevronLeft, ChevronRight, Trash2, Edit2, Search } from "lucide-react"

interface Teacher {
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
  employee_id?: string
  qualification?: string
  experience?: number
  hire_date?: string
  is_active?: boolean
}

function TeachersPageContent() {
  const { user } = useAuthContext()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isOpen, setIsOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    phone: "",
    address: "",
    employee_id: "",
    qualification: "",
    experience: "",
  })

  const itemsPerPage = 10

  const fetchTeachers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await usersAPI.teachers()
      const data = response.data.results || response.data || []
      setTeachers(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError("Failed to load teachers")
      setTeachers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      if (editingTeacher) {
        await usersAPI.updateTeacher(editingTeacher.id, formData)
      } else {
        const schoolId = user?.school_id || user?.school
        if (!schoolId) {
          setError("No school associated with your account")
          return
        }
        await usersAPI.createTeacher({ ...formData, school_id: schoolId })
      }
      setIsOpen(false)
      setEditingTeacher(null)
      setFormData({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        phone: "",
        address: "",
        employee_id: "",
        qualification: "",
        experience: "",
      })
      fetchTeachers()
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to save teacher")
    }
  }

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setFormData({
      username: teacher.username || teacher.user_data?.username || teacher.user?.username || "",
      email: teacher.email || teacher.user_email || teacher.user_data?.email || teacher.user?.email || "",
      first_name: teacher.first_name || teacher.user_data?.first_name || teacher.user?.first_name || "",
      last_name: teacher.last_name || teacher.user_data?.last_name || teacher.user?.last_name || "",
      password: "",
      phone: teacher.phone || "",
      address: teacher.address || "",
      employee_id: teacher.employee_id || "",
      qualification: teacher.qualification || "",
      experience: teacher.experience?.toString() || "",
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this teacher?")) {
      try {
        await usersAPI.deleteTeacher(id)
        fetchTeachers()
      } catch (err: any) {
        setError("Failed to delete teacher")
      }
    }
  }

  const getTeacherName = (teacher: Teacher) => {
    if (teacher.first_name || teacher.last_name) {
      return `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim() || teacher.username || "N/A"
    }
    if (teacher.user_data) {
      return (
        `${teacher.user_data.first_name || ""} ${teacher.user_data.last_name || ""}`.trim() ||
        teacher.user_data.username
      )
    }
    if (teacher.user) {
      return `${teacher.user.first_name || ""} ${teacher.user.last_name || ""}`.trim() || teacher.user.username
    }
    return teacher.username || "N/A"
  }

  const getTeacherEmail = (teacher: Teacher) => {
    return teacher.email || teacher.user_email || teacher.user_data?.email || teacher.user?.email || "N/A"
  }

  const filteredTeachers = teachers.filter(
    (teacher) =>
      getTeacherName(teacher).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTeacherEmail(teacher).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.employee_id || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTeachers = filteredTeachers.slice(startIndex, startIndex + itemsPerPage)

  if (loading) {
    return <div className="text-center py-8 text-lg">Loading teachers...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-purple-700">Teachers List</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => {
                setEditingTeacher(null)
                setFormData({
                  username: "",
                  email: "",
                  first_name: "",
                  last_name: "",
                  password: "",
                  phone: "",
                  address: "",
                  employee_id: "",
                  qualification: "",
                  experience: "",
                })
                setError(null)
              }}
            >
              + Add Teachers
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTeacher ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="employee_id">Employee ID</Label>
                  <Input
                    id="employee_id"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="qualification">Qualification</Label>
                  <Input
                    id="qualification"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="experience">Experience (Years)</Label>
                  <Input
                    id="experience"
                    type="number"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  />
                </div>
              </div>
              {!editingTeacher && (
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
                {editingTeacher ? "Update Teacher" : "Create Teacher"}
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
            placeholder="Search by name or employee ID"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                <input type="checkbox" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Teachers Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Employee ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Qualification</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTeachers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No teachers found
                </td>
              </tr>
            ) : (
              paginatedTeachers.map((teacher) => (
                <tr key={teacher.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <input type="checkbox" />
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
                      <span className="font-medium text-gray-900">{getTeacherName(teacher)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-700">#{teacher.employee_id || "N/A"}</td>
                  <td className="px-6 py-3 text-gray-700">{teacher.qualification || "N/A"}</td>
                  <td className="px-6 py-3 text-gray-700">{teacher.phone || "N/A"}</td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(teacher)} className="text-blue-600 hover:text-blue-700">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(teacher.id)} className="text-red-600 hover:text-red-700">
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

export default function TeachersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeachersPageContent />
    </Suspense>
  )
}
