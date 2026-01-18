"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/lib/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true)
        const res = await apiClient.get("/students/student-portal/assignments/")
        setAssignments(res.data || [])
      } catch (err: any) {
        setError("Failed to load assignments")
        console.error("[v0] Failed to fetch assignments:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAssignments()
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
          <h1 className="text-3xl font-bold">My Assignments</h1>
        </div>

        {error && <div className="text-red-500">{error}</div>}

        <div className="grid grid-cols-1 gap-4">
          {assignments.length > 0 ? (
            assignments.map((item, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{item.assignment?.title}</CardTitle>
                    <Badge variant={item.submission?.status === "submitted" ? "default" : "secondary"}>
                      {item.submission?.status || "Not Submitted"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p>{item.assignment?.description}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="font-semibold">{item.assignment?.due_date}</p>
                    </div>
                    {item.submission?.score !== null && (
                      <div>
                        <p className="text-sm text-muted-foreground">Score</p>
                        <p className="font-semibold">{item.submission?.score}</p>
                      </div>
                    )}
                    {item.submission?.feedback && (
                      <div>
                        <p className="text-sm text-muted-foreground">Feedback</p>
                        <p className="font-semibold">{item.submission?.feedback}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">No assignments available</div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
