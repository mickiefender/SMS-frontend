"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { academicsAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Edit2, Plus, Download } from "lucide-react"

interface Document {
  id: number
  title: string
  document_type: string
  subject_name: string
  class_name: string
  uploaded_by_name: string
  created_at: string
  file: string
}

export default function ManageDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<Document | null>(null)
  const [subjects, setSubjects] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    title: "",
    document_type: "syllabus",
    description: "",
    related_subject: "",
    related_class: "",
    file: null as File | null,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [docsRes, subjectsRes, classesRes] = await Promise.all([
        academicsAPI.documents(),
        academicsAPI.subjects(),
        academicsAPI.classes(),
      ])

      setDocuments(docsRes.data.results || docsRes.data || [])
      setSubjects(subjectsRes.data.results || subjectsRes.data || [])
      setClasses(classesRes.data.results || classesRes.data || [])
      setError(null)
    } catch (err: any) {
      console.error("Error:", err)
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!formData.title || !formData.file) {
        setError("Please fill in required fields and select a file")
        return
      }

      const formDataToSend = new FormData()
      formDataToSend.append("title", formData.title)
      formDataToSend.append("document_type", formData.document_type)
      formDataToSend.append("description", formData.description)
      if (formData.related_subject) formDataToSend.append("related_subject", formData.related_subject)
      if (formData.related_class) formDataToSend.append("related_class", formData.related_class)
      if (formData.file) formDataToSend.append("file", formData.file)

      if (editingDoc) {
        await academicsAPI.updateDocument(editingDoc.id, formDataToSend)
      } else {
        await academicsAPI.uploadDocument(formDataToSend)
      }

      setIsOpen(false)
      setEditingDoc(null)
      setFormData({ title: "", document_type: "syllabus", description: "", related_subject: "", related_class: "", file: null })
      if (fileInputRef.current) fileInputRef.current.value = ""
      setError(null)
      fetchData()
    } catch (err: any) {
      console.error("Error:", err?.response?.data)
      setError(err?.response?.data?.detail || "Failed to save document")
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure?")) {
      try {
        await academicsAPI.deleteDocument(id)
        fetchData()
      } catch (err) {
        setError("Failed to delete document")
      }
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Documents</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingDoc(null)
                setFormData({ title: "", document_type: "syllabus", description: "", related_subject: "", related_class: "", file: null })
              }}
              className="bg-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDoc ? "Edit Document" : "Upload New Document"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}

              <div>
                <Label>Document Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Math Syllabus"
                />
              </div>

              <div>
                <Label>Document Type</Label>
                <select
                  value={formData.document_type}
                  onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="certificate">Certificate</option>
                  <option value="transcript">Transcript</option>
                  <option value="syllabus">Syllabus</option>
                  <option value="assignment">Assignment</option>
                  <option value="notes">Notes</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <Label>Subject (Optional)</Label>
                <select
                  value={formData.related_subject}
                  onChange={(e) => setFormData({ ...formData, related_subject: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Class (Optional)</Label>
                <select
                  value={formData.related_class}
                  onChange={(e) => setFormData({ ...formData, related_class: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Upload File *</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                />
              </div>

              <Button type="submit" className="w-full bg-purple-600">
                {editingDoc ? "Update" : "Upload"} Document
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Documents List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Title</th>
                  <th className="text-left py-3 px-4 font-semibold">Type</th>
                  <th className="text-left py-3 px-4 font-semibold">Subject</th>
                  <th className="text-left py-3 px-4 font-semibold">Class</th>
                  <th className="text-left py-3 px-4 font-semibold">Uploaded By</th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{doc.title}</td>
                    <td className="py-3 px-4 capitalize">{doc.document_type}</td>
                    <td className="py-3 px-4">{doc.subject_name || "-"}</td>
                    <td className="py-3 px-4">{doc.class_name || "-"}</td>
                    <td className="py-3 px-4">{doc.uploaded_by_name}</td>
                    <td className="py-3 px-4">{new Date(doc.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 flex gap-2">
                      <a href={doc.file} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(doc.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
