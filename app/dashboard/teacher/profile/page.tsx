"use client"

import { useState, useEffect } from "react"
import { authAPI } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ProfilePictureUpload from "@/components/profile-picture-upload"
import { Button } from "@/components/ui/button"
import { Edit2, Save } from "lucide-react"
import Loader from '@/components/loader'

interface TeacherProfile {
  id: number
  email: string
  first_name: string
  last_name: string
  phone?: string
  username: string
  employee_id?: string
  qualification?: string
  experience_years?: number
  department?: string
  bio?: string
  picture?: string
}

export default function TeacherProfilePage() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const res = await authAPI.me()
        setProfile(res.data)
      } catch (err) {
        console.error("Error fetching profile:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [refreshTrigger])

  if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader size="md" color="#f5c607" />
    </div>
  )
}

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Teacher Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>My Profile Information</CardTitle>
          <CardDescription>View and manage your profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex justify-center pb-6 border-b">
            <ProfilePictureUpload
              userId={profile?.id || 0}
              userName={`${profile?.first_name} ${profile?.last_name}`}
              currentPicture={profile?.picture}
              onUploadSuccess={() => setRefreshTrigger((prev) => prev + 1)}
            />
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
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
                <p className="font-semibold">{profile?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-semibold">{profile?.phone || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Employee ID</p>
                <p className="font-semibold">{profile?.employee_id || "Not available"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Qualification</p>
                <p className="font-semibold">{profile?.qualification || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Experience (Years)</p>
                <p className="font-semibold">{profile?.experience_years || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Department</p>
                <p className="font-semibold">{profile?.department || "Not assigned"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Bio</p>
                <p className="font-semibold">{profile?.bio || "No bio provided"}</p>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <div className="flex gap-2 pt-4 border-t">
            <Button className="bg-blue-600" onClick={() => setIsEditing(!isEditing)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            {isEditing && (
              <Button variant="outline">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
