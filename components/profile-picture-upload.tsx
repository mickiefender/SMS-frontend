"use client"

import type React from "react"
import { useState, useRef } from "react"
import { academicsAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { Upload, Trash2 } from "lucide-react"

interface ProfilePictureUploadProps {
  userId: number
  userName: string
  currentPicture?: string
  onUploadSuccess?: () => void
}

export default function ProfilePictureUpload({
  userId,
  userName,
  currentPicture,
  onUploadSuccess,
}: ProfilePictureUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [preview, setPreview] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB")
        return
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file")
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    try {
      setError(null)

      if (!fileInputRef.current?.files?.[0]) {
        setError("Please select a file")
        return
      }

      setUploading(true)
      const formData = new FormData()
      formData.append("user", userId.toString())
      formData.append("picture", fileInputRef.current.files[0])

      // Check if user already has a picture
      const existing = await academicsAPI.profilePictures()
      const userPicture = (existing.data.results || []).find((p: any) => p.user === userId)

      if (userPicture) {
        await academicsAPI.updateProfilePicture(userPicture.id, formData)
      } else {
        await academicsAPI.createProfilePicture(formData)
      }

      setIsOpen(false)
      setPreview("")
      if (fileInputRef.current) fileInputRef.current.value = ""
      onUploadSuccess?.()
    } catch (err: any) {
      console.error("Error:", err?.response?.data)
      setError(err?.response?.data?.detail || "Failed to upload picture")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete your profile picture?")) {
      try {
        const existing = await academicsAPI.profilePictures()
        const userPicture = (existing.data.results || []).find((p: any) => p.user === userId)
        if (userPicture) {
          await academicsAPI.deleteProfilePicture(userPicture.id)
          onUploadSuccess?.()
        }
      } catch (err) {
        setError("Failed to delete picture")
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-200 border-2 border-gray-300">
        {currentPicture ? (
          <Image
            src={currentPicture || "/placeholder.svg"}
            alt={userName}
            fill
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center">
            No Picture
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="bg-blue-600">
            <Upload className="w-4 h-4 mr-2" />
            Upload Photo
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Profile Picture</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {error && <div className="bg-red-100 text-red-700 p-3 rounded text-sm">{error}</div>}

            <div>
              <Label>Select Image File</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">Max file size: 5MB. Supported: JPG, PNG, GIF</p>
            </div>

            {preview && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={preview || "/placeholder.svg"}
                  alt="Preview"
                  fill
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={uploading || !preview}
                className="flex-1 bg-blue-600"
              >
                {uploading ? "Uploading..." : "Upload"}
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {currentPicture && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleDelete}
          className="text-red-600 bg-transparent"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Remove Photo
        </Button>
      )}
    </div>
  )
}
