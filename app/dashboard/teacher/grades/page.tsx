"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { usersAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Plus } from "lucide-react"

function GradesContent() {
  const [grades, setGrades] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    student: "",
    score: "",
    assessment_type: "exam",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [gradesRes, studentsRes] = await Promise.all([
          fetch("/api/academics/grades/").then((r) => r.json()),
          usersAPI.students(),
        ])

        setGrades(gradesRes.results || gradesRes || [])
        const studentData = studentsRes.data.results || studentsRes.data || []
        setStudents(Array.isArray(studentData) ? studentData : [])
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch("/api/academics/grades/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student: Number.parseInt(formData.student),
          score: Number.parseFloat(formData.score),
          assessment_type: formData.assessment_type,
        }),
      })
      setIsOpen(false)
      setFormData({ student: "", score: "", assessment_type: "exam" })
    } catch (error) {
      console.error("Failed to add grade:", error)
    }
  }

  const filteredGrades = grades.filter((g) => (g.student_name || "").toLowerCase().includes(searchTerm.toLowerCase()))

  if (loading) return <div className="text-center py-8">Loading grades...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-red-600 mb-2">Grades Management</h1>
          <p className="text-gray-600">Record and manage student grades</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 gap-2">
              <Plus size={20} /> Add Grade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Student Grade</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Student</Label>
                <select
                  value={formData.student}
                  onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                >
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Score</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Assessment Type</Label>
                <select
                  value={formData.assessment_type}
                  onChange={(e) => setFormData({ ...formData, assessment_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="exam">Exam</option>
                  <option value="test">Test</option>
                  <option value="assignment">Assignment</option>
                </select>
              </div>
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                Add Grade
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <Input
            placeholder="Search grades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.map((g) => (
                <tr key={g.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3">{g.student_name || "N/A"}</td>
                  <td className="px-6 py-3 font-semibold">{g.score}</td>
                  <td className="px-6 py-3">{g.letter_grade || "N/A"}</td>
                  <td className="px-6 py-3 text-gray-600">{g.assessment_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function GradesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GradesContent />
    </Suspense>
  )
}
