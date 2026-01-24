"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, BookOpen } from "lucide-react"
import { academicsAPI } from "@/lib/api"
import { useAuthContext } from "@/lib/auth-context"

interface ClassSubjectTeacher {
  id: number
  class_obj: number
  class_name: string
  subject: number
  subject_name: string
  subject_code: string
  teacher: number
  teacher_name: string
  teacher_email: string
  is_active: boolean
}

interface ClassSubject {
  id: number
  subject: number
  subject_name: string
}

interface Teacher {
  id: number
  first_name: string
  last_name: string
  email: string
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

export function AssignSubjectTeachers({ classId, className }: { classId: number; className: string }) {
  const { user } = useAuthContext()
  const [subjectTeachers, setSubjectTeachers] = useState<ClassSubjectTeacher[]>([])
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({ subject: "", teacher: "" })

  const fetchData = async () => {
    try {
      setLoading(true)

      // Get class subjects
      const classSubjectsRes = await academicsAPI.classSubjects()
      const allClassSubjects = classSubjectsRes.data.results || classSubjectsRes.data
      const classSubjectsFiltered = Array.isArray(allClassSubjects)
        ? allClassSubjects.filter((cs: any) => cs.class_obj === classId)
        : []
      setClassSubjects(classSubjectsFiltered)

      // Get class subject teachers
      const subjectTeachersRes = await academicsAPI.classSubjectTeachers()
      const allSubjectTeachers = subjectTeachersRes.data.results || subjectTeachersRes.data
      const filtered = Array.isArray(allSubjectTeachers)
        ? allSubjectTeachers.filter((st: any) => st.class_obj === classId)
        : []
      setSubjectTeachers(filtered)

      // Get teachers - mock for now as we need to get from API
      setTeachers([]) // Will be populated from classSubjectTeachers or separate API
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [classId])

  const handleAssignSubjectTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.subject || !formData.teacher) return

    try {
      const subjectId = parseInt(formData.subject, 10)
      const teacherProfile = teachers.find(t => t.id.toString() === formData.teacher)
      
      if (isNaN(subjectId)) {
        setError("Invalid subject selected")
        return
      }

      if (!teacherProfile) {
        setError("Teacher not found")
        return
      }

      // Use the actual User ID from user_data, not the Profile ID
      const userId = teacherProfile.user_data?.id || teacherProfile.user
      if (!userId) {
        setError("Invalid teacher data - missing user ID")
        return
      }

      console.log("[v0] Assigning subject teacher - Teacher Profile ID:", teacherProfile.id, "User ID:", userId, "Subject ID:", subjectId)

      await academicsAPI.createClassSubjectTeacher({
        class_obj: classId,
        subject: subjectId,
        teacher: userId,
      })
      setFormData({ subject: "", teacher: "" })
      setIsOpen(false)
      setError(null)
      fetchData()
    } catch (err: any) {
      console.error("[v0] Assign subject teacher error:", err)
      console.log("[v0] Error response status:", err?.response?.status)
      console.log("[v0] Error response data:", err?.response?.data)
      const errorMsg = err?.response?.data?.detail || 
                      err?.response?.data?.subject?.[0] ||
                      err?.response?.data?.teacher?.[0] ||
                      err?.response?.data?.class_obj?.[0] ||
                      JSON.stringify(err?.response?.data) ||
                      err?.message ||
                      "Failed to assign subject teacher"
      setError(errorMsg)
    }
  }

  const handleRemove = async (id: number) => {
    if (!confirm("Are you sure you want to remove this assignment?")) return
    try {
      await academicsAPI.deleteClassSubjectTeacher(id)
      fetchData()
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to remove assignment")
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Subject Teachers
          </CardTitle>
          {user?.role === "school_admin" && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> Assign Teacher to Subject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Teacher to Subject</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAssignSubjectTeacher} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Select Subject</Label>
                    <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {classSubjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.subject.toString()}>
                            {subject.subject_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacher">Select Teacher</Label>
                    <Select value={formData.teacher} onValueChange={(value) => setFormData({ ...formData, teacher: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Teachers would be fetched from API - placeholder for now */}
                        <SelectItem value="1">Teacher 1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">
                    Assign Teacher
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {subjectTeachers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No teachers assigned to subjects yet</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Status</TableHead>
                  {user?.role === "school_admin" && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjectTeachers.map((st) => (
                  <TableRow key={st.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{st.subject_name}</p>
                        <p className="text-sm text-muted-foreground">{st.subject_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>{st.teacher_name}</TableCell>
                    <TableCell>
                      <Badge variant={st.is_active ? "default" : "secondary"}>
                        {st.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {user?.role === "school_admin" && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(st.id)}
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
