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
  user_data?: {
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
  user_name?: string
  user_email?: string
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
  const [generatedStudentId, setGeneratedStudentId] = useState<string | null>(null)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resettingStudentId, setResettingStudentId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState("")

  const fetchStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await usersAPI.students()
      const data = response.data.results || response.data || []
      console.log("[v0] Students data received:", data)
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
        const schoolId = user?.school_id
        if (!schoolId) {
          setError("No school associated with your account. Please ensure you are logged in as a school admin.")
          return
        }
        const response = await usersAPI.createStudent({
          ...formData,
          username: formData.username.trim().replace(/\s+/g, ""),
          school_id: schoolId,
        })
        // Display the generated student ID
        if (response.data && response.data.student_id) {
          setGeneratedStudentId(response.data.student_id)
        }
      }
      // Only close dialog if editing, not creating
      if (editingStudent) {
        setIsOpen(false)
        setEditingStudent(null)
        setFormData({ username: "", email: "", first_name: "", last_name: "", password: "", student_id: "" })
        setGeneratedStudentId(null)
      }
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
    setFormData({
      username: student.username || student.user_data?.username || student.user?.username || "",
      email: student.email || student.user_email || student.user_data?.email || student.user?.email || "",
      first_name: student.first_name || student.user_data?.first_name || student.user?.first_name || "",
      last_name: student.last_name || student.user_data?.last_name || student.user?.last_name || "",
      password: "",
      student_id: student.student_id || "",
    })
    setIsOpen(true)
  }

  const handleResetPassword = async (id: number) => {
    try {
      await usersAPI.updateStudent(id, { password: newPassword })
      setResetDialogOpen(false)
      setResettingStudentId(null)
      setNewPassword("")
      setError(null)
      fetchStudents()
      // Optional: use toast notification here
      alert("Password reset successfully!")
    } catch (err: any) {
      console.error("[v0] Failed to reset password:", err)
      setError(err?.response?.data?.detail || err?.message || "Failed to reset password")
    }
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
    // Try flat fields first (from enhanced serializer)
    if (student.first_name || student.last_name) {
      return `${student.first_name || ""} ${student.last_name || ""}`.trim() || student.username || "N/A"
    }
    // Try user_name field
    if (student.user_name) {
      return student.user_name
    }
    // Try user_data nested object
    if (student.user_data) {
      return (
        `${student.user_data.first_name || ""} ${student.user_data.last_name || ""}`.trim() ||
        student.user_data.username
      )
    }
    // Try user nested object
    if (student.user) {
      return `${student.user.first_name || ""} ${student.user.last_name || ""}`.trim() || student.user.username
    }
    return student.username || "N/A"
  }

  const getStudentEmail = (student: Student) => {
    return student.email || student.user_email || student.user_data?.email || student.user?.email || "N/A"
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
                  setGeneratedStudentId(null)
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
              {generatedStudentId && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2">Student ID Generated Successfully!</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-400 font-mono">{generatedStudentId}</p>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-2">
                    Share this ID with the student. They will use it to login along with their password.
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-3 w-full" 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedStudentId)
                      setIsOpen(false)
                      setGeneratedStudentId(null)
                      setEditingStudent(null)
                      setFormData({ username: "", email: "", first_name: "", last_name: "", password: "", student_id: "" })
                    }}
                  >
                    Copy & Close
                  </Button>
                </div>
              )}
              {resetDialogOpen && (
                <div className="space-y-4">
                  <div>
                    <Label>Reset Password for Student ID: {resettingStudentId}</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 8 chars)"
                      required
                      minLength={8}
                    />
                    <p className="text-xs text-muted-foreground mt-1">This will immediately update the student&apos;s password.</p>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setResetDialogOpen(false)
                        setResettingStudentId(null)
                        setNewPassword("")
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button"
                      onClick={() => handleResetPassword(resettingStudentId!)}
                      disabled={newPassword.length < 8}
                    >
                      Reset Password
                    </Button>
                  </div>
                </div>
              )}

              {!generatedStudentId && !resetDialogOpen && (
                <>
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
                      <Label htmlFor="password">Password {editingStudent && "(Leave blank to keep current)"}</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={editingStudent ? "Enter new password or leave blank" : "Required for new students"}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {editingStudent 
                          ? "Leave empty to keep current password. Minimum 8 characters for reset." 
                          : "Minimum 8 characters required for new students."
                        }
                      </p>
                    </div>
                    <Button type="submit" className="w-full">
                      {editingStudent ? "Update Student" : "Create Student"}
                    </Button>
                  </form>
                </>
              )}
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
              <tr className="border-b border-border dark:border-slate-800">
                <th className="text-left py-2 px-2 text-muted-foreground dark:text-slate-400">Name</th>
                <th className="text-left py-2 px-2 text-muted-foreground dark:text-slate-400">Email</th>
                <th className="text-left py-2 px-2 text-muted-foreground dark:text-slate-400">Student ID</th>
                <th className="text-left py-2 px-2 text-muted-foreground dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-muted-foreground dark:text-slate-500">
                    No students found. Add your first student.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="border-b border-border dark:border-slate-800 hover:bg-muted/50 dark:hover:bg-slate-800/50">
                    <td className="py-2 px-2 text-foreground dark:text-slate-200">{getStudentName(student)}</td>
                    <td className="py-2 px-2 text-muted-foreground dark:text-slate-400">{getStudentEmail(student)}</td>
                    <td className="py-2 px-2 text-muted-foreground dark:text-slate-400">{student.student_id || "N/A"}</td>
                    <td className="py-2 px-2">
                      <div className="flex gap-2 flex-wrap">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(student)}>
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setResettingStudentId(student.id)
                            setResetDialogOpen(true)
                          }}
                        >
                          Reset Password
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
