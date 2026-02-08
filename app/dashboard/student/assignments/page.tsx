"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/lib/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { assignmentAPI } from "@/lib/api"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Assignment {
  title?: string
  description?: string
  due_date?: string
  teacher_name?: string
  teacher?: {
    full_name?: string
    username?: string
  }
}

interface Submission {
  status?: string
  score?: number
  feedback?: string
}

interface AssignmentData {
  assignment?: Assignment
  submission?: Submission
  // Properties if the item is the assignment itself (flattened structure)
  title?: string
  description?: string
  due_date?: string
  teacher_name?: string
  teacher?: {
    full_name?: string
    username?: string
  }
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true)
        setError("")

        // Check if the method exists to help debugging
        if (typeof assignmentAPI.studentAssignments !== "function") {
          console.error("Available assignmentAPI methods:", Object.keys(assignmentAPI))
          throw new Error(`assignmentAPI.studentAssignments is not a function. Check console for available methods.`)
        }

        const res = await assignmentAPI.studentAssignments()
        setAssignments(Array.isArray(res.data) ? res.data : [])
      } catch (err: any) {
        console.error("Failed to fetch assignments:", err?.response?.data || err?.message)
        setError("Failed to load assignments. Please try refreshing the page.")
      } finally {
        setLoading(false)
      }
    }

    fetchAssignments()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  if (error) {
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
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-600">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

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

        <div className="grid grid-cols-1 gap-4">
          {assignments.length > 0 ? (
            assignments.map((item, idx) => {
              const assignment = item.assignment || item
              const submission = item.submission || null

              return (
                <Card key={idx}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{assignment?.title || "Untitled Assignment"}</CardTitle>
                      <Badge variant={submission?.status === "submitted" ? "default" : "secondary"}>
                        {submission?.status || "Not Submitted"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p>{assignment?.description || "No description provided"}</p>
                    </div>
                    {(assignment?.teacher_name || assignment?.teacher?.full_name || assignment?.teacher?.username) && (
                      <div>
                        <p className="text-sm text-muted-foreground">Teacher</p>
                        <p className="font-medium">
                          {assignment.teacher_name || assignment.teacher?.full_name || assignment.teacher?.username}
                        </p>
                      </div>
                    )}
                    <div className="grid-colors-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Due Date</p>
                        <p className="font-semibold">{assignment?.due_date || "No due date"}</p>
                      </div>
                      {submission?.score !== null && submission?.score !== undefined && (
                        <div>
                          <p className="text-sm text-muted-foreground">Score</p>
                          <p className="font-semibold">{submission.score}</p>
                        </div>
                      )}
                      {submission?.feedback && (
                        <div>
                          <p className="text-sm text-muted-foreground">Feedback</p>
                          <p className="font-semibold">{submission.feedback}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">No assignments available</div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
