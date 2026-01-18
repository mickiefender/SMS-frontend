"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, Trash2, Edit2, Search } from "lucide-react"

interface Grade {
  id: number
  student_id?: number
  student_name?: string
  subject_id?: number
  subject_name?: string
  assessment_type: string
  marks_obtained: number
  total_marks: number
  percentage?: number
  grade_letter?: string
  created_at?: string
}

export default function GradingPage() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isOpen, setIsOpen] = useState(false)
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null)
  const [formData, setFormData] = useState({
    student_id: "",
    subject_id: "",
    assessment_type: "exam",
    marks_obtained: "",
    total_marks: "100",
  })

  const itemsPerPage = 10
  const assessmentTypes = ["exam", "class_test", "quiz", "assignment", "continuous_assessment"]

  const fetchGrades = async () => {
    try {
      setLoading(true)
      // Mock data - replace with actual API call
      setGrades([])
    } catch (err) {
      console.error("Failed to load grades")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGrades()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Calculate percentage and grade
      const percentage = (Number(formData.marks_obtained) / Number(formData.total_marks)) * 100
      let gradeLetters = "F"
      if (percentage >= 90) gradeLetters = "A"
      else if (percentage >= 80) gradeLetters = "B"
      else if (percentage >= 70) gradeLetters = "C"
      else if (percentage >= 60) gradeLetters = "D"

      const newGrade: Grade = {
        id: editingGrade?.id || Date.now(),
        ...formData,
        marks_obtained: Number(formData.marks_obtained),
        total_marks: Number(formData.total_marks),
        percentage,
        grade_letter: gradeLetters,
      }

      if (editingGrade) {
        setGrades(grades.map((g) => (g.id === editingGrade.id ? newGrade : g)))
      } else {
        setGrades([...grades, newGrade])
      }

      setIsOpen(false)
      setEditingGrade(null)
      setFormData({ student_id: "", subject_id: "", assessment_type: "exam", marks_obtained: "", total_marks: "100" })
    } catch (err) {
      console.error("Failed to save grade")
    }
  }

  const handleEdit = (grade: Grade) => {
    setEditingGrade(grade)
    setFormData({
      student_id: grade.student_id?.toString() || "",
      subject_id: grade.subject_id?.toString() || "",
      assessment_type: grade.assessment_type,
      marks_obtained: grade.marks_obtained.toString(),
      total_marks: grade.total_marks.toString(),
    })
    setIsOpen(true)
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure?")) {
      setGrades(grades.filter((g) => g.id !== id))
    }
  }

  const filteredGrades = grades.filter(
    (g) =>
      (g.student_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.subject_name || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredGrades.length / itemsPerPage)
  const paginatedGrades = filteredGrades.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-purple-700">Grading System</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">+ Add Grade</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGrade ? "Edit Grade" : "Add Grade"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Student ID</Label>
                <Input
                  type="number"
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Subject ID</Label>
                <Input
                  type="number"
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Assessment Type</Label>
                <select
                  value={formData.assessment_type}
                  onChange={(e) => setFormData({ ...formData, assessment_type: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                >
                  {assessmentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replace("_", " ").toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Marks Obtained</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.marks_obtained}
                    onChange={(e) => setFormData({ ...formData, marks_obtained: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Total Marks</Label>
                  <Input
                    type="number"
                    value={formData.total_marks}
                    onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-purple-600">
                {editingGrade ? "Update" : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <Input
          placeholder="Search by student or subject..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Marks</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Percentage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Grade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedGrades.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No grades added yet
                </td>
              </tr>
            ) : (
              paginatedGrades.map((grade) => (
                <tr key={grade.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium">{grade.student_name || "N/A"}</td>
                  <td className="px-6 py-3">{grade.subject_name || "N/A"}</td>
                  <td className="px-6 py-3">{grade.assessment_type}</td>
                  <td className="px-6 py-3">
                    {grade.marks_obtained}/{grade.total_marks}
                  </td>
                  <td className="px-6 py-3">{(grade.percentage || 0).toFixed(2)}%</td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded text-white text-sm font-semibold ${
                        grade.grade_letter === "A"
                          ? "bg-green-500"
                          : grade.grade_letter === "B"
                            ? "bg-blue-500"
                            : grade.grade_letter === "C"
                              ? "bg-yellow-500"
                              : grade.grade_letter === "D"
                                ? "bg-orange-500"
                                : "bg-red-500"
                      }`}
                    >
                      {grade.grade_letter}
                    </span>
                  </td>
                  <td className="px-6 py-3 flex gap-2">
                    <button onClick={() => handleEdit(grade)} className="text-blue-600">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(grade.id)} className="text-red-600">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
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
