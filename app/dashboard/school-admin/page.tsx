"use client"

import { ProtectedRoute } from "@/lib/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StudentsManagement } from "@/components/students-management"
import { TeachersManagement } from "@/components/teachers-management"
import { SchoolProfileSetup } from "@/components/school-profile-setup"
import { AcademicCalendar } from "@/components/academic-calender"
import { AcademicStructure } from "@/components/academic-structure"
import { TeacherAssignment } from "@/components/teacher-assignment"
import { TimetableManagement } from "@/components/timetable-management"
import { AnnouncementsMessaging } from "@/components/announcements-messaging"
import { useState, useEffect } from "react"
import { academicsAPI, usersAPI } from "@/lib/api"

export default function SchoolAdminPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    loading: true,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [students, teachers, classes, subjects] = await Promise.all([
          usersAPI.students(),
          usersAPI.teachers(),
          academicsAPI.classes(),
          academicsAPI.subjects(),
        ])

        setStats({
          totalStudents: students?.data?.results?.length || students?.data?.length || 0,
          totalTeachers: teachers?.data?.results?.length || teachers?.data?.length || 0,
          totalClasses: classes?.data?.results?.length || classes?.data?.length || 0,
          totalSubjects: subjects?.data?.results?.length || subjects?.data?.length || 0,
          loading: false,
        })
      } catch (error: any) {
        console.error("[v0] Failed to fetch stats:", error?.response?.status, error?.message)
        setStats((prev) => ({ ...prev, loading: false }))
      }
    }

    fetchStats()
  }, [])

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "school-profile", label: "School Profile" },
    { id: "academic-calendar", label: "Calendar" },
    { id: "academics", label: "Academics" },
    { id: "students", label: "Students" },
    { id: "teachers", label: "Teachers" },
    { id: "assignments", label: "Assignments" },
    { id: "timetable", label: "Timetable" },
    { id: "announcements", label: "Announcements" },
  ]

  return (
    <ProtectedRoute allowedRoles={["school_admin"]}>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">School Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage all school operations and academics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.loading ? "..." : stats.totalStudents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.loading ? "..." : stats.totalTeachers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.loading ? "..." : stats.totalClasses}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.loading ? "..." : stats.totalSubjects}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded whitespace-nowrap transition-colors ${
                  activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div>
            {activeTab === "overview" && (
              <Card>
                <CardHeader>
                  <CardTitle>Welcome to Your School Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Use the tabs above to manage all aspects of your school</p>
                </CardContent>
              </Card>
            )}
            {activeTab === "school-profile" && <SchoolProfileSetup />}
            {activeTab === "academic-calendar" && <AcademicCalendar />}
            {activeTab === "academics" && <AcademicStructure />}
            {activeTab === "students" && <StudentsManagement />}
            {activeTab === "teachers" && <TeachersManagement />}
            {activeTab === "assignments" && <TeacherAssignment />}
            {activeTab === "timetable" && <TimetableManagement />}
            {activeTab === "announcements" && <AnnouncementsMessaging />}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
