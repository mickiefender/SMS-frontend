"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { gradesAPI, usersAPI, academicsAPI } from "@/lib/api"
import { useAuthContext as useAuth } from "@/lib/auth-context"
import { Lock, Unlock, Save, AlertCircle } from "lucide-react"

interface Grade {
  id: number
  student: number
  subject: number
  student_name?: string
  student_first_name?: string
  student_last_name?: string
  subject_name?: string
  assessment_type: string
  score: number
  max_score: number
  percentage: number
  grade: string
  academic_session?: number
  is_locked: boolean
  locked_by?: string
  locked_at?: string
  recorded_date: string
}

export function TeacherGrading() {
  const { user } = useAuth()
  const [grades, setGrades] = useState<Grade[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [filterStudent, setFilterStudent] = useState("")
  const [filterSession, setFilterSession] = useState("")
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("")
  const [saving, setSaving] = useState(false)
  const [newGrade, setNewGrade] = useState({
    student: "",
    subject: "",
    assessment_type: "exam" as const,
    score: "",
    max_score: "100",
  })

  // Default max scores based on assessment type
  const DEFAULT_MAX_SCORES: Record<string, number> = {
    exam: 100,
    test: 20,
    quiz: 10,
    assignment: 20,
    continuous: 10,
  }

  // Handle assessment type change - auto-set max score
  const handleAssessmentTypeChange = (value: string) => {
    const defaultMax = DEFAULT_MAX_SCORES[value] || 100
    setNewGrade(prev => ({
      ...prev,
      assessment_type: value as any,
      max_score: defaultMax.toString(),
    }))
  }

  const getClassId = (assignment: any) => {
    // API returns class_obj directly, not class_data
    return assignment.class_obj || assignment.class_id
  }

  const getSubjectId = (assignment: any) => {
    // API returns subject directly as a number ID
    return assignment.subject
  }

  useEffect(() => {
    fetchTeacherData()
    fetchSessions()
  }, [user])

  useEffect(() => {
    if (selectedAssignmentId) {
      const assignment = classes.find((c) => c.id.toString() === selectedAssignmentId)
      if (assignment) {
        const classId = getClassId(assignment)
        if (classId) fetchClassData(classId)
      }
    }
  }, [selectedAssignmentId, classes])

  useEffect(() => {
    if (filterSession) {
      fetchGrades()
    }
  }, [filterSession])

  useEffect(() => {
    if (showForm && selectedAssignmentId) {
      const assignment = classes.find((c) => c.id.toString() === selectedAssignmentId)
      if (assignment) {
        const subjectId = getSubjectId(assignment)
        setNewGrade((prev) => ({
          ...prev,
          student: "",
          subject: subjectId !== undefined && subjectId !== null ? subjectId : "",
        }))
      }
    }
  }, [showForm, selectedAssignmentId, classes])

  const fetchSessions = async () => {
    try {
      const res = await academicsAPI.academicSessions()
      const sessionsData = res.data.results || res.data || []
      setSessions(sessionsData)
      
      // Set current session
      const currentSession = sessionsData.find((s: any) => s.is_current)
      if (currentSession) {
        setFilterSession(currentSession.id.toString())
      }
    } catch (error) {
      console.error("[v0] Failed to fetch sessions:", error)
    }
  }

  const fetchTeacherData = async () => {
    if (!user) return
    try {
      setLoading(true)
      // Fetch both ClassSubjectTeacher and ClassTeacher assignments
      const [teacherClassesRes, classTeachersRes] = await Promise.all([
        academicsAPI.classSubjectTeachers(),
        academicsAPI.classTeachers(),
      ]);
      
      let classesData = teacherClassesRes.data.results || teacherClassesRes.data || []
      
      // If no subject teacher assignments, check for class teacher (form tutor) assignments
      if (classesData.length === 0) {
        const classTeacherData = classTeachersRes.data.results || classTeachersRes.data || []
        // Transform ClassTeacher data to match ClassSubjectTeacher format
        classesData = classTeacherData.map((ct: any) => ({
          id: ct.id,
          class_obj: ct.class_obj,
          class_name: ct.class_name,
          class_data: { id: ct.class_obj, name: ct.class_name },
          subject: null, // No specific subject for form tutors
          subject_name: "Form Tutor (All Subjects)",
          teacher: ct.teacher,
        }))
      }
      
      console.log("[TeacherGrading] Teacher classes data:", classesData)
      setClasses(classesData)
    } catch (error) {
      console.error("[v0] Failed to fetch teacher data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClassData = async (classId: number | string) => {
    if (!user) return
    try {
      const classIdNum = typeof classId === 'string' ? parseInt(classId) : classId
      console.log("[TeacherGrading] fetchClassData called with classId:", classIdNum)
      
      const [studentsRes, subjectsRes] = await Promise.all([
        usersAPI.students({ class_id: classIdNum }),
        // Use classSubjects() to get all subjects for the class (not filtered by teacher)
        academicsAPI.classSubjects(),
      ])
      
      const studentsData = studentsRes.data.results || studentsRes.data || []
      console.log("[TeacherGrading] Students data:", studentsData)
      console.log("[TeacherGrading] Students data sample:", JSON.stringify(studentsData[0], null, 2))
      setStudents(studentsData)
      
      const allSubjects = subjectsRes.data.results || subjectsRes.data || []
      console.log("[TeacherGrading] All class subjects (before filter):", allSubjects)
      
      // Filter subjects by class_obj (the correct API field)
      // Ensure we compare numbers properly - subject is already an ID (PK), class_obj is also a PK
      const filteredSubjects = allSubjects.filter(
        (s: any) => Number(s.class_obj) === Number(classIdNum)
      )
      console.log("[TeacherGrading] Filtered subjects:", filteredSubjects)
      setSubjects(filteredSubjects)
    } catch (error) {
      console.error("[v0] Failed to fetch class data:", error)
    }
  }

  const fetchGrades = async () => {
    try {
      // Get grades for teacher's assigned classes and subjects
      const gradesRes = await gradesAPI.list()
      let allGrades = gradesRes.data.results || gradesRes.data || []
      console.log("[TeacherGrading] fetchGrades - all grades from API:", allGrades.length)
      console.log("[TeacherGrading] fetchGrades - sample grades:", allGrades.slice(0, 3).map((g: any) => JSON.stringify(g)))
      
      // For now, just set all grades without filtering - let backend do the filtering
      // The filtering is causing issues - let's debug first
      setGrades(allGrades)
    } catch (error) {
      console.error("[v0] Failed to fetch grades:", error)
    }
  }

  const addGrade = async () => {
    console.log("[TeacherGrading] addGrade called, newGrade:", newGrade)
    console.log("[TeacherGrading] subjects state:", subjects)
    console.log("[TeacherGrading] students state:", students)
    console.log("[TeacherGrading] filterSession:", filterSession)
    
    // Debug: Find selected student and subject details
    // Note: subject in subjects array is the Subject ID (PK), not an object
    // Student user ID is at s.user_id (explicit) or s.user?.id or s.id
    const studentIdForGrade = (s: any) => s.user_id ?? s.user?.id ?? s.id
    const selectedStudent = students.find(s => String(studentIdForGrade(s)) === String(newGrade.student))
    const selectedSubject = subjects.find(s => String(s.subject) === String(newGrade.subject))
    console.log("[TeacherGrading] selectedStudent:", selectedStudent)
    console.log("[TeacherGrading] selectedSubject:", selectedSubject)
    console.log("[TeacherGrading] student IDs in list:", students.map(s => studentIdForGrade(s)))
    console.log("[TeacherGrading] subject IDs in list:", subjects.map(s => s.subject))
    
    if (!newGrade.student || (!newGrade.subject && newGrade.subject !== "0") || !newGrade.score) {
      alert("Please fill all required fields")
      return
    }

    try {
      setSaving(true)
      const data = {
        student: Number.parseInt(newGrade.student),
        subject: Number.parseInt(newGrade.subject),
        assessment_type: newGrade.assessment_type,
        score: Number.parseFloat(newGrade.score),
        max_score: Number.parseFloat(newGrade.max_score),
        academic_session: filterSession ? parseInt(filterSession) : null,
      }

      console.log("[v0] Creating grade with data:", JSON.stringify(data))
      console.log("[v0] newGrade.student type:", typeof newGrade.student, "value:", newGrade.student)
      console.log("[v0] newGrade.subject type:", typeof newGrade.subject, "value:", newGrade.subject)
      console.log("[v0] filterSession:", filterSession)
      console.log("[v0] Parsed values - student:", Number.parseInt(newGrade.student), "subject:", Number.parseInt(newGrade.subject))
      
      const response = await gradesAPI.create(data)
      console.log("[v0] Grade created successfully:", response.data)
      setNewGrade({ student: "", subject: "", assessment_type: "exam", score: "", max_score: "100" })
      setShowForm(false)
      
      // Force a complete refetch - reset grades state first to show loading state
      setGrades([])
      await fetchGrades()
    } catch (error: any) {
      console.error("[v0] Failed to create grade - full error:", error)
      console.error("[v0] Failed to create grade - response:", error?.response)
      console.error("[v0] Failed to create grade - response data:", error?.response?.data)
      console.error("[v0] Failed to create grade - status:", error?.response?.status)
      alert(`Error: ${error?.response?.data?.error || error?.response?.data?.detail || error?.message || "Failed to create grade"}`)
    } finally {
      setSaving(false)
    }
  }

  const handleLockGrades = async () => {
    if (!selectedAssignmentId || !filterSession) {
      alert("Please select a class & subject first")
      return
    }

    const assignment = classes.find((c) => c.id.toString() === selectedAssignmentId)
    if (!assignment) return

    const classId = getClassId(assignment)
    const subjectId = getSubjectId(assignment)

    try {
      setSaving(true)
      await gradesAPI.lock_by_class({
        class_id: classId,
        subject_id: subjectId,
        academic_session_id: filterSession,
      })
      alert("Grades locked successfully!")
      await fetchGrades()
    } catch (error: any) {
      console.error("[v0] Failed to lock grades:", error)
      alert(`Error: ${error?.response?.data?.error || "Failed to lock grades"}`)
    } finally {
      setSaving(false)
    }
  }

  const handleUnlockGrades = async () => {
    if (!selectedAssignmentId || !filterSession) {
      alert("Please select a class & subject first")
      return
    }

    const assignment = classes.find((c) => c.id.toString() === selectedAssignmentId)
    if (!assignment) return

    const classId = getClassId(assignment)
    const subjectId = getSubjectId(assignment)

    try {
      setSaving(true)
      await gradesAPI.unlock_by_class({
        class_id: classId,
        subject_id: subjectId,
        academic_session_id: filterSession,
      })
      alert("Grades unlocked successfully!")
      await fetchGrades()
    } catch (error: any) {
      console.error("[v0] Failed to unlock grades:", error)
      alert(`Error: ${error?.response?.data?.error || "Failed to unlock grades"}`)
    } finally {
      setSaving(false)
    }
  }

  const getStudentName = (id: number, grade?: Grade) => {
    // First try to use student_name from API if available
    if (grade?.student_name) {
      return grade.student_name
    }
    
    const studentIdForGrade = (s: any) => s.user_id ?? s.user?.id ?? s.id
    const student = students.find((s) => studentIdForGrade(s) === id)
    return student?.user?.first_name ? `${student.user.first_name} ${student.user.last_name}` : `Student ${id}`
  }

  const getSubjectName = (id: number, grade?: Grade) => {
    // First try to use subject_name from API if available
    if (grade?.subject_name) {
      return grade.subject_name
    }
    
    // subject in subjects array is the Subject ID (PK), not an object
    const subject = subjects.find((s) => Number(s.subject) === Number(id))
    if (subject) return subject.subject_name || subject.name
    const assignment = classes.find((c) => getSubjectId(c) === id)
    return assignment?.subject_name || `Subject ${id}`
  }

  const getAssignmentName = (id: string) => {
    const c = classes.find((item) => item.id.toString() === id)
    if (!c) return ""
    return `${c.class_name || c.name} - ${c.subject_name || "Subject"}`
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-green-100 text-green-800"
      case "B":
        return "bg-blue-100 text-blue-800"
      case "C":
        return "bg-yellow-100 text-yellow-800"
      case "D":
        return "bg-orange-100 text-orange-800"
      case "F":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredGrades = grades.filter((grade) => {
    if (selectedAssignmentId) {
      const assignment = classes.find((c) => c.id.toString() === selectedAssignmentId)
      if (!assignment) return false
      
      const subjectId = getSubjectId(assignment)
      if (subjectId && grade.subject !== subjectId) return false

      if (students.length === 0) return false
      const studentIdForGrade = (s: any) => s.user_id ?? s.user?.id ?? s.id
      const studentIds = students.map(s => studentIdForGrade(s))
      if (!studentIds.includes(grade.student)) return false
    }
    if (filterStudent && grade.student !== Number.parseInt(filterStudent)) return false
    return true
  })

  if (loading) {
    return <div className="text-center py-4">Loading grading system...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Grading System</CardTitle>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleLockGrades}
              disabled={saving || !selectedAssignmentId}
            >
              <Lock className="w-4 h-4 mr-1" />
              Lock All
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleUnlockGrades}
              disabled={saving || !selectedAssignmentId}
            >
              <Unlock className="w-4 h-4 mr-1" />
              Unlock All
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                if (!selectedAssignmentId) {
                  alert("Please select a Class & Subject first")
                  return
                }
                setShowForm(!showForm)
              }}
            >
              Add Grade
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Session and Class Selection */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="w-full md:w-1/4">
              <label className="text-sm font-medium mb-1 block">Academic Session</label>
              <select
                value={filterSession}
                onChange={(e) => setFilterSession(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Select Session</option>
                {sessions.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.is_current ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium mb-1 block">Class & Subject</label>
              <select
                value={selectedAssignmentId}
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Select Class & Subject</option>
                {classes.length === 0 ? (
                  <option value="" disabled>No classes assigned to you</option>
                ) : (
                  classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.class_name || c.name} - {c.subject_name || "Subject"}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="w-full md:w-1/4">
              <label className="text-sm font-medium mb-1 block">Filter Student</label>
              <select
                value={filterStudent}
                onChange={(e) => setFilterStudent(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
                disabled={!selectedAssignmentId}
              >
                <option value="">All Students</option>
                {students.map((s) => {
                  const sid = s.user_id ?? s.user?.id ?? s.id
                  return (
                    <option key={s.id} value={sid}>
                      {s.user?.first_name ? `${s.user.first_name} ${s.user.last_name}` : s.first_name}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          {/* Add Grade Form */}
          {showForm && (
            <div className="p-4 border rounded-lg space-y-3">
              <div className="px-3 py-2 border rounded-md text-sm bg-muted font-medium">
                {getAssignmentName(selectedAssignmentId)}
              </div>
              <select
                value={newGrade.student}
                onChange={(e) => setNewGrade({ ...newGrade, student: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Select Student</option>
                {students.map((s) => {
                  const sid = s.user_id ?? s.user?.id ?? s.id
                  return (
                    <option key={s.id} value={sid}>
                      {s.user?.first_name ? `${s.user.first_name} ${s.user.last_name}` : s.first_name}
                    </option>
                  )
                })}
              </select>
              <select
                value={newGrade.subject}
                onChange={(e) => setNewGrade({ ...newGrade, subject: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.subject}>
                    {s.subject_name || s.name}
                  </option>
                ))}
              </select>
              <select
                value={newGrade.assessment_type}
                onChange={(e) => handleAssessmentTypeChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="exam">Exam</option>
                <option value="test">Test</option>
                <option value="quiz">Quiz</option>
                <option value="continuous">Continuous Assessment</option>
                <option value="assignment">Assignment</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Score"
                  value={newGrade.score}
                  onChange={(e) => setNewGrade({ ...newGrade, score: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  step="0.01"
                />
                <input
                  type="number"
                  placeholder="Max Score"
                  value={newGrade.max_score}
                  onChange={(e) => setNewGrade({ ...newGrade, max_score: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  step="0.01"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addGrade} disabled={saving}>
                  <Save className="w-4 h-4 mr-1" />
                  {saving ? "Saving..." : "Save Grade"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Warning about locked grades */}
          {selectedAssignmentId && filteredGrades.some(g => g.is_locked) && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              Some grades are locked and cannot be edited. Unlock them first to make changes.
            </div>
          )}

          {/* Grades Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Student</th>
                  <th className="text-left py-2 px-2">Subject</th>
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-left py-2 px-2">Score</th>
                  <th className="text-left py-2 px-2">%</th>
                  <th className="text-left py-2 px-2">Grade</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrades.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted-foreground">
                      No grades found
                    </td>
                  </tr>
                ) : (
                  filteredGrades.map((grade) => (
                    <tr key={grade.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 font-medium">{getStudentName(grade.student, grade)}</td>
                      <td className="py-2 px-2">{getSubjectName(grade.subject, grade)}</td>
                      <td className="py-2 px-2 capitalize">{grade.assessment_type}</td>
                      <td className="py-2 px-2">
                        {grade.score}/{grade.max_score}
                      </td>
                      <td className="py-2 px-2">{grade.percentage.toFixed(1)}%</td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getGradeColor(grade.grade)}`}>
                          {grade.grade}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        {grade.is_locked ? (
                          <span className="flex items-center gap-1 text-red-500 text-xs">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        ) : (
                          <span className="text-green-500 text-xs">Editable</span>
                        )}
                      </td>
                      <td className="py-2 px-2">{grade.recorded_date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

