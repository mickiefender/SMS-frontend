"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { academicsAPI, usersAPI, authAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus, Upload } from "lucide-react"
import Image from "next/image"

interface ProfilePicture {
  id: number
  user: number
  user_name: string
  picture: string
  uploaded_at: string
}

export default function ManageProfilePicturesPage() {
  const [pictures, setPictures] = useState<ProfilePicture[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    user_id: "",
    picture: null as File | null,
    preview: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [picsRes, studentsRes, teachersRes] = await Promise.all([
        academicsAPI.profilePictures(),
        usersAPI.students(),
        usersAPI.teachers(),
      ])

      setPictures(picsRes.data.results || picsRes.data || [])
      setStudents(studentsRes.data.results || studentsRes.data || [])
      setTeachers(teachersRes.data.results || teachersRes.data || [])
      setError(null)
    } catch (err: any) {
      console.error("Error:", err)
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, picture: file })
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, preview: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!formData.user_id || !formData.picture) {
        setError("Please select a user and upload a picture")
        return
      }

      const formDataToSend = new FormData()
      formDataToSend.append("user", formData.user_id)
      formDataToSend.append("picture", formData.picture)

      await academicsAPI.createProfilePicture(formDataToSend)

      setIsOpen(false)
      setFormData({ user_id: "", picture: null, preview: "" })
      if (fileInputRef.current) fileInputRef.current.value = ""
      setError(null)
      fetchData()
    } catch (err: any) {
      console.error("Error:", err?.response?.data)
      setError(err?.response?.data?.detail || "Failed to upload picture")
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure?")) {
      try {
        await academicsAPI.deleteProfilePicture(id)
        fetchData()
      } catch (err) {
        setError("Failed to delete picture")
      }
    }
  }

  const allUsers = [...students.map((s) => ({ id: s.user, name: `${s.first_name} ${s.last_name}`, type: "Student" })), ...teachers.map((t) => ({ id: t.user, name: `${t.first_name} ${t.last_name}`, type: "Teacher" }))]

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Profile Pictures</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setFormData({ user_id: "", picture: null, preview: "" })
              }}
              className="bg-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Picture
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Profile Picture</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}

              <div>
                <Label>Select User (Student or Teacher) *</Label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Choose a user...</option>
                  {allUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Upload Picture *</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              {formData.preview && (
                <div className="relative w-full h-40 bg-gray-100 rounded overflow-hidden">
                  <Image
                    src={formData.preview || "/placeholder.svg"}
                    alt="Preview"
                    fill
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <Button type="submit" className="w-full bg-purple-600">
                <Upload className="w-4 h-4 mr-2" />
                Upload Picture
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Profile Pictures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {pictures.map((pic) => (
              <div key={pic.id} className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-2 rounded overflow-hidden bg-gray-100">
                  <Image
                    src={pic.picture || "/placeholder.svg"}
                    alt={pic.user_name}
                    fill
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs font-semibold truncate">{pic.user_name}</p>
                <p className="text-xs text-gray-500">{new Date(pic.uploaded_at).toLocaleDateString()}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full bg-transparent"
                  onClick={() => handleDelete(pic.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
