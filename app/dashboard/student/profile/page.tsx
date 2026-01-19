"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { authAPI } from "@/lib/api"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import ProfilePictureUpload from "@/components/profile-picture-upload"

interface StudentProfile {
  id: number
  email: string
  first_name: string
  last_name: string
  phone?: string
  username: string
  student_id?: string
  department?: string
  level?: string
  picture?: string
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const res = await authAPI.me()
        setProfile(res.data)
      } catch (err: any) {
        setError("Failed to load profile")
        console.error("[v0] Failed to fetch profile:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [refreshTrigger])

  if (loading) return <div className="p-8">Loading...</div>

  return (
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Picture Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ProfilePictureUpload
              userId={profile?.id || 0}
              userName={`${profile?.first_name} ${profile?.last_name}`}
              currentPicture={profile?.picture}
              onUploadSuccess={() => setRefreshTrigger((prev) => prev + 1)}
            />
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">First Name</p>
                <p className="font-semibold">{profile?.first_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Name</p>
                <p className="font-semibold">{profile?.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Username</p>
                <p className="font-semibold">{profile?.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold text-sm">{profile?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-semibold">{profile?.phone || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Student ID</p>
                <p className="font-semibold">{profile?.student_id || "Not available"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Level</p>
                <p className="font-semibold">{profile?.level || "Not assigned"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Department</p>
                <p className="font-semibold">{profile?.department || "Not assigned"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
