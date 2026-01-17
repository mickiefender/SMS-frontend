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

interface Teacher {
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
  employee_id?: string
  qualification?: string
  experience_years?: number
}

export function TeachersManagement() {
  const { user } = useAuthContext()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    employee_id: "",
    qualification: "",
    experience_years: 0,
  })

  const fetchTeachers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await usersAPI.teachers();
      const data = response.data.results || response.data || []
      setTeachers(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error("[v0] Failed to fetch teachers:", err?.response?.data || err)
      setError(err?.response?.data?.detail || err?.message || "Failed to load teachers")
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
          setError("No school associated with your account. Please contact support.")
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
        employee_id: "",
        qualification: "",
        experience_years: 0,
      })
      fetchTeachers()
    } catch (err: any) {
      console.error("[v0] Failed to save teacher:", err?.response?.data || err)
      const errorData = err?.response?.data
      let errorMsg = "Failed to save teacher"
      if (errorData) {
        if (typeof errorData === "string") {
          errorMsg = errorData
        } else if (errorData.error) {
          errorMsg = errorData.error
        } else if (errorData.detail) {
          errorMsg = errorData.detail
        } else if (errorData.email) {
          errorMsg = `Email: ${errorData.email}`
        } else if (errorData.username) {
          errorMsg = `Username: ${errorData.username}`
        } else {
          errorMsg = JSON.stringify(errorData)
        }
      }
      setError(errorMsg)
    }
  }

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    const userData = teacher.user || teacher
    setFormData({
      username: userData.username || "",
      email: userData.email || "",
      first_name: userData.first_name || "",
      last_name: userData.last_name || "",
      password: "",
      employee_id: teacher.employee_id || "",
      qualification: teacher.qualification || "",
      experience_years: teacher.experience_years || 0,
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this teacher?")) {
      try {
        await usersAPI.deleteTeacher(id)
        fetchTeachers()
      } catch (err: any) {
        console.error("[v0] Failed to delete teacher:", err)
        setError(err?.response?.data?.detail || err?.message || "Failed to delete teacher")
      }
    }
  }

  const getTeacherName = (teacher: Teacher) => {
    if (teacher.user) {
      return `${teacher.user.first_name || ""} ${teacher.user.last_name || ""}`.trim() || teacher.user.username
    }
    return `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim() || teacher.username || "N/A"
  }

  const getTeacherEmail = (teacher: Teacher) => {
    return teacher.user?.email || teacher.email || "N/A"
  }

  if (loading) {
    return <div className="text-center py-4">Loading teachers...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Teachers Management</CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={() => {
                  setEditingTeacher(null)
                  setFormData({
                    username: "",
                    email: "",
                    first_name: "",
                    last_name: "",
                    password: "",
                    employee_id: "",
                    qualification: "",
                    experience_years: 0,
                  })
                  setError(null)
                }}
              >
                Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTeacher ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
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
                  <Label htmlFor="employee_id">Employee ID</Label>
                  <Input
                    id="employee_id"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="qualification">Qualification</Label>
                  <Input
                    id="qualification"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="experience_years">Experience (Years)</Label>
                  <Input
                    id="experience_years"
                    type="number"
                    value={formData.experience_years}
                    onChange={(e) =>
                      setFormData({ ...formData, experience_years: Number.parseInt(e.target.value) || 0 })
                    }
                  />
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
                <Button type="submit" className="w-full">
                  {editingTeacher ? "Update Teacher" : "Create Teacher"}
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
                <th className="text-left py-2 px-2">Employee ID</th>
                <th className="text-left py-2 px-2">Qualification</th>
                <th className="text-left py-2 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted-foreground">
                    No teachers found. Add your first teacher.
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr key={teacher.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2">{getTeacherName(teacher)}</td>
                    <td className="py-2 px-2">{getTeacherEmail(teacher)}</td>
                    <td className="py-2 px-2">{teacher.employee_id || "N/A"}</td>
                    <td className="py-2 px-2">{teacher.qualification || "N/A"}</td>
                    <td className="py-2 px-2">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(teacher)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(teacher.id)}>
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
