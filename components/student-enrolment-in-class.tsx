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
      const [enrollmentsRes, studentsRes] = await Promise.all([
        academicsAPI.studentClasses(),
        usersAPI.students(),
      ])

      const allEnrollments = enrollmentsRes.data.results || enrollmentsRes.data
      const filtered = Array.isArray(allEnrollments) ? allEnrollments.filter((e: any) => e.class_obj === classId) : []
      setEnrollments(filtered)

      const allStudents = studentsRes.data.results || studentsRes.data
      setStudents(Array.isArray(allStudents) ? allStudents : [])
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load data")
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
      await academicsAPI.createStudentClass({
        class_obj: classId,
        student: formData.student,
      })
      setFormData({ student: "" })
      setIsOpen(false)
      fetchData()
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to enroll student")
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
  const availableStudents = students.filter((s) => !enrolledStudentIds.has(s.id))

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
                <form onSubmit={handleEnrollStudent} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student">Select Student</Label>
                    <Select value={formData.student} onValueChange={(value) => setFormData({ student: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStudents.map((student) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.first_name} {student.last_name} ({student.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">
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
