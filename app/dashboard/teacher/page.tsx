"use client"

import { ProtectedRoute } from "@/lib/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AttendanceTracker } from "@/components/attendance-tracker"
import { GradesManagement } from "@/components/grades-management"
import { AssignmentManagement } from "@/components/assignment-management"
import { TeacherClasses } from "@/components/teacher-classes"
import { LearningMaterials } from "@/components/learning-materials"
import { StudentPerformance } from "@/components/student-performance"
import { TeacherMessaging } from "@/components/teacher-messaging"
import { AssignmentSubmissionGrading } from "@/components/assignment-submission-grading"
import { useState, useEffect } from "react"
import { academicsAPI, assignmentAPI } from "@/lib/api"
import { useAuthContext } from "@/lib/auth-context"

export default function TeacherPage() {
  const { user } = useAuthContext()
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState({
    classes: 0,
    students: 0,
    pending_assignments: 0,
    pending_submissions: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [classesRes, assignmentsRes, submissionsRes] = await Promise.all([
          academicsAPI.classes(),
          assignmentAPI.list(),
          assignmentAPI.submissions(),
        ])

        const classes = classesRes.data.results || classesRes.data || []
        const assignments = assignmentsRes.data.results || assignmentsRes.data || []
        const submissions = submissionsRes.data.results || submissionsRes.data || []
        const pendingSubmissions = submissions.filter((s: any) => s.status === "submitted").length

        setStats({
          classes: classes.length,
          students: 0,
          pending_assignments: assignments.length,
          pending_submissions: pendingSubmissions,
        })
      } catch (error) {
        console.error("[v0] Failed to fetch stats:", error)
      }
    }

    fetchStats()
  }, [])

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage classes, attendance, grades, assignments, and student performance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">My Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.classes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.pending_assignments}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">{stats.pending_submissions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.students}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded ${activeTab === "overview" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("classes")}
              className={`px-4 py-2 rounded ${activeTab === "classes" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              My Classes
            </button>
            <button
              onClick={() => setActiveTab("attendance")}
              className={`px-4 py-2 rounded ${activeTab === "attendance" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              Attendance
            </button>
            <button
              onClick={() => setActiveTab("grades")}
              className={`px-4 py-2 rounded ${activeTab === "grades" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              Grades
            </button>
            <button
              onClick={() => setActiveTab("assignments")}
              className={`px-4 py-2 rounded ${activeTab === "assignments" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              Assignments
            </button>
            <button
              onClick={() => setActiveTab("submissions")}
              className={`px-4 py-2 rounded ${activeTab === "submissions" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              Submissions
            </button>
            <button
              onClick={() => setActiveTab("performance")}
              className={`px-4 py-2 rounded ${activeTab === "performance" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              Performance
            </button>
            <button
              onClick={() => setActiveTab("materials")}
              className={`px-4 py-2 rounded ${activeTab === "materials" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              Materials
            </button>
            <button
              onClick={() => setActiveTab("messaging")}
              className={`px-4 py-2 rounded ${activeTab === "messaging" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              Messages
            </button>
          </div>

          {activeTab === "overview" && (
            <Card>
              <CardHeader>
                <CardTitle>Welcome to Your Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">
                  Use the tabs above to manage your classes, mark attendance, record grades, create assignments, and
                  track student performance.
                </p>
              </CardContent>
            </Card>
          )}
          {activeTab === "classes" && <TeacherClasses />}
          {activeTab === "attendance" && <AttendanceTracker />}
          {activeTab === "grades" && <GradesManagement />}
          {activeTab === "assignments" && <AssignmentManagement />}
          {activeTab === "submissions" && <AssignmentSubmissionGrading />}
          {activeTab === "performance" && <StudentPerformance />}
          {activeTab === "materials" && <LearningMaterials />}
          {activeTab === "messaging" && <TeacherMessaging />}
        </div>
      </div>
    </ProtectedRoute>
  )
}
