"use client"

import { ProtectedRoute } from "@/lib/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthContext } from "@/lib/auth-context"

export default function StudentPage() {
  const { user } = useAuthContext()

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground mt-2">View your enrollment, grades, and attendance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Current GPA</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">3.85</p>
              <p className="text-xs text-muted-foreground">Out of 4.0</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">92%</p>
              <p className="text-xs text-muted-foreground">This semester</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">6</p>
              <p className="text-xs text-muted-foreground">This semester</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Grades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { subject: "Mathematics", grade: "A", score: 92 },
                  { subject: "English", grade: "A-", score: 88 },
                  { subject: "Science", grade: "B+", score: 85 },
                ].map((item) => (
                  <div key={item.subject} className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">{item.subject}</span>
                    <div className="flex gap-4">
                      <span className="text-muted-foreground">{item.score}%</span>
                      <span className="font-bold text-primary">{item.grade}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Timetable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { time: "09:00 AM - 10:30 AM", subject: "Mathematics" },
                  { time: "10:45 AM - 12:15 PM", subject: "English" },
                  { time: "01:00 PM - 02:30 PM", subject: "Science" },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">{item.subject}</span>
                    <span className="text-sm text-muted-foreground">{item.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
