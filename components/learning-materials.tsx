"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState } from "react"

export function LearningMaterials() {
  const [isOpen, setIsOpen] = useState(false)
  const [materials, setMaterials] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    description: "",
  })

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement file upload logic
    setFormData({ title: "", subject: "", description: "" })
    setIsOpen(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Learning Materials</CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Upload Material</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Learning Material</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="file">Select File</Label>
                  <Input id="file" type="file" required />
                </div>
                <Button type="submit" className="w-full">
                  Upload
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {materials.length === 0 ? (
          <p className="text-muted-foreground">No learning materials uploaded yet</p>
        ) : (
          <div className="space-y-2">
            {materials.map((material: any) => (
              <div key={material.id} className="p-3 border rounded">
                <p className="font-medium">{material.title}</p>
                <p className="text-sm text-muted-foreground">{material.subject}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
