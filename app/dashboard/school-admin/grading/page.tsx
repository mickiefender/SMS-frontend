"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, Trash2, Edit2, Search, Settings, Lock, Unlock } from "lucide-react"
import Loader from '@/components/loader'
import { GradingPolicyManagement } from "@/components/grading-policy-management"
import { gradesAPI, usersAPI, academicsAPI } from "@/lib/api"

interface Grade {
  id: number
  student: number
  subject: number
  student_name?: string
  subject_name?: string
  assessment_type: string
  score: number
  max_score: number
  percentage: number
  grade: string
  academic_session?: number
  is_locked: boolean
  locked_by?: string
  locked_at?: string
  recorded_date: string
}

export default function GradingPage() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isOpen, setIsOpen] = useState(false)
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null)
  const [activeTab, setActiveTab] = useState("grades")
  const [filterSession, setFilterSession] = useState("")
  const [formData, setFormData] = useState({
    student: "",
    subject: "",
    assessment_type: "exam",
    score: "",
    max_score: "100",
    academic_session: "",
  })

  const itemsPerPage = 10
  const assessmentTypes = [
    { value: "exam", label: "Exam" },
    { value: "test", label: "Test" },
    { value: "quiz", label: "Quiz" },
    { value: "assignment", label: "Assignment" },
    { value: "continuous", label: "Continuous Assessment" },
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [gradesRes, studentsRes, subjectsRes, sessionsRes] = await Promise.all([
        gradesAPI.list(),
        usersAPI.students(),
        academicsAPI.subjects(),
        academicsAPI.academicSessions(),
      ])

      setGrades(gradesRes.data.results || gradesRes.data || [])
      setStudents(studentsRes.data.results || studentsRes.data || [])
      setSubjects(subjectsRes.data.results || subjectsRes.data || [])
      
      const sessionsData = sessionsRes.data.results || sessionsRes.data || []
      setSessions(sessionsData)
      
      // Set default session to current
      const currentSession = sessionsData.find((s: any) => s.is_current)
      if (currentSession) {
        setFilterSession(currentSession.id.toString())
        setFormData(prev => ({ ...prev, academic_session: currentSession.id.toString() }))
      }
    } catch (err) {
      console.error("Failed to load data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const gradeData = {
        student: parseInt(formData.student),
        subject: parseInt(formData.subject),
        assessment_type: formData.assessment_type,
        score: parseFloat(formData.score),
        max_score: parseFloat(formData.max_score),
        academic_session: formData.academic_session ? parseInt(formData.academic_session) : null,
      }

      if (editingGrade) {
        await gradesAPI.update(editingGrade.id, gradeData)
      } else {
        await gradesAPI.create(gradeData)
      }

      setIsOpen(false)
      setEditingGrade(null)
      setFormData({
        student: "",
        subject: "",
        assessment_type: "exam",
        score: "",
        max_score: "100",
        academic_session: filterSession,
      })
      await fetchData()
    } catch (err: any) {
      console.error("Failed to save grade:", err)
      alert(err?.response?.data?.error || "Failed to save grade")
    }
  }

  const handleEdit = (grade: Grade) => {
    if (grade.is_locked) {
      alert("Cannot edit a locked grade. Please unlock first.")
      return
    }
    setEditingGrade(grade)
    setFormData({
      student: grade.student.toString(),
      subject: grade.subject.toString(),
      assessment_type: grade.assessment_type,
      score: grade.score.toString(),
      max_score: grade.max_score.toString(),
      academic_session: grade.academic_session?.toString() || "",
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this grade?")) return
    
    try {
      await gradesAPI.delete(id)
      await fetchData()
    } catch (err: any) {
      console.error("Failed to delete grade:", err)
      alert(err?.response?.data?.error || "Failed to delete grade")
    }
  }

  const handleLockGrade = async (id: number) => {
    try {
      await gradesAPI.update(id, { is_locked: true })
      await fetchData()
    } catch (err) {
      console.error("Failed to lock grade:", err)
      alert("Failed to lock grade")
    }
  }

  const handleUnlockGrade = async (id: number) => {
    try {
      await gradesAPI.update(id, { is_locked: false })
      await fetchData()
    } catch (err) {
      console.error("Failed to unlock grade:", err)
      alert("Failed to unlock grade")
    }
  }

  const filteredGrades = grades.filter((g) => {
    if (filterSession && g.academic_session?.toString() !== filterSession) return false
    if (searchTerm) {
      const studentName = g.student_name || `Student ${g.student}`
      const subjectName = g.subject_name || `Subject ${g.subject}`
      return studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             subjectName.toLowerCase().includes(searchTerm.toLowerCase())
    }
    return true
  })

  const totalPages = Math.ceil(filteredGrades.length / itemsPerPage)
  const paginatedGrades = filteredGrades.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const getStudentName = (id: number) => {
    const student = students.find((s) => (s.user?.id || s.id) === id)
    return student?.user?.first_name ? `${student.user.first_name} ${student.user.last_name}` : `Student ${id}`
  }

  const getSubjectName = (id: number) => {
    const subject = subjects.find((s) => s.id === id)
    return subject?.name || `Subject ${id}`
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A": return "bg-green-500"
      case "B": return "bg-blue-500"
      case "C": return "bg-yellow-500"
      case "D": return "bg-orange-500"
      case "F": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Loader size="md" color="#3b82f6" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-purple-700">Grading System</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="policy">
            <Settings className="w-4 h-4 mr-2" />
            Grading Policy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grades" className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Academic Session</Label>
              <Select value={filterSession} onValueChange={setFilterSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session: any) => (
                    <SelectItem key={session.id} value={session.id.toString()}>
                      {session.name} {session.is_current ? '(Current)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isOpen} onOpenChange={(open) => {
              setIsOpen(open)
              if (!open) {
                setEditingGrade(null)
                setFormData({
                  student: "",
                  subject: "",
                  assessment_type: "exam",
                  score: "",
                  max_score: "100",
                  academic_session: filterSession,
                })
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">+ Add Grade</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingGrade ? "Edit Grade" : "Add Grade"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Student</Label>
                    <Select 
                      value={formData.student} 
                      onValueChange={(v) => setFormData({ ...formData, student: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((s: any) => (
                          <SelectItem key={s.id} value={(s.user?.id || s.id).toString()}>
                            {s.user?.first_name} {s.user?.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <Select 
                      value={formData.subject} 
                      onValueChange={(v) => setFormData({ ...formData, subject: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s: any) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Assessment Type</Label>
                    <Select 
                      value={formData.assessment_type} 
                      onValueChange={(v) => setFormData({ ...formData, assessment_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {assessmentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Score</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={formData.score}
                        onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Max Score</Label>
                      <Input
                        type="number"
                        value={formData.max_score}
                        onChange={(e) => setFormData({ ...formData, max_score: e.target.value })}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">%</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedGrades.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No grades added yet
                    </td>
                  </tr>
                ) : (
                  paginatedGrades.map((grade) => (
                    <tr key={grade.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium">{getStudentName(grade.student)}</td>
                      <td className="px-6 py-3">{getSubjectName(grade.subject)}</td>
                      <td className="px-6 py-3 capitalize">{grade.assessment_type}</td>
                      <td className="px-6 py-3">{grade.score}/{grade.max_score}</td>
                      <td className="px-6 py-3">{grade.percentage.toFixed(2)}%</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded text-white text-sm font-semibold ${getGradeColor(grade.grade)}`}>
                          {grade.grade}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {grade.is_locked ? (
                          <span className="flex items-center gap-1 text-red-500 text-xs">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        ) : (
                          <span className="text-green-500 text-xs">Editable</span>
                        )}
                      </td>
                      <td className="px-6 py-3 flex gap-2">
                        {!grade.is_locked && (
                          <button onClick={() => handleEdit(grade)} className="text-blue-600">
                            <Edit2 size={18} />
                          </button>
                        )}
                        {grade.is_locked ? (
                          <button onClick={() => handleUnlockGrade(grade.id)} className="text-orange-600" title="Unlock">
                            <Unlock size={18} />
                          </button>
                        ) : (
                          <button onClick={() => handleLockGrade(grade.id)} className="text-green-600" title="Lock">
                            <Lock size={18} />
                          </button>
                        )}
                        {!grade.is_locked && (
                          <button onClick={() => handleDelete(grade.id)} className="text-red-600">
                            <Trash2 size={18} />
                          </button>
                        )}
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
        </TabsContent>

        <TabsContent value="policy">
          <GradingPolicyManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}

