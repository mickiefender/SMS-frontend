"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { academicsAPI, authAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, Trash2, Edit2, Search } from "lucide-react"
import { Suspense } from "react"

interface Subject {
  id: number
  name: string
  code: string
  description?: string
  school?: number
}

function SubjectsPageContent() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isOpen, setIsOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [formData, setFormData] = useState({ name: "", code: "", description: "", credit_hours: "3" })
  const [schoolId, setSchoolId] = useState<number | null>(null)

  const itemsPerPage = 10

  const fetchUserAndSubjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get authenticated user's school
      const userRes = await authAPI.me()
      console.log("[v0] User data:", userRes.data)
      
      if (!userRes.data.school) {
        setError("Your account is not associated with a school. Contact your administrator.")
        setLoading(false)
        return
      }
      
      setSchoolId(userRes.data.school)
      console.log("[v0] School ID set to:", userRes.data.school)
      
      // Fetch subjects
      const response = await academicsAPI.subjects()
      setSubjects(response.data.results || response.data || [])
      setError(null)
    } catch (err: any) {
      console.log("[v0] Error loading user/subjects:", err?.response?.data || err?.message)
      setError("Failed to load subjects. Please ensure you are logged in as a school admin.")
    } finally {
      setLoading(false)
    }
  }

  const fetchSubjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch subjects
      const response = await academicsAPI.subjects()
      setSubjects(response.data.results || response.data || [])
      setError(null)
    } catch (err: any) {
      console.log("[v0] Error loading subjects:", err?.response?.data || err?.message)
      setError("Failed to load subjects. Please ensure you are logged in as a school admin.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserAndSubjects()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!formData.name || !formData.code) {
        setError("Subject name and code are required")
        return
      }

      if (!schoolId) {
        setError("School ID not loaded. Please refresh the page.")
        return
      }

      const data = {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        credit_hours: parseInt(formData.credit_hours, 10),
        school: schoolId,
      }

      console.log("[v0] Submitting subject data:", data)

      if (editingSubject) {
        await academicsAPI.updateSubject(editingSubject.id, data)
      } else {
        await academicsAPI.createSubject(data)
      }
      setIsOpen(false)
      setEditingSubject(null)
      setFormData({ name: "", code: "", description: "", credit_hours: "3" })
      setError(null)
      fetchUserAndSubjects()
    } catch (err: any) {
      console.log("[v0] Error details:", err?.response?.data)
      setError(err?.response?.data?.detail || JSON.stringify(err?.response?.data) || "Failed to save subject")
    }
  }

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject)
    setFormData({ 
      name: subject.name, 
      code: subject.code, 
      description: subject.description || "",
      credit_hours: "3"
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure?")) {
      try {
        await academicsAPI.deleteSubject(id)
        fetchUserAndSubjects()
      } catch (err) {
        setError("Failed to delete subject")
      }
    }
  }

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage)
  const paginatedSubjects = filteredSubjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-purple-700">Subject List</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">+ Add Subject</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSubject ? "Edit Subject" : "Add New Subject"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Subject Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Subject Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Credit Hours</Label>
                <Input
                  type="number"
                  value={formData.credit_hours}
                  onChange={(e) => setFormData({ ...formData, credit_hours: e.target.value })}
                  min="1"
                  max="10"
                />
              </div>
              <Button type="submit" className="w-full bg-purple-600">
                {editingSubject ? "Update" : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <Input
          placeholder="Search subjects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Subject Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Subject Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSubjects.map((subject) => (
              <tr key={subject.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 font-medium">{subject.name}</td>
                <td className="px-6 py-3">#{subject.code}</td>
                <td className="px-6 py-3">{subject.description || "N/A"}</td>
                <td className="px-6 py-3 flex gap-2">
                  <button onClick={() => handleEdit(subject)} className="text-blue-600">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(subject.id)} className="text-red-600">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">{itemsPerPage} / page</span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={18} />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
              className={currentPage === page ? "bg-purple-600" : ""}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function SubjectsPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <SubjectsPageContent />
    </Suspense>
  )
}
