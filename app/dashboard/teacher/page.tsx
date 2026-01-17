"use client"

import { ProtectedRoute } from "@/lib/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AttendanceTracker } from "@/components/attendance-tracker"
import { GradesManagement } from "@/components/grades-management"
import { useState } from "react"

export default function TeacherPage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage attendance, grades, and assignments</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">My Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">6</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">145</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">12</p>
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
          </div>

          {activeTab === "overview" && (
            <Card>
              <CardHeader>
                <CardTitle>Welcome to Your Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Use the tabs above to manage your classes and grades</p>
              </CardContent>
            </Card>
          )}
          {activeTab === "attendance" && <AttendanceTracker />}
          {activeTab === "grades" && <GradesManagement />}
          {activeTab === "assignments" && (
            <Card>
              <CardHeader>
                <CardTitle>Assignment Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Create and manage student assignments</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
