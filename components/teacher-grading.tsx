"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { gradesAPI, usersAPI, academicsAPI } from "@/lib/api"
import { useAuthContext as useAuth } from "@/lib/auth-context"


interface Grade {
  id: number
  student: number
  subject: number
  assessment_type: "exam" | "test" | "quiz" | "continuous" | "assignment" | "Exercise"
  score: number
  max_score: number
  percentage: number
  grade: string
  recorded_date: string
}

export function TeacherGrading() {
  const { user } = useAuth()
  const [grades, setGrades] = useState<Grade[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [filterStudent, setFilterStudent] = useState("")
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("")
  const [newGrade, setNewGrade] = useState({
    student: "",
    subject: "",
    assessment_type: "exam" as const,
    score: "",
    max_score: "100",
  })

  const getClassId = (assignment: any) => {
    return assignment.class_data?.id || assignment.class_obj || assignment.class_id
  }

  const getSubjectId = (assignment: any) => {
    return assignment.subject_data?.id || assignment.subject_id || (typeof assignment.subject === 'object' ? assignment.subject?.id : assignment.subject)
  }

  useEffect(() => {
    fetchTeacherData()
    fetchGrades()
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

  const fetchTeacherData = async () => {
    if (!user) return
    try {
      setLoading(true)
      const [teacherClassesRes] = await Promise.all([
        academicsAPI.classTeachers({ teacher_id: user.teacher_id }),
      ]);
      setClasses(teacherClassesRes.data.results || teacherClassesRes.data || [])
    } catch (error) {
      console.error("[v0] Failed to fetch teacher data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClassData = async (classId: string) => {
    if (!user) return
    try {
      const [studentsRes, subjectsRes] = await Promise.all([
        usersAPI.students({ class_id: classId }),
        academicsAPI.classSubjectTeachers({ class_id: classId, teacher_id: user.teacher_id }),
      ])
      setStudents(studentsRes.data.results || studentsRes.data || [])
      setSubjects(subjectsRes.data.results || subjectsRes.data || [])
    } catch (error) {
      console.error("[v0] Failed to fetch class data:", error)
    }
  }

  const fetchGrades = async () => {
    try {
      const gradesRes = await gradesAPI.list()
      setGrades(gradesRes.data.results || gradesRes.data || [])
    } catch (error) {
      console.error("[v0] Failed to fetch grades:", error)
    }
  }

  const addGrade = async () => {
    if (!newGrade.student || (!newGrade.subject && newGrade.subject !== 0) || !newGrade.score) {
      alert("Please fill all required fields")
      return
    }

    try {
      const data = {
        student: Number.parseInt(newGrade.student),
        subject: Number.parseInt(newGrade.subject),
        assessment_type: newGrade.assessment_type,
        score: Number.parseFloat(newGrade.score),
        max_score: Number.parseFloat(newGrade.max_score),
      }

      console.log("[v0] Creating grade with data:", data)
      await gradesAPI.create(data)
      setNewGrade({ student: "", subject: "", assessment_type: "exam", score: "", max_score: "100" })
      setShowForm(false)
      await fetchGrades()
    } catch (error: any) {
      console.error("[v0] Failed to create grade:", error?.response?.data || error)
      alert(`Error: ${error?.response?.data?.detail || "Failed to create grade"}`)
    }
  }

  const getStudentName = (id: number) => {
    const student = students.find((s) => (s.user?.id || s.id) === id)
    return student?.user?.first_name ? `${student.user.first_name} ${student.user.last_name}` : `Student ${id}`
  }

  const getSubjectName = (id: number) => {
    const subject = subjects.find((s) => (s.subject?.id || s.id) === id)
    if (subject) return subject.subject?.name || subject.name
    const assignment = classes.find((c) => getSubjectId(c) === id)
    return assignment?.subject_data?.name || assignment?.subject_name || `Subject ${id}`
  }

  const getAssignmentName = (id: string) => {
    const c = classes.find((item) => item.id.toString() === id)
    if (!c) return ""
    return `${c.class_data?.name || c.class_name || c.name} - ${c.subject_data?.name || c.subject_name || "Subject"}`
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
      const studentIds = students.map((s) => s.user?.id || s.id)
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
          <Button size="sm" onClick={() => {
            if (!selectedAssignmentId) {
              alert("Please select a Class & Subject first")
              return
            }
            setShowForm(!showForm)
          }}>
            Add Grade
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              className="w-full md:w-1/3 px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Select Class & Subject</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.class_data?.name || c.class_name || c.name} - {c.subject_data?.name || c.subject_name || "Subject"}
                </option>
              ))}
            </select>
            <select
              value={filterStudent}
              onChange={(e) => setFilterStudent(e.target.value)}
              className="w-full md:w-1/3 px-3 py-2 border rounded-md text-sm"
              disabled={!selectedAssignmentId}
            >
              <option value="">All Students</option>
              {students.map((s) => (
                <option key={s.id} value={s.user?.id || s.id}>
                  {s.user?.first_name ? `${s.user.first_name} ${s.user.last_name}` : s.first_name}
                </option>
              ))}
            </select>
          </div>
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
                {students.map((s) => (
                  <option key={s.id} value={s.user?.id || s.id}>
                    {s.user?.first_name ? `${s.user.first_name} ${s.user.last_name}` : s.first_name}
                  </option>
                ))}
              </select>
              <select
                value={newGrade.subject}
                onChange={(e) => setNewGrade({ ...newGrade, subject: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.subject?.id || s.id}>
                    {s.subject?.name || s.name}
                  </option>
                ))}
              </select>
              <select
                value={newGrade.assessment_type}
                onChange={(e) => setNewGrade({ ...newGrade, assessment_type: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="exam">Exam</option>
                <option value="test">Test</option>
                <option value="quiz">Quiz</option>
                <option value="continuous">Continuous Assessment</option>
                <option value="assignment">Assignment</option>
              </select>
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
              <div className="flex gap-2">
                <Button size="sm" onClick={addGrade}>
                  Save Grade
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
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
                  <th className="text-left py-2 px-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrades.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted-foreground">
                      No grades found
                    </td>
                  </tr>
                ) : (
                  filteredGrades.map((grade) => (
                    <tr key={grade.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 font-medium">{getStudentName(grade.student)}</td>
                      <td className="py-2 px-2">{getSubjectName(grade.subject)}</td>
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
