"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { gradesAPI, academicsAPI, usersAPI } from "@/lib/api"

export function GradesManagement() {
  const [grades, setGrades] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    student: "",
    subject: "",
    assessment_type: "exam",
    score: "",
    max_score: "100",
  })

  useEffect(() => {
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
        console.error("[v0] Failed to fetch grades data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await gradesAPI.create({
        student: Number.parseInt(formData.student),
        subject: Number.parseInt(formData.subject),
        assessment_type: formData.assessment_type,
        score: Number.parseFloat(formData.score),
        max_score: Number.parseFloat(formData.max_score),
      })

      setFormData({
        student: "",
        subject: "",
        assessment_type: "exam",
        score: "",
        max_score: "100",
      })
      setIsOpen(false)

      // Refresh grades
      const res = await gradesAPI.list()
      setGrades(res.data.results || res.data || [])
    } catch (error: any) {
      console.error("[v0] Failed to add grade:", error)
      alert(error?.response?.data?.detail || "Failed to add grade")
    }
  }

  const getStudentName = (studentId: number) => {
    const student = students.find((s) => s.id === studentId)
    return student?.user_data?.first_name || student?.first_name || `Student ${studentId}`
  }

  const getSubjectName = (subjectId: number) => {
    const subject = subjects.find((s) => s.id === subjectId)
    return subject?.name || `Subject ${subjectId}`
  }

  if (loading) return <div className="text-center py-4">Loading grades...</div>

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Grades & Assessment</CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Add Grade</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Grade</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddGrade} className="space-y-4">
                <div>
                  <Label htmlFor="student">Student</Label>
                  <select
                    id="student"
                    value={formData.student}
                    onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    required
                  >
                    <option value="">Select Student</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {getStudentName(s.id)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <select
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="assessment_type">Assessment Type</Label>
                  <select
                    id="assessment_type"
                    value={formData.assessment_type}
                    onChange={(e) => setFormData({ ...formData, assessment_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="exam">Exam</option>
                    <option value="test">Test</option>
                    <option value="quiz">Quiz</option>
                    <option value="continuous">Continuous Assessment</option>
                    <option value="assignment">Assignment</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="score">Score</Label>
                  <Input
                    id="score"
                    type="number"
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="max_score">Max Score</Label>
                  <Input
                    id="max_score"
                    type="number"
                    value={formData.max_score}
                    onChange={(e) => setFormData({ ...formData, max_score: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Add Grade
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Student</th>
                <th className="text-left py-2 px-2">Subject</th>
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-left py-2 px-2">Score</th>
                <th className="text-left py-2 px-2">Grade</th>
              </tr>
            </thead>
            <tbody>
              {grades.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted-foreground">
                    No grades recorded yet
                  </td>
                </tr>
              ) : (
                grades.map((grade) => (
                  <tr key={grade.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2">{getStudentName(grade.student)}</td>
                    <td className="py-2 px-2">{getSubjectName(grade.subject)}</td>
                    <td className="py-2 px-2 capitalize">{grade.assessment_type}</td>
                    <td className="py-2 px-2 font-bold">{grade.percentage?.toFixed(1) || 0}%</td>
                    <td className="py-2 px-2 font-bold">{grade.grade || "N/A"}</td>
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
