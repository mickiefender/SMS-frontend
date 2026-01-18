"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { gradesAPI, usersAPI } from "@/lib/api"

export function StudentPerformance() {
  const [students, setStudents] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [studentsRes, gradesRes] = await Promise.all([usersAPI.students(), gradesAPI.list()])
        setStudents(studentsRes.data.results || studentsRes.data || [])
        setGrades(gradesRes.data.results || gradesRes.data || [])
      } catch (error) {
        console.error("[v0] Failed to fetch performance data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getStudentGrades = () => {
    if (!selectedStudent) return []
    return grades.filter((g: any) => g.student === Number.parseInt(selectedStudent))
  }

  const calculateAveragePercentage = () => {
    const studentGrades = getStudentGrades()
    if (studentGrades.length === 0) return 0
    const total = studentGrades.reduce((sum: number, g: any) => sum + (g.percentage || 0), 0)
    return (total / studentGrades.length).toFixed(2)
  }

  if (loading) return <div className="text-center py-4">Loading performance data...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Select Student</label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="">Choose a student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.first_name} {s.last_name}
              </option>
            ))}
          </select>
        </div>

        {selectedStudent && (
          <>
            <div className="p-4 bg-muted rounded">
              <p className="text-sm text-muted-foreground">Average Percentage</p>
              <p className="text-3xl font-bold">{calculateAveragePercentage()}%</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Grade History</h3>
              {getStudentGrades().length === 0 ? (
                <p className="text-muted-foreground">No grades recorded</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Assessment</th>
                        <th className="text-left py-2">Score</th>
                        <th className="text-left py-2">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getStudentGrades().map((grade: any) => (
                        <tr key={grade.id} className="border-b">
                          <td className="py-2 capitalize">{grade.assessment_type}</td>
                          <td className="py-2">{grade.percentage?.toFixed(1)}%</td>
                          <td className="py-2 font-bold">{grade.grade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
