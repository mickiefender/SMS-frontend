"use client"

import type React from "react"

import { useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Upload, File, Download } from "lucide-react"

function MaterialsContent() {
  const [materials, setMaterials] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/materials/upload/", {
        method: "POST",
        body: formData,
      })
      if (res.ok) {
        const data = await res.json()
        setMaterials([...materials, data])
      }
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-red-600 mb-2">Learning Materials</h1>
          <p className="text-gray-600">Upload and manage course materials</p>
        </div>
        <label>
          <input type="file" onChange={handleUpload} className="hidden" />
          <Button asChild className="bg-red-600 hover:bg-red-700 gap-2 cursor-pointer">
            <span>
              <Upload size={20} /> Upload Material
            </span>
          </Button>
        </label>
      </div>

      <div className="grid gap-4">
        {materials.map((m) => (
          <div
            key={m.id}
            className="border rounded-lg p-4 flex justify-between items-center hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="bg-red-100 p-3 rounded-lg">
                <File className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{m.title}</h3>
                <p className="text-sm text-gray-600">{m.created_at}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="gap-2 bg-transparent">
              <Download size={18} /> Download
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MaterialsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MaterialsContent />
    </Suspense>
  )
}
