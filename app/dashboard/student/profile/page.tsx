"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/lib/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuthContext } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ProfilePage() {
  const { user } = useAuthContext()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const res = await apiClient.get("/students/student-portal/my_portal/")
        setProfile(res.data)
      } catch (err: any) {
        setError("Failed to load profile")
        console.error("[v0] Failed to fetch profile:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
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
          <h1 className="text-3xl font-bold">My Profile</h1>
        </div>

        {error && <div className="text-red-500">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-semibold">
                  {user?.first_name} {user?.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-semibold">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Student ID</p>
                <p className="font-semibold">{profile?.profile?.student_id || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-semibold">{user?.phone || "Not provided"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="font-semibold">{profile?.profile?.level || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current GPA</p>
                <p className="font-semibold">{profile?.gpa?.current_gpa?.toFixed(2) || "0.00"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Credits</p>
                <p className="font-semibold">{profile?.gpa?.total_credits || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enrollment Date</p>
                <p className="font-semibold">{profile?.profile?.enrollment_date || "N/A"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enrolled Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {profile?.enrollments && profile.enrollments.length > 0 ? (
                profile.enrollments.map((enrollment: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center pb-2 border-b">
                    <div>
                      <p className="font-semibold">{enrollment.subject}</p>
                      <p className="text-sm text-muted-foreground">{enrollment.subject_code}</p>
                    </div>
                    <p className="text-sm font-medium">{enrollment.class}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No courses enrolled</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
