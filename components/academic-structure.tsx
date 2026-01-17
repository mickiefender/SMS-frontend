"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { academicsAPI, usersAPI } from "@/lib/api"
import { useAuthContext } from "@/lib/auth-context"

interface Class {
  id: number
  name: string
  level?: number
  level_name?: string
  capacity: number
  school?: number
}

interface Subject {
  id: number
  code: string
  name: string
  description?: string
  credit_hours: number
  school?: number
}

interface Level {
  id: number
  name: string
  order: number
}

interface Enrollment {
  id: number
  class_obj: number
  student: number
  subject: number
  student_name?: string
  is_active: boolean
}

interface ClassSubject {
  id: number
  class_obj: number
  subject: number
  teacher?: number
  subject_name?: string
  teacher_name?: string
}

export function AcademicStructure() {
  const { user } = useAuthContext()
  const [activeTab, setActiveTab] = useState<"classes" | "subjects" | "enrollments" | "assignments">("classes")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Data
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [levels, setLevels] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [classSubjects, setClassSubjects] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])

  // Dialogs
  const [showClassDialog, setShowClassDialog] = useState(false)
  const [showSubjectDialog, setShowSubjectDialog] = useState(false)
  const [showEnrollDialog, setShowEnrollDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)

  // Form data
  const [classForm, setClassForm] = useState({ name: "", level: "", capacity: 30 })
  const [subjectForm, setSubjectForm] = useState({ code: "", name: "", description: "", credit_hours: 3 })
  const [enrollForm, setEnrollForm] = useState({ class_obj: "", student: "", subject: "" })
  const [assignForm, setAssignForm] = useState({ class_obj: "", subject: "", teacher: "" })

  const schoolId = user?.school_id || user?.school

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      let classesData: any[] = []
      let subjectsData: any[] = []
      let enrollmentsData: any[] = []
      let classSubjectsData: any[] = []
      let studentsData: any[] = []
      let teachersData: any[] = []

      try {
        const classesRes = await academicsAPI.classes()
        classesData = classesRes.data.results || classesRes.data || []
      } catch (e) {
        console.error("[v0] Failed to fetch classes:", e)
      }

      try {
        const subjectsRes = await academicsAPI.subjects()
        subjectsData = subjectsRes.data.results || subjectsRes.data || []
      } catch (e) {
        console.error("[v0] Failed to fetch subjects:", e)
      }

      try {
        const enrollmentsRes = await academicsAPI.enrollments()
        enrollmentsData = enrollmentsRes.data.results || enrollmentsRes.data || []
      } catch (e) {
        console.error("[v0] Failed to fetch enrollments:", e)
      }

      try {
        const classSubjectsRes = await academicsAPI.classSubjects()
        classSubjectsData = classSubjectsRes.data.results || classSubjectsRes.data || []
      } catch (e) {
        console.error("[v0] Failed to fetch classSubjects:", e)
      }

      try {
        const studentsRes = await usersAPI.students()
        studentsData = studentsRes.data.results || studentsRes.data || []
        console.log("[v0] Students data:", studentsData)
      } catch (e) {
        console.error("[v0] Failed to fetch students:", e)
      }

      try {
        const teachersRes = await usersAPI.teachers()
        teachersData = teachersRes.data.results || teachersRes.data || []
        console.log("[v0] Teachers data:", teachersData)
      } catch (e) {
        console.error("[v0] Failed to fetch teachers:", e)
      }

      setClasses(Array.isArray(classesData) ? classesData : [])
      setSubjects(Array.isArray(subjectsData) ? subjectsData : [])
      setEnrollments(Array.isArray(enrollmentsData) ? enrollmentsData : [])
      setClassSubjects(Array.isArray(classSubjectsData) ? classSubjectsData : [])
      setStudents(Array.isArray(studentsData) ? studentsData : [])
      setTeachers(Array.isArray(teachersData) ? teachersData : [])
    } catch (err: any) {
      console.error("[v0] Failed to fetch academic data:", err)
      setError(err?.response?.data?.detail || err?.message || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getUserId = (profile: any): number | null => {
    // The profile might have: user (ID), user_id, user (object with id), or user_data (object with id)
    if (profile.user && typeof profile.user === "number") return profile.user
    if (profile.user_id) return profile.user_id
    if (profile.user?.id) return profile.user.id
    if (profile.user_data?.id) return profile.user_data.id
    // If this is already a User object (not a profile), return its ID
    if (profile.role && profile.id) return profile.id
    return null
  }

  // Create class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await academicsAPI.createClass({
        ...classForm,
        school: schoolId,
        level: classForm.level ? Number.parseInt(classForm.level) : null,
      })
      setShowClassDialog(false)
      setClassForm({ name: "", level: "", capacity: 30 })
      fetchData()
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create class")
    }
  }

  // Create subject
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await academicsAPI.createSubject({
        ...subjectForm,
        school: schoolId,
      })
      setShowSubjectDialog(false)
      setSubjectForm({ code: "", name: "", description: "", credit_hours: 3 })
      fetchData()
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create subject")
    }
  }

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const enrollmentData = {
        class_obj: Number.parseInt(enrollForm.class_obj),
        student: Number.parseInt(enrollForm.student), // This is now the User ID
        subject: Number.parseInt(enrollForm.subject),
      }
      console.log("[v0] Creating enrollment with data:", enrollmentData)
      await academicsAPI.createEnrollment(enrollmentData)
      setShowEnrollDialog(false)
      setEnrollForm({ class_obj: "", student: "", subject: "" })
      fetchData()
    } catch (err: any) {
      console.error("[v0] Enrollment error:", err?.response?.data)
      setError(err?.response?.data?.detail || JSON.stringify(err?.response?.data) || "Failed to enroll student")
    }
  }

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const assignmentData = {
        class_obj: Number.parseInt(assignForm.class_obj),
        subject: Number.parseInt(assignForm.subject),
        teacher: Number.parseInt(assignForm.teacher), // This is now the User ID
      }
      console.log("[v0] Creating class subject with data:", assignmentData)
      await academicsAPI.createClassSubject(assignmentData)
      setShowAssignDialog(false)
      setAssignForm({ class_obj: "", subject: "", teacher: "" })
      fetchData()
    } catch (err: any) {
      console.error("[v0] Assignment error:", err?.response?.data)
      setError(err?.response?.data?.detail || JSON.stringify(err?.response?.data) || "Failed to assign teacher")
    }
  }

  // Delete handlers
  const handleDeleteClass = async (id: number) => {
    if (confirm("Are you sure you want to delete this class?")) {
      try {
        await academicsAPI.deleteClass(id)
        fetchData()
      } catch (err: any) {
        setError(err?.response?.data?.detail || "Failed to delete class")
      }
    }
  }

  const handleDeleteSubject = async (id: number) => {
    if (confirm("Are you sure you want to delete this subject?")) {
      try {
        await academicsAPI.deleteSubject(id)
        fetchData()
      } catch (err: any) {
        setError(err?.response?.data?.detail || "Failed to delete subject")
      }
    }
  }

  // Helper to get student name
  const getStudentName = (student: any) => {
    return (
      student.first_name ||
      student.user_name ||
      student.user_data?.first_name ||
      student.user?.first_name ||
      student.username ||
      "N/A"
    )
  }

  // Helper to get teacher name
  const getTeacherName = (teacher: any) => {
    return (
      teacher.first_name ||
      teacher.user_name ||
      teacher.user_data?.first_name ||
      teacher.user?.first_name ||
      teacher.username ||
      "N/A"
    )
  }

  const getEmail = (profile: any) => {
    return profile.email || profile.user_email || profile.user_data?.email || profile.user?.email || "N/A"
  }

  if (loading) {
    return <div className="text-center py-4">Loading academic data...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Academic Structure</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm mb-4">{error}</div>}

        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab("classes")}
            className={`px-4 py-2 rounded text-sm ${activeTab === "classes" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            Classes ({classes.length})
          </button>
          <button
            onClick={() => setActiveTab("subjects")}
            className={`px-4 py-2 rounded text-sm ${activeTab === "subjects" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            Subjects ({subjects.length})
          </button>
          <button
            onClick={() => setActiveTab("enrollments")}
            className={`px-4 py-2 rounded text-sm ${activeTab === "enrollments" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            Student Enrollments ({enrollments.length})
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            className={`px-4 py-2 rounded text-sm ${activeTab === "assignments" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            Teacher Assignments ({classSubjects.length})
          </button>
        </div>

        {/* Classes Tab */}
        {activeTab === "classes" && (
          <div className="space-y-4">
            <Dialog open={showClassDialog} onOpenChange={setShowClassDialog}>
              <DialogTrigger asChild>
                <Button size="sm">Add Class</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Class</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateClass} className="space-y-4">
                  <div>
                    <Label htmlFor="className">Class Name</Label>
                    <Input
                      id="className"
                      value={classForm.name}
                      onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                      placeholder="e.g., Grade 10A"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={classForm.capacity}
                      onChange={(e) => setClassForm({ ...classForm, capacity: Number.parseInt(e.target.value) || 30 })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Class
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Class Name</th>
                    <th className="text-left py-2 px-2">Capacity</th>
                    <th className="text-left py-2 px-2">Students Enrolled</th>
                    <th className="text-left py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-muted-foreground">
                        No classes found. Add your first class.
                      </td>
                    </tr>
                  ) : (
                    classes.map((cls) => {
                      const enrolled = enrollments.filter((e) => e.class_obj === cls.id).length
                      return (
                        <tr key={cls.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-2 font-medium">{cls.name}</td>
                          <td className="py-2 px-2">{cls.capacity}</td>
                          <td className="py-2 px-2">{enrolled}</td>
                          <td className="py-2 px-2">
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteClass(cls.id)}>
                              Delete
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Subjects Tab */}
        {activeTab === "subjects" && (
          <div className="space-y-4">
            <Dialog open={showSubjectDialog} onOpenChange={setShowSubjectDialog}>
              <DialogTrigger asChild>
                <Button size="sm">Add Subject</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Subject</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateSubject} className="space-y-4">
                  <div>
                    <Label htmlFor="subjectCode">Subject Code</Label>
                    <Input
                      id="subjectCode"
                      value={subjectForm.code}
                      onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                      placeholder="e.g., MTH101"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="subjectName">Subject Name</Label>
                    <Input
                      id="subjectName"
                      value={subjectForm.name}
                      onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                      placeholder="e.g., Mathematics"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="creditHours">Credit Hours</Label>
                    <Input
                      id="creditHours"
                      type="number"
                      value={subjectForm.credit_hours}
                      onChange={(e) =>
                        setSubjectForm({ ...subjectForm, credit_hours: Number.parseInt(e.target.value) || 3 })
                      }
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Subject
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Code</th>
                    <th className="text-left py-2 px-2">Subject</th>
                    <th className="text-left py-2 px-2">Credit Hours</th>
                    <th className="text-left py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-muted-foreground">
                        No subjects found. Add your first subject.
                      </td>
                    </tr>
                  ) : (
                    subjects.map((subject) => (
                      <tr key={subject.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-2 font-medium">{subject.code}</td>
                        <td className="py-2 px-2">{subject.name}</td>
                        <td className="py-2 px-2">{subject.credit_hours}</td>
                        <td className="py-2 px-2">
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteSubject(subject.id)}>
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Student Enrollments Tab - CHANGE: Fixed to use correct User ID */}
        {activeTab === "enrollments" && (
          <div className="space-y-4">
            <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
              <DialogTrigger asChild>
                <Button size="sm">Enroll Student</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enroll Student to Class</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEnrollStudent} className="space-y-4">
                  <div>
                    <Label>Select Class</Label>
                    <Select
                      value={enrollForm.class_obj}
                      onValueChange={(v) => setEnrollForm({ ...enrollForm, class_obj: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id.toString()}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Select Student</Label>
                    <Select
                      value={enrollForm.student}
                      onValueChange={(v) => setEnrollForm({ ...enrollForm, student: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((s) => {
                          const userId = getUserId(s)
                          if (!userId) return null
                          return (
                            <SelectItem key={s.id} value={userId.toString()}>
                              {getStudentName(s)} - {getEmail(s)}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Select Subject</Label>
                    <Select
                      value={enrollForm.subject}
                      onValueChange={(v) => setEnrollForm({ ...enrollForm, subject: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id.toString()}>
                            {sub.code} - {sub.name}
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

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Student</th>
                    <th className="text-left py-2 px-2">Class</th>
                    <th className="text-left py-2 px-2">Subject</th>
                    <th className="text-left py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-muted-foreground">
                        No enrollments found.
                      </td>
                    </tr>
                  ) : (
                    enrollments.map((enrollment) => {
                      const classObj = classes.find((c) => c.id === enrollment.class_obj)
                      const subject = subjects.find((s) => s.id === enrollment.subject)
                      return (
                        <tr key={enrollment.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-2">{enrollment.student_name || "N/A"}</td>
                          <td className="py-2 px-2">{classObj?.name || enrollment.class_name || "N/A"}</td>
                          <td className="py-2 px-2">{subject?.name || enrollment.subject_name || "N/A"}</td>
                          <td className="py-2 px-2">
                            <span
                              className={`px-2 py-1 rounded text-xs ${enrollment.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                            >
                              {enrollment.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Teacher Assignments Tab - CHANGE: Fixed to use correct User ID */}
        {activeTab === "assignments" && (
          <div className="space-y-4">
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
              <DialogTrigger asChild>
                <Button size="sm">Assign Teacher</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Teacher to Subject</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAssignTeacher} className="space-y-4">
                  <div>
                    <Label>Select Class</Label>
                    <Select
                      value={assignForm.class_obj}
                      onValueChange={(v) => setAssignForm({ ...assignForm, class_obj: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id.toString()}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Select Subject</Label>
                    <Select
                      value={assignForm.subject}
                      onValueChange={(v) => setAssignForm({ ...assignForm, subject: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id.toString()}>
                            {sub.code} - {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Select Teacher</Label>
                    <Select
                      value={assignForm.teacher}
                      onValueChange={(v) => setAssignForm({ ...assignForm, teacher: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map((t) => {
                          const userId = getUserId(t)
                          if (!userId) return null
                          return (
                            <SelectItem key={t.id} value={userId.toString()}>
                              {getTeacherName(t)} - {getEmail(t)}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">
                    Assign Teacher
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Class</th>
                    <th className="text-left py-2 px-2">Subject</th>
                    <th className="text-left py-2 px-2">Teacher</th>
                  </tr>
                </thead>
                <tbody>
                  {classSubjects.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-4 text-muted-foreground">
                        No teacher assignments found.
                      </td>
                    </tr>
                  ) : (
                    classSubjects.map((cs) => {
                      const classObj = classes.find((c) => c.id === cs.class_obj)
                      const subject = subjects.find((s) => s.id === cs.subject)
                      return (
                        <tr key={cs.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-2">{classObj?.name || cs.class_name || "N/A"}</td>
                          <td className="py-2 px-2">{subject?.name || cs.subject_name || "N/A"}</td>
                          <td className="py-2 px-2">{cs.teacher_name || "Not assigned"}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
