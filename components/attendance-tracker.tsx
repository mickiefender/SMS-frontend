"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { academicsAPI, attendanceAPI, usersAPI } from "@/lib/api"
import { useAuthContext } from "@/lib/auth-context"
import { Search, CheckCircle, XCircle, Clock, UserCheck, Users, Calendar, BookOpen, Save } from "lucide-react"
import { CircularLoader } from "@/components/circular-loader"

export function AttendanceTracker() {
  const { user } = useAuthContext()
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [studentNames, setStudentNames] = useState<Record<number, string>>({})
  const [studentAvatars, setStudentAvatars] = useState<Record<number, string>>({})
  const [attendance, setAttendance] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true)
        const res = await academicsAPI.get("/classes/")
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
        const res = await academicsAPI.get("/class-subjects/", { class_obj: selectedClass })
        const classSubjects = res.data.results || res.data || []
        const subjectIds = classSubjects.map((cs: any) => cs.subject)

        const subjectsRes = await academicsAPI.get("/subjects/", { id__in: subjectIds.join(",") })
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
        const res = await academicsAPI.get("/enrollments/", { class_obj: selectedClass })
        const enrollments = res.data.results || res.data
        setStudents(enrollments)

        // Initialize attendance state
        const newAttendance: Record<number, string> = {}
        enrollments.forEach((enrollment: any) => {
          newAttendance[enrollment.student] = "present"
        })
        setAttendance(newAttendance)

        // Fetch student names and avatars
        const newStudentNames: Record<number, string> = {}
        const newStudentAvatars: Record<number, string> = {}
        for (const enrollment of enrollments) {
          try {
            const userRes = await usersAPI.getById(enrollment.student)
            const userData = userRes.data
            newStudentNames[enrollment.student] = `${userData.first_name} ${userData.last_name}`
            // Try to get profile picture
            try {
              const picRes = await academicsAPI.get("/profile-pictures/", { user: enrollment.student })
              const pics = picRes.data.results || picRes.data || []
              if (pics.length > 0) {
                newStudentAvatars[enrollment.student] = pics[0].display_url || pics[0].storage_url || pics[0].picture || ''
              }
            } catch {
              // No profile picture
            }
          } catch (error) {
            console.error(`Failed to fetch student name for ID ${enrollment.student}:`, error)
            newStudentNames[enrollment.student] = `Student ${enrollment.student}`
          }
        }
        setStudentNames(newStudentNames)
        setStudentAvatars(newStudentAvatars)
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

  const markAllPresent = () => {
    const newAttendance: Record<number, string> = {}
    students.forEach((enrollment: any) => {
      newAttendance[enrollment.student] = "present"
    })
    setAttendance(newAttendance)
  }

  const markAllAbsent = () => {
    const newAttendance: Record<number, string> = {}
    students.forEach((enrollment: any) => {
      newAttendance[enrollment.student] = "absent"
    })
    setAttendance(newAttendance)
  }

  const filteredStudents = students.filter((enrollment: any) => {
    const name = studentNames[enrollment.student] || ""
    return name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const getStatusCounts = () => {
    const counts = { present: 0, absent: 0, late: 0, excused: 0 }
    students.forEach((enrollment: any) => {
      const status = attendance[enrollment.student] || "present"
      counts[status as keyof typeof counts]++
    })
    return counts
  }

  const statusCounts = getStatusCounts()

  if (loading) return (
    <Card className="w-full">
      <CardContent className="flex items-center justify-center py-12">
        <CircularLoader size="lg" />
      </CardContent>
    </Card>
  )

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <UserCheck className="h-5 w-5 text-purple-600" />
          Mark Attendance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selection Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Class</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="">Choose a class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Subject</Label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white disabled:opacity-50"
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
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {selectedClass && students.length > 0 && (
          <>
            {/* Quick Actions & Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={markAllPresent}
                  className="gap-1 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                >
                  <CheckCircle className="h-4 w-4" />All Present
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={markAllAbsent}
                  className="gap-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4" />All Absent
                </Button>
              </div>
              
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Summary */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <CheckCircle className="h-5 w-5 mx-auto text-green-600 mb-1" />
                <p className="text-lg font-bold text-green-700">{statusCounts.present}</p>
                <p className="text-xs text-green-600">Present</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <XCircle className="h-5 w-5 mx-auto text-red-600 mb-1" />
                <p className="text-lg font-bold text-red-700">{statusCounts.absent}</p>
                <p className="text-xs text-red-600">Absent</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <Clock className="h-5 w-5 mx-auto text-yellow-600 mb-1" />
                <p className="text-lg font-bold text-yellow-700">{statusCounts.late}</p>
                <p className="text-xs text-yellow-600">Late</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <UserCheck className="h-5 w-5 mx-auto text-gray-600 mb-1" />
                <p className="text-lg font-bold text-gray-700">{students.length}</p>
                <p className="text-xs text-gray-600">Total</p>
              </div>
            </div>

            {/* Students List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredStudents.map((enrollment: any) => (
                <div 
                  key={enrollment.id} 
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:shadow-sm transition-shadow bg-white"
                >
                  <div className="flex items-center gap-3">
                    {studentAvatars[enrollment.student] ? (
                      <img 
                        src={studentAvatars[enrollment.student]} 
                        alt={studentNames[enrollment.student]}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-medium">
                        {(studentNames[enrollment.student] || "S").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium text-gray-900">
                      {studentNames[enrollment.student] || `Student ${enrollment.student}`}
                    </span>
                  </div>
                  <select
                    value={attendance[enrollment.student] || "present"}
                    onChange={(e) =>
                      setAttendance({
                        ...attendance,
                        [enrollment.student]: e.target.value,
                      })
                    }
                    className={`px-3 py-1.5 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-purple-500 ${
                      attendance[enrollment.student] === 'present' ? 'bg-green-50 border-green-200 text-green-700' :
                      attendance[enrollment.student] === 'absent' ? 'bg-red-50 border-red-200 text-red-700' :
                      attendance[enrollment.student] === 'late' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                      'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="excused">Excused</option>
                  </select>
                </div>
              ))}
              {filteredStudents.length === 0 && searchTerm && (
                <p className="text-center text-gray-500 py-4">No students found matching "{searchTerm}"</p>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              onClick={handleSubmit} 
              disabled={submitting} 
              className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2.5"
              size="lg"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Submit Attendance
                </>
              )}
            </Button>
          </>
        )}

        {selectedClass && students.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No students enrolled in this class</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

