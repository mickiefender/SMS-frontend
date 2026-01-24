"use client"

import { ProtectedRoute } from "@/lib/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, ClipboardList, CheckCircle, TrendingUp, FileText, MessageSquare, Award } from "lucide-react"
import { useState, useEffect } from "react"
import { academicsAPI, assignmentAPI } from "@/lib/api"
import { useAuthContext } from "@/lib/auth-context"
import TeacherClassesDashboard from "@/components/TeacherClassesDashboard"
import AttendanceTracker from "@/components/AttendanceTracker"
import GradesManagement from "@/components/GradesManagement"
import AssignmentManagement from "@/components/AssignmentManagement"
import AssignmentSubmissionGrading from "@/components/AssignmentSubmissionGrading"
import StudentPerformance from "@/components/StudentPerformance"
import LearningMaterials from "@/components/LearningMaterials"
import TeacherMessaging from "@/components/TeacherMessaging"

export default function TeacherPage() {
  const { user } = useAuthContext()
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
          students: classes.reduce((total: number, cls: any) => total + (cls.student_enrollments?.length || 0), 0),
          pending_assignments: assignments.filter((a: any) => a.status === "active").length,
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
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Welcome, {user?.first_name || "Teacher"}</h1>
          <p className="text-gray-600 mt-2 text-lg">Here's your teaching overview and quick stats</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">My Classes</CardTitle>
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.classes}</p>
              <p className="text-xs text-gray-500 mt-1">Active classes</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.students}</p>
              <p className="text-xs text-gray-500 mt-1">Enrolled students</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Assignments</CardTitle>
                <ClipboardList className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.pending_assignments}</p>
              <p className="text-xs text-gray-500 mt-1">Active assignments</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Pending Reviews</CardTitle>
                <CheckCircle className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.pending_submissions}</p>
              <p className="text-xs text-gray-500 mt-1">Submissions to review</p>
            </CardContent>
          </Card>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <a href="/dashboard/teacher/my-classes" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                <p className="font-medium text-gray-900">View My Classes</p>
                <p className="text-sm text-gray-500">Manage your assigned classes</p>
              </a>
              <a href="/dashboard/teacher/attendance" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                <p className="font-medium text-gray-900">Mark Attendance</p>
                <p className="text-sm text-gray-500">Record student attendance</p>
              </a>
              <a href="/dashboard/teacher/assignments" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                <p className="font-medium text-gray-900">Create Assignment</p>
                <p className="text-sm text-gray-500">Set new assignments for students</p>
              </a>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                Teaching Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <a href="/dashboard/teacher/grades" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                <p className="font-medium text-gray-900">Record Grades</p>
                <p className="text-sm text-gray-500">Enter and manage student grades</p>
              </a>
              <a href="/dashboard/teacher/materials" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                <p className="font-medium text-gray-900">Learning Materials</p>
                <p className="text-sm text-gray-500">Upload and manage course materials</p>
              </a>
              <a href="/dashboard/teacher/messages" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                <p className="font-medium text-gray-900">Messages</p>
                <p className="text-sm text-gray-500">Communicate with students and parents</p>
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <FileText className="h-5 w-5 text-blue-600" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700">
            <p>Welcome to your teacher dashboard! Use the sidebar to navigate to different sections of your teaching toolkit. Each page provides tools to manage your classes, track student progress, and communicate effectively with your students and parents.</p>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
