"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { academicsAPI, authAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Edit2, Plus } from "lucide-react"

interface Exam {
  id: number
  title: string
  subject_name: string
  class_name: string
  exam_date: string
  exam_time: string
  total_marks: number
  venue: string
}

export default function ManageExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [schoolId, setSchoolId] = useState<number | null>(null)
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    class_obj: "",
    exam_date: "",
    exam_time: "",
    duration_minutes: "60",
    venue: "",
    total_marks: "100",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [userRes, examsRes, classesRes, subjectsRes] = await Promise.all([
        authAPI.me(),
        academicsAPI.exams(),
        academicsAPI.classes(),
        academicsAPI.subjects(),
      ])

      if (!userRes.data.school) {
        setError("Your account is not associated with a school")
        return
      }

      setSchoolId(userRes.data.school)
      setExams(examsRes.data.results || examsRes.data || [])
      setClasses(classesRes.data.results || classesRes.data || [])
      setSubjects(subjectsRes.data.results || subjectsRes.data || [])
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
      if (!formData.title || !formData.subject || !formData.class_obj || !formData.exam_date) {
        setError("Please fill in all required fields")
        return
      }

      const data = {
        title: formData.title,
        subject: Number.parseInt(formData.subject),
        class_obj: Number.parseInt(formData.class_obj),
        exam_date: formData.exam_date,
        exam_time: formData.exam_time,
        duration_minutes: Number.parseInt(formData.duration_minutes),
        venue: formData.venue,
        total_marks: Number.parseInt(formData.total_marks),
      }

      if (editingExam) {
        await academicsAPI.updateExam(editingExam.id, data)
      } else {
        await academicsAPI.createExam(data)
      }

      setIsOpen(false)
      setEditingExam(null)
      setFormData({ title: "", subject: "", class_obj: "", exam_date: "", exam_time: "", duration_minutes: "60", venue: "", total_marks: "100" })
      setError(null)
      fetchData()
    } catch (err: any) {
      console.error("Error:", err?.response?.data)
      setError(err?.response?.data?.detail || "Failed to save exam")
    }
  }

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam)
    setFormData({
      title: exam.title,
      subject: exam.subject_name,
      class_obj: exam.class_name,
      exam_date: exam.exam_date,
      exam_time: exam.exam_time,
      duration_minutes: "60",
      venue: exam.venue,
      total_marks: exam.total_marks.toString(),
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this exam?")) {
      try {
        await academicsAPI.deleteExam(id)
        fetchData()
      } catch (err) {
        setError("Failed to delete exam")
      }
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Exams</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingExam(null)
                setFormData({ title: "", subject: "", class_obj: "", exam_date: "", exam_time: "", duration_minutes: "60", venue: "", total_marks: "100" })
              }}
              className="bg-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingExam ? "Edit Exam" : "Create New Exam"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}

              <div>
                <Label>Exam Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Midterm Exam"
                />
              </div>

              <div>
                <Label>Subject *</Label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
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
                <Label>Class *</Label>
                <select
                  value={formData.class_obj}
                  onChange={(e) => setFormData({ ...formData, class_obj: e.target.value })}
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
                <Label>Exam Date *</Label>
                <Input
                  type="date"
                  value={formData.exam_date}
                  onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                />
              </div>

              <div>
                <Label>Exam Time</Label>
                <Input
                  type="time"
                  value={formData.exam_time}
                  onChange={(e) => setFormData({ ...formData, exam_time: e.target.value })}
                />
              </div>

              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                />
              </div>

              <div>
                <Label>Total Marks</Label>
                <Input
                  type="number"
                  value={formData.total_marks}
                  onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })}
                />
              </div>

              <div>
                <Label>Venue</Label>
                <Input
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="e.g., Classroom A"
                />
              </div>

              <Button type="submit" className="w-full bg-purple-600">
                {editingExam ? "Update" : "Create"} Exam
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Exams List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Exam Title</th>
                  <th className="text-left py-3 px-4 font-semibold">Subject</th>
                  <th className="text-left py-3 px-4 font-semibold">Class</th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Time</th>
                  <th className="text-left py-3 px-4 font-semibold">Venue</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{exam.title}</td>
                    <td className="py-3 px-4">{exam.subject_name}</td>
                    <td className="py-3 px-4">{exam.class_name}</td>
                    <td className="py-3 px-4">{new Date(exam.exam_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{exam.exam_time}</td>
                    <td className="py-3 px-4">{exam.venue}</td>
                    <td className="py-3 px-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(exam)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(exam.id)}
                      >
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
