"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { gradesAPI, usersAPI, academicsAPI } from "@/lib/api"

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

export function GradingSystem() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterStudent, setFilterStudent] = useState("")
  const [newGrade, setNewGrade] = useState({
    student: "",
    subject: "",
    assessment_type: "exam" as const,
    score: "",
    max_score: "100",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [gradesRes, studentsRes, subjectsRes] = await Promise.all([
        gradesAPI.list(),
        usersAPI.students(),
        academicsAPI.subjects(),
      ])

      setGrades(gradesRes.data.results || gradesRes.data || [])
      setStudents(studentsRes.data.results || studentsRes.data || [])
      setSubjects(subjectsRes.data.results || subjectsRes.data || [])
    } catch (error) {
      console.error("[v0] Failed to fetch grading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const addGrade = async () => {
    if (!newGrade.student || !newGrade.subject || !newGrade.score) {
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
      await fetchData()
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
    const subject = subjects.find((s) => s.id === id)
    return subject?.name || subject?.code || `Subject ${id}`
  }

  const filteredGrades = filterStudent ? grades.filter((g) => g.student === Number.parseInt(filterStudent)) : grades

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

  if (loading) {
    return <div className="text-center py-4">Loading grading system...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Grading System</CardTitle>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            Add Grade
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {showForm && (
            <div className="p-4 border rounded-lg space-y-3">
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
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
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
          <div className="flex gap-2 mb-4">
            <select
              value={filterStudent}
              onChange={(e) => setFilterStudent(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="">All Students</option>
              {students.map((s) => (
                <option key={s.id} value={s.user?.id || s.id}>
                  {s.user?.first_name ? `${s.user.first_name} ${s.user.last_name}` : s.first_name}
                </option>
              ))}
            </select>
          </div>
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
