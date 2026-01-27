"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { academicsAPI, assignmentAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Plus, Calendar } from "lucide-react"
import Loader from "@/components/loader"

function AssignmentsContent() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    class_obj: "",
    subject: "",
    description: "",
    due_date: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignRes, classRes, subjectRes] = await Promise.all([
          assignmentAPI.list(),
          academicsAPI.classes(),
          academicsAPI.subjects(),
        ])
        setAssignments(assignRes.data.results || assignRes.data || [])
        setClasses(classRes.data.results || classRes.data || [])
        setSubjects(subjectRes.data.results || subjectRes.data || [])
      } catch (error) {
        console.error("Failed to fetch:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const dataToSend = {
        ...formData,
        due_date: `${formData.due_date}T23:59:59`,
      }
      await assignmentAPI.create(dataToSend)
      setIsOpen(false)
      setFormData({ title: "", class_obj: "", subject: "", description: "", due_date: "" })
    } catch (error) {
      console.error("Failed to create assignment:", error)
    }
  }

  const filteredAssignments = assignments.filter((a) => a.title.toLowerCase().includes(searchTerm.toLowerCase()))
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader size="md" color="#3b82f6" />
    </div>
  )
}
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-red-600 mb-2">Assignments</h1>
          <p className="text-gray-600">Create and manage class assignments</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 gap-2">
              <Plus size={20} /> New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Assignment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Class</Label>
                <select
                  value={formData.class_obj}
                  onChange={(e) => setFormData({ ...formData, class_obj: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                >
                  <option value="">Select class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Subject</Label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                >
                  <option value="">Select subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Description</Label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                Create Assignment
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <Input
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid gap-4">
          {filteredAssignments.map((a) => (
            <div key={a.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-gray-900">{a.title}</h3>
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm">
                  Class {a.class_name} - {a.subject_name}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-3">{a.description}</p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={16} />
                <span>Due: {new Date(a.due_date).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AssignmentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AssignmentsContent />
    </Suspense>
  )
}
