"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { academicsAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Edit2, Plus } from "lucide-react"

interface ExamResult {
  id: number
  student_name: string
  exam_details: { title: string; total_marks: number; subject_name: string }
  marks_obtained: number
  percentage: number
  grade: string
  recorded_date: string
}

export default function RecordExamResultsPage() {
  const [results, setResults] = useState<ExamResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [editingResult, setEditingResult] = useState<ExamResult | null>(null)
  const [exams, setExams] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [formData, setFormData] = useState({
    exam: "",
    student: "",
    marks_obtained: "",
    remarks: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resultsRes, examsRes, enrollmentsRes] = await Promise.all([
        academicsAPI.examResults(),
        academicsAPI.exams(),
        academicsAPI.enrollments(),
      ])

      setResults(resultsRes.data.results || resultsRes.data || [])
      setExams(examsRes.data.results || examsRes.data || [])
      
      // Get unique students from enrollments
      const enrollments = enrollmentsRes.data.results || enrollmentsRes.data || []
      const uniqueStudents = [...new Map(enrollments.map((e: any) => [e.student, e])).values()]
      setStudents(uniqueStudents)
      
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
      if (!formData.exam || !formData.student || !formData.marks_obtained) {
        setError("Please fill in all required fields")
        return
      }

      const selectedExam = exams.find((e) => e.id === Number.parseInt(formData.exam))
      if (!selectedExam) {
        setError("Invalid exam selected")
        return
      }

      const data = {
        exam: Number.parseInt(formData.exam),
        student: Number.parseInt(formData.student),
        marks_obtained: parseFloat(formData.marks_obtained),
        remarks: formData.remarks,
      }

      if (editingResult) {
        await academicsAPI.updateExamResult(editingResult.id, data)
      } else {
        await academicsAPI.createExamResult(data)
      }

      setIsOpen(false)
      setEditingResult(null)
      setFormData({ exam: "", student: "", marks_obtained: "", remarks: "" })
      setError(null)
      fetchData()
    } catch (err: any) {
      console.error("Error:", err?.response?.data)
      setError(err?.response?.data?.detail || "Failed to save result")
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this result?")) {
      try {
        await academicsAPI.deleteExamResult(id)
        fetchData()
      } catch (err) {
        setError("Failed to delete result")
      }
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Record Exam Results</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingResult(null)
                setFormData({ exam: "", student: "", marks_obtained: "", remarks: "" })
              }}
              className="bg-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Record Result
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingResult ? "Edit Result" : "Record Exam Result"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}

              <div>
                <Label>Exam *</Label>
                <select
                  value={formData.exam}
                  onChange={(e) => setFormData({ ...formData, exam: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Exam</option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title} - {exam.subject_name} ({exam.total_marks} marks)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Student *</Label>
                <select
                  value={formData.student}
                  onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Student</option>
                  {students.map((s) => (
                    <option key={s.student} value={s.student}>
                      {s.student_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Marks Obtained *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.marks_obtained}
                  onChange={(e) => setFormData({ ...formData, marks_obtained: e.target.value })}
                  placeholder="e.g., 85.5"
                />
              </div>

              <div>
                <Label>Remarks</Label>
                <Input
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Optional remarks..."
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600">
                {editingResult ? "Update" : "Record"} Result
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Exam Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Student</th>
                  <th className="text-left py-3 px-4 font-semibold">Exam</th>
                  <th className="text-left py-3 px-4 font-semibold">Subject</th>
                  <th className="text-left py-3 px-4 font-semibold">Marks</th>
                  <th className="text-left py-3 px-4 font-semibold">Percentage</th>
                  <th className="text-left py-3 px-4 font-semibold">Grade</th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{result.student_name}</td>
                    <td className="py-3 px-4">{result.exam_details?.title}</td>
                    <td className="py-3 px-4">{result.exam_details?.subject_name}</td>
                    <td className="py-3 px-4">
                      {result.marks_obtained} / {result.exam_details?.total_marks}
                    </td>
                    <td className="py-3 px-4">{result.percentage?.toFixed(1)}%</td>
                    <td className="py-3 px-4">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{result.grade}</span>
                    </td>
                    <td className="py-3 px-4">{new Date(result.recorded_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingResult(result)
                          setFormData({
                            exam: result.exam_details?.title || "",
                            student: result.student_name,
                            marks_obtained: result.marks_obtained.toString(),
                            remarks: "",
                          })
                          setIsOpen(true)
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(result.id)}>
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
