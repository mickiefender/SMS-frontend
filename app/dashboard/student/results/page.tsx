"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/lib/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ResultsPage() {
  const [grades, setGrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true)
        const res = await apiClient.get("/students/student-portal/exam_results/")
        setGrades(res.data || [])
      } catch (err: any) {
        setError("Failed to load results")
        console.error("[v0] Failed to fetch results:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/student">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">My Results</h1>
        </div>

        {error && <div className="text-red-500">{error}</div>}

        <Card>
          <CardHeader>
            <CardTitle>Exam Results</CardTitle>
          </CardHeader>
          <CardContent>
            {grades.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Subject</th>
                      <th className="text-left py-2 px-4">Score</th>
                      <th className="text-left py-2 px-4">Percentage</th>
                      <th className="text-left py-2 px-4">Grade</th>
                      <th className="text-left py-2 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((grade) => (
                      <tr key={grade.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-4 font-medium">{grade.subject_name}</td>
                        <td className="py-2 px-4">
                          {grade.score}/{grade.max_score}
                        </td>
                        <td className="py-2 px-4">{Math.round(grade.percentage)}%</td>
                        <td className="py-2 px-4 font-bold text-primary">{grade.grade}</td>
                        <td className="py-2 px-4 text-sm text-muted-foreground">{grade.recorded_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No exam results available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
