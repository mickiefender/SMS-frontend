"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { academicsAPI, attendanceAPI, usersAPI } from "@/lib/api"
import { useAuthContext } from "@/lib/auth-context"

export function AttendanceTracker() {
  const { user } = useAuthContext()
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [studentNames, setStudentNames] = useState<Record<number, string>>({})
  const [attendance, setAttendance] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true)
        const res = await academicsAPI.classes()
        setClasses(res.data.results || res.data || [])
      } catch (error) {
        console.error("Failed to fetch classes:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchClasses()
  }, [])

  useEffect(() => {
    const fetchClassSubjects = async () => {
      if (!selectedClass) {
        setSubjects([])
        return
      }
      try {
        const res = await academicsAPI.classSubjects({ class_obj: selectedClass })
        const subjectIds = (res.data.results || res.data).map((cs: any) => cs.subject)

        const subjectsRes = await academicsAPI.subjects({ id__in: subjectIds.join(",") })
        setSubjects(subjectsRes.data.results || subjectsRes.data)
      } catch (error) {
        console.error("Failed to fetch subjects:", error)
      }
    }
    fetchClassSubjects()
  }, [selectedClass])

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass) {
        setStudents([])
        return
      }
      try {
        const res = await academicsAPI.enrollments({ class_obj: selectedClass })
        const enrollments = res.data.results || res.data
        setStudents(enrollments)

        // Initialize attendance state
        const newAttendance: Record<number, string> = {}
        enrollments.forEach((enrollment: any) => {
          newAttendance[enrollment.student] = "present"
        })
        setAttendance(newAttendance)

        // Fetch student names
        const newStudentNames: Record<number, string> = {}
        for (const enrollment of enrollments) {
          try {
            const userRes = await usersAPI.getById(enrollment.student)
            newStudentNames[enrollment.student] = `${userRes.data.first_name} ${userRes.data.last_name}`
          } catch (error) {
            console.error(`Failed to fetch student name for ID ${enrollment.student}:`, error)
            newStudentNames[enrollment.student] = `Student ${enrollment.student}`
          }
        }
        setStudentNames(newStudentNames)
      } catch (error) {
        console.error("Failed to fetch students:", error)
      }
    }
    fetchStudents()
  }, [selectedClass])

  const handleSubmit = async () => {
    if (!selectedClass || !selectedSubject || !selectedDate) {
      alert("Please select class, subject, and date")
      return
    }

    setSubmitting(true)
    try {
      const attendances = students.map((student: any) => ({
        class_obj: Number.parseInt(selectedClass),
        subject: Number.parseInt(selectedSubject),
        student: student.student,
        status: attendance[student.student] || "present",
        date: selectedDate,
        teacher: user?.id,
      }))

      await attendanceAPI.bulkCreate({ attendances })
      alert("Attendance marked successfully")
      setAttendance({})
      setSelectedClass("")
      setSelectedSubject("")
    } catch (error: any) {
      console.error("Failed to submit attendance:", error)
      alert(error?.response?.data?.detail || "Failed to mark attendance")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-4">Loading classes...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mark Attendance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded"
            >
              <option value="">Choose a class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Select Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded"
              disabled={!selectedClass}
            >
              <option value="">Choose a subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded"
            />
          </div>
        </div>

        {selectedClass && students.length > 0 && (
          <>
            <div className="space-y-2">
              {students.map((student: any) => (
                <div key={student.id} className="flex items-center justify-between p-3 border rounded">
                  <span>{studentNames[student.student] || `Student ${student.student}`}</span>
                  <select
                    value={attendance[student.student] || "present"}
                    onChange={(e) =>
                      setAttendance({
                        ...attendance,
                        [student.student]: e.target.value,
                      })
                    }
                    className="px-2 py-1 border border-input rounded text-sm"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="excused">Excused</option>
                  </select>
                </div>
              ))}
            </div>

            <Button onClick={handleSubmit} disabled={submitting} className="w-full">
              {submitting ? "Submitting..." : "Submit Attendance"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
