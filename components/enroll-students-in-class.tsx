"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, UserCheck } from "lucide-react"
import { academicsAPI, usersAPI } from "@/lib/api"
import { useAuthContext } from "@/lib/auth-context"

interface StudentClass {
  id: number
  class_obj: number
  class_name: string
  student: number
  student_name: string
  student_email: string
  is_active: boolean
  assigned_date: string
}

interface Student {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  user_name?: string
  user_email?: string
  user?: number
  user_data?: {
    id: number
    email: string
    first_name: string
    last_name: string
    username: string
    phone: string
    role: string
  }
}

export function EnrollStudentsInClass({ classId, className }: { classId: number; className: string }) {
  const { user } = useAuthContext()
  const [enrollments, setEnrollments] = useState<StudentClass[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({ student: "" })
  const [searchTerm, setSearchTerm] = useState("")

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [enrollmentsRes, studentsRes] = await Promise.all([
        academicsAPI.studentClasses(),
        usersAPI.students(),
      ])

      console.log("[v0] Students response:", studentsRes.data)
      console.log("[v0] Enrollments response:", enrollmentsRes.data)

      const enrollmentsList = enrollmentsRes.data.results || enrollmentsRes.data || []
      const filteredEnrollments = enrollmentsList.filter(
        (e: StudentClass) => e.class_obj === classId
      )
      
      const allStudents = studentsRes.data.results || studentsRes.data || []
      console.log("[v0] All students count:", allStudents.length)
      
      if (allStudents.length === 0) {
        setError("No students found. Please create students first before enrolling.")
      }
      
      setEnrollments(filteredEnrollments)
      setStudents(allStudents)
    } catch (err: any) {
      console.error("[v0] Error fetching data:", err)
      setError("Failed to load data. Please refresh.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [classId])

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.student) return

    try {
      console.log("[v0] Enrolling student - User ID:", formData.student)

      await academicsAPI.createStudentClass({
        class_obj: classId,
        student: formData.student,
      })
      setFormData({ student: "" })
      setIsOpen(false)
      setError(null)
      fetchData()
    } catch (err: any) {
      console.error("[v0] Enrollment error:", err)
      console.log("[v0] Error response status:", err?.response?.status)
      console.log("[v0] Error response data:", err?.response?.data)
      const errorMsg = err?.response?.data?.detail || 
                      err?.response?.data?.student?.[0] ||
                      err?.response?.data?.class_obj?.[0] ||
                      JSON.stringify(err?.response?.data) ||
                      err?.message ||
                      "Failed to enroll student"
      setError(errorMsg)
    }
  }

  const handleRemoveStudent = async (id: number) => {
    if (!confirm("Are you sure you want to remove this student from the class?")) return
    try {
      await academicsAPI.deleteStudentClass(id)
      fetchData()
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to remove student")
    }
  }

  const enrolledStudentIds = new Set(enrollments.map((e) => e.student))
  const availableStudents = students.filter((s) => {
    const userId = s.user_data?.id || s.user
    return !enrolledStudentIds.has(userId)
  })

  if (loading) return <div className="text-center py-8">Loading...</div>

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Students in {className}</CardTitle>
          {user?.role === "school_admin" && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> Enroll Student
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enroll Student in Class</DialogTitle>
                </DialogHeader>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                )}
                <form onSubmit={handleEnrollStudent} className="space-y-4">
                  {availableStudents.length === 0 ? (
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
                      <p className="font-semibold">No students available</p>
                      <p className="text-sm">
                        {students.length === 0 
                          ? "No students found in the system. Create students first in the Users management section."
                          : "All existing students are already enrolled in this class."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="student">Select Student</Label>
                      <Select value={formData.student} onValueChange={(value) => setFormData({ student: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a student" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStudents.map((student) => (
                            <SelectItem key={student.id} value={(student.user_data?.id || student.user).toString()}>
                              {student.first_name} {student.last_name} ({student.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={availableStudents.length === 0}>
                    Enroll Student
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {enrollments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No students enrolled in this class yet</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Enrolled Date</TableHead>
                  <TableHead>Status</TableHead>
                  {user?.role === "school_admin" && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">{enrollment.student_name}</TableCell>
                    <TableCell>{enrollment.student_email}</TableCell>
                    <TableCell>{new Date(enrollment.assigned_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={enrollment.is_active ? "default" : "secondary"}>
                        {enrollment.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {user?.role === "school_admin" && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStudent(enrollment.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
