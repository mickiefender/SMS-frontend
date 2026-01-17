"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { usersAPI } from "@/lib/api"
import { useAuthContext } from "@/lib/auth-context"

interface Student {
  id: number
  user?: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
  }
  username?: string
  email?: string
  first_name?: string
  last_name?: string
  is_active?: boolean
  student_id?: string
}

export function StudentsManagement() {
  const { user } = useAuthContext()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    student_id: "",
  })

  const fetchStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await usersAPI.students()
      const data = response.data.results || response.data || []
      setStudents(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error("[v0] Failed to fetch students:", err?.response?.data || err)
      setError(err?.response?.data?.detail || err?.message || "Failed to load students")
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
        const schoolId = user?.school_id || user?.school
        console.log("[v0] Current user:", user)
        console.log("[v0] School ID for registration:", schoolId)

        if (!schoolId) {
          setError("No school associated with your account. Please ensure you are logged in as a school admin.")
          return
        }
        await usersAPI.createStudent({ ...formData, school_id: schoolId })
      }
      setIsOpen(false)
      setEditingStudent(null)
      setFormData({ username: "", email: "", first_name: "", last_name: "", password: "", student_id: "" })
      fetchStudents()
    } catch (err: any) {
      console.error("[v0] Failed to save student - Full error:", err)
      const errorData = err?.response?.data
      let errorMsg = "Failed to save student"
      if (errorData) {
        if (typeof errorData === "string") {
          errorMsg = errorData
        } else if (errorData.error) {
          errorMsg = errorData.error
        } else if (errorData.detail) {
          errorMsg = errorData.detail
        } else if (errorData.email) {
          errorMsg = `Email: ${Array.isArray(errorData.email) ? errorData.email.join(", ") : errorData.email}`
        } else if (errorData.username) {
          errorMsg = `Username: ${Array.isArray(errorData.username) ? errorData.username.join(", ") : errorData.username}`
        } else if (errorData.password) {
          errorMsg = `Password: ${Array.isArray(errorData.password) ? errorData.password.join(", ") : errorData.password}`
        } else if (errorData.school) {
          errorMsg = `School: ${Array.isArray(errorData.school) ? errorData.school.join(", ") : errorData.school}`
        } else {
          errorMsg = JSON.stringify(errorData)
        }
      } else if (err?.message) {
        errorMsg = err.message
      }
      setError(errorMsg)
    }
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    const userData = student.user || student
    setFormData({
      username: userData.username || "",
      email: userData.email || "",
      first_name: userData.first_name || "",
      last_name: userData.last_name || "",
      password: "",
      student_id: student.student_id || "",
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this student?")) {
      try {
        await usersAPI.deleteStudent(id)
        fetchStudents()
      } catch (err: any) {
        console.error("[v0] Failed to delete student:", err)
        setError(err?.response?.data?.detail || err?.message || "Failed to delete student")
      }
    }
  }

  const getStudentName = (student: Student) => {
    if (student.user) {
      return `${student.user.first_name || ""} ${student.user.last_name || ""}`.trim() || student.user.username
    }
    return `${student.first_name || ""} ${student.last_name || ""}`.trim() || student.username || "N/A"
  }

  const getStudentEmail = (student: Student) => {
    return student.user?.email || student.email || "N/A"
  }

  if (loading) {
    return <div className="text-center py-4">Loading students...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Students Management</CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={() => {
                  setEditingStudent(null)
                  setFormData({ username: "", email: "", first_name: "", last_name: "", password: "", student_id: "" })
                  setError(null)
                }}
              >
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
              </DialogHeader>
              {error && <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
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
                <div>
                  <Label htmlFor="student_id">Student ID (Optional)</Label>
                  <Input
                    id="student_id"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
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
                <Button type="submit" className="w-full">
                  {editingStudent ? "Update Student" : "Create Student"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {error && !isOpen && (
          <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm mb-4">{error}</div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Name</th>
                <th className="text-left py-2 px-2">Email</th>
                <th className="text-left py-2 px-2">Student ID</th>
                <th className="text-left py-2 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-muted-foreground">
                    No students found. Add your first student.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2">{getStudentName(student)}</td>
                    <td className="py-2 px-2">{getStudentEmail(student)}</td>
                    <td className="py-2 px-2">{student.student_id || "N/A"}</td>
                    <td className="py-2 px-2">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(student)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(student.id)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
