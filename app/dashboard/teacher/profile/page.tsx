"use client"

import { useState, useEffect } from "react"
import { authAPI, usersAPI } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ProfilePictureUpload from "@/components/profile-picture-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit2, Save, X } from "lucide-react"
import Loader from '@/components/loader'

interface TeacherProfile {
  id: number
  teacher_id?: number
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
  const [formData, setFormData] = useState<TeacherProfile | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const res = await authAPI.me()
        let data = res.data

        if (data.role === 'teacher') {
          try {
            const teachersRes = await usersAPI.teachers()
            const teachers = teachersRes.data.results || teachersRes.data
            const teacherProfile = teachers.find((t: any) => (t.user?.id || t.user) === data.id)
            if (teacherProfile) {
              data = { ...data, ...teacherProfile, teacher_id: teacherProfile.id, id: data.id }
            }
          } catch (e) {
            console.error("Error fetching teacher details:", e)
          }
        }
        setProfile(data)
      } catch (err) {
        console.error("Error fetching profile:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [refreshTrigger])

  const handleEditClick = () => {
    setFormData(profile)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData(null)
  }

  const handleSave = async () => {
    if (!formData || !profile) return
    try {
      setLoading(true)
      if (profile.teacher_id) {
        // Update teacher specific fields
        const teacherData = {
          user: profile.id,
          qualification: formData.qualification,
          experience_years: formData.experience_years,
          department: formData.department || null,
          bio: formData.bio,
          employee_id: formData.employee_id,
        }
        await usersAPI.updateTeacher(profile.teacher_id, teacherData)

        // Update user common fields
        const userData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          email: formData.email,
          username: formData.username,
        }
        await usersAPI.update(profile.id, userData)
      } else {
        await usersAPI.update(profile.id, formData)
      }
      setRefreshTrigger((prev) => prev + 1)
      setIsEditing(false)
    } catch (err) {
      console.error("Error updating profile:", err)
    } finally {
      setLoading(false)
    }
  }

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
                <Label>First Name</Label>
                {isEditing ? (
                  <Input
                    value={formData?.first_name || ""}
                    onChange={(e) => setFormData({ ...formData!, first_name: e.target.value })}
                  />
                ) : (
                  <p className="font-semibold">{profile?.first_name}</p>
                )}
              </div>
              <div>
                <Label>Last Name</Label>
                {isEditing ? (
                  <Input
                    value={formData?.last_name || ""}
                    onChange={(e) => setFormData({ ...formData!, last_name: e.target.value })}
                  />
                ) : (
                  <p className="font-semibold">{profile?.last_name}</p>
                )}
              </div>
              <div>
                <Label>Username</Label>
                <p className="font-semibold">{profile?.username}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="font-semibold">{profile?.email}</p>
              </div>
              <div>
                <Label>Phone</Label>
                {isEditing ? (
                  <Input
                    value={formData?.phone || ""}
                    onChange={(e) => setFormData({ ...formData!, phone: e.target.value })}
                  />
                ) : (
                  <p className="font-semibold">{profile?.phone || "Not provided"}</p>
                )}
              </div>
              <div>
                <Label>Employee ID</Label>
                <p className="font-semibold">{profile?.employee_id || "Not available"}</p>
              </div>
              <div>
                <Label>Qualification</Label>
                {isEditing ? (
                  <Input
                    value={formData?.qualification || ""}
                    onChange={(e) => setFormData({ ...formData!, qualification: e.target.value })}
                  />
                ) : (
                  <p className="font-semibold">{profile?.qualification || "Not provided"}</p>
                )}
              </div>
              <div>
                <Label>Experience (Years)</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData?.experience_years || 0}
                    onChange={(e) => setFormData({ ...formData!, experience_years: parseInt(e.target.value) || 0 })}
                  />
                ) : (
                  <p className="font-semibold">{profile?.experience_years || 0}</p>
                )}
              </div>
              <div>
                <Label>Department</Label>
                {isEditing ? (
                  <Input
                    value={formData?.department || ""}
                    onChange={(e) => setFormData({ ...formData!, department: e.target.value })}
                  />
                ) : (
                  <p className="font-semibold">{profile?.department || "Not assigned"}</p>
                )}
              </div>
              <div className="col-span-2">
                <Label>Bio</Label>
                {isEditing ? (
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData?.bio || ""}
                    onChange={(e) => setFormData({ ...formData!, bio: e.target.value })}
                  />
                ) : (
                  <p className="font-semibold">{profile?.bio || "No bio provided"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <div className="flex gap-2 pt-4 border-t">
            {!isEditing ? (
              <Button className="bg-blue-600" onClick={handleEditClick}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <>
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
