"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { academicsAPI, usersAPI } from "@/lib/api"
import { Award, Users, BookOpen, Calendar, CheckCircle, FileText, Download, Eye } from "lucide-react"

interface TerminalReportProps {
  studentId?: number
}

export function TerminalReport({ studentId }: TerminalReportProps) {
  const [reports, setReports] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [filterSession, setFilterSession] = useState("")
  const [filterClass, setFilterClass] = useState("")
  
  // Generate form state
  const [generateForm, setGenerateForm] = useState({
    student_id: studentId?.toString() || "",
    class_id: "",
    session_id: "",
  })

  // Fetch students when class changes in generate form
  useEffect(() => {
    if (generateForm.class_id) {
      fetchStudentsForClass(generateForm.class_id)
    }
  }, [generateForm.class_id])

  const fetchStudentsForClass = async (classId: string) => {
    try {
      const res = await usersAPI.students({ class_id: parseInt(classId) })
      const classStudents = res.data.results || res.data || []
      // Update students list with filtered students
      setStudents(prev => {
        // Keep students from other sources but prioritize class students
        const otherStudents = prev.filter(s => !s.class_id)
        return [...classStudents, ...otherStudents]
      })
    } catch (error) {
      console.error("[v0] Failed to fetch students for class:", error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [reportsRes, sessionsRes, classesRes, studentsRes] = await Promise.all([
        studentId 
          ? academicsAPI.terminalReports({ student: studentId })
          : academicsAPI.terminalReports(),
        academicsAPI.academicSessions(),
        academicsAPI.classes(),
        usersAPI.students(),
      ])

      setReports(reportsRes.data.results || reportsRes.data || [])
      setSessions(sessionsRes.data.results || sessionsRes.data || [])
      setClasses(classesRes.data.results || classesRes.data || [])
      setStudents(studentsRes.data.results || studentsRes.data || [])
    } catch (error) {
      console.error("[v0] Failed to fetch terminal reports data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async () => {
    if (!generateForm.student_id || !generateForm.class_id || !generateForm.session_id) {
      alert("Please fill all required fields")
      return
    }

    try {
      setGenerating(true)
      const res = await academicsAPI.generateTerminalReport({
        student_id: parseInt(generateForm.student_id),
        class_id: parseInt(generateForm.class_id),
        session_id: parseInt(generateForm.session_id),
      })
      
      alert("Terminal report generated successfully!")
      setShowGenerateDialog(false)
      setGenerateForm({ student_id: studentId?.toString() || "", class_id: "", session_id: "" })
      await fetchData()
      
      // Show the generated report
      setSelectedReport(res.data)
    } catch (error: any) {
      console.error("[v0] Failed to generate terminal report:", error)
      alert(error?.response?.data?.error || "Failed to generate terminal report")
    } finally {
      setGenerating(false)
    }
  }

  const handleCalculatePositions = async (classId: number, sessionId: number) => {
    try {
      await academicsAPI.calculatePositions({
        class_id: classId,
        session_id: sessionId,
      })
      alert("Positions calculated successfully!")
      await fetchData()
    } catch (error) {
      console.error("[v0] Failed to calculate positions:", error)
      alert("Failed to calculate positions")
    }
  }

  const handlePublish = async (reportId: number) => {
    try {
      await academicsAPI.publishTerminalReport(reportId)
      alert("Report published successfully!")
      await fetchData()
    } catch (error) {
      console.error("[v0] Failed to publish report:", error)
      alert("Failed to publish report")
    }
  }

  const getStudentName = (id: number) => {
    const student = students.find((s) => (s.user?.id || s.id) === id)
    return student?.user?.first_name ? `${student.user.first_name} ${student.user.last_name}` : `Student ${id}`
  }

  // Get students filtered by selected class
  const getStudentsForClass = (classId: string) => {
    if (!classId) return students
    // Students in the class would need to be fetched from API or filtered locally
    // For now, return all students - the backend will handle validation
    return students
  }

  // Filter reports - handle type comparison properly
  const filteredReports = reports.filter((r) => {
    const reportSessionId = r.academic_session?.id || r.academic_session
    const reportClassId = r.class_obj?.id || r.class_obj
    
    if (filterSession && reportSessionId !== parseInt(filterSession)) return false
    if (filterClass && reportClassId !== parseInt(filterClass)) return false
    return true
  })

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A": return "bg-green-100 text-green-800"
      case "B": return "bg-blue-100 text-blue-800"
      case "C": return "bg-yellow-100 text-yellow-800"
      case "D": return "bg-orange-100 text-orange-800"
      case "F": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading terminal reports...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Terminal Reports</h2>
          <p className="text-gray-500">View and manage student terminal reports</p>
        </div>
        <Button onClick={() => setShowGenerateDialog(true)}>
          <FileText className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Academic Session</Label>
              <Select value={filterSession || "all"} onValueChange={(v) => setFilterSession(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sessions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Class</Label>
              <Select value={filterClass || "all"} onValueChange={(v) => setFilterClass(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>All generated terminal reports</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No terminal reports found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Student</th>
                    <th className="text-left py-2 px-2">Class</th>
                    <th className="text-left py-2 px-2">Session</th>
                    <th className="text-left py-2 px-2">Total Marks</th>
                    <th className="text-left py-2 px-2">Average</th>
                    <th className="text-left py-2 px-2">Position</th>
                    <th className="text-left py-2 px-2">Grade</th>
                    <th className="text-left py-2 px-2">Attendance</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 font-medium">{report.student_name}</td>
                      <td className="py-2 px-2">{report.class_name}</td>
                      <td className="py-2 px-2">{report.session_name}</td>
                      <td className="py-2 px-2">{report.total_marks?.toFixed(1)}</td>
                      <td className="py-2 px-2">{report.average_marks?.toFixed(1)}%</td>
                      <td className="py-2 px-2">
                        {report.position ? (
                          <span className="flex items-center gap-1">
                            <Award className="w-4 h-4 text-yellow-500" />
                            {report.position} / {report.total_students}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getGradeColor(report.grade)}`}>
                          {report.grade}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        {report.days_present}/{report.total_days} ({report.attendance_percentage?.toFixed(0)}%)
                      </td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          report.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => setSelectedReport(report)}>
                            <Eye className="w-3 h-3" />
                          </Button>
                          {report.status === 'draft' && (
                            <Button size="sm" variant="outline" onClick={() => handlePublish(report.id)}>
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Report Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Terminal Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!studentId && (
              <div>
                <Label>Student</Label>
            <Select 
                  value={generateForm.student_id || "none"} 
                  onValueChange={(v) => setGenerateForm({ ...generateForm, student_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Student" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select Student</SelectItem>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={(s.user?.id || s.id).toString()}>
                        {s.user?.first_name} {s.user?.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Class</Label>
            <Select 
                  value={generateForm.class_id || "none"} 
                  onValueChange={(v) => setGenerateForm({ ...generateForm, class_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select Class</SelectItem>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
            <div>
              <Label>Academic Session</Label>
            <Select 
                  value={generateForm.session_id || "none"} 
                  onValueChange={(v) => setGenerateForm({ ...generateForm, session_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Session" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select Session</SelectItem>
                    {sessions.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>Cancel</Button>
            <Button onClick={handleGenerateReport} disabled={generating}>
              {generating ? "Generating..." : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Terminal Report Details</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              {/* Student Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Student Name</p>
                  <p className="font-semibold">{selectedReport.student_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Class</p>
                  <p className="font-semibold">{selectedReport.class_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Session</p>
                  <p className="font-semibold">{selectedReport.session_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Position</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Award className="w-4 h-4 text-yellow-500" />
                    {selectedReport.position || "-"} / {selectedReport.total_students}
                  </p>
                </div>
              </div>

              {/* Subject Scores */}
              <div>
                <h4 className="font-semibold mb-2">Subject Scores</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Subject</th>
                        <th className="text-left py-2">Total Score</th>
                        <th className="text-left py-2">Percentage</th>
                        <th className="text-left py-2">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedReport.subject_scores || []).map((score: any) => (
                        <tr key={score.id} className="border-b">
                          <td className="py-2">{score.subject_name}</td>
                          <td className="py-2">{score.total_score?.toFixed(1)}</td>
                          <td className="py-2">{score.percentage?.toFixed(1)}%</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${getGradeColor(score.grade)}`}>
                              {score.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Total Marks</p>
                  <p className="text-xl font-bold">{selectedReport.total_marks?.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Average</p>
                  <p className="text-xl font-bold">{selectedReport.average_marks?.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Overall Grade</p>
                  <p className={`text-xl font-bold px-3 py-1 rounded inline-block ${getGradeColor(selectedReport.grade)}`}>
                    {selectedReport.grade}
                  </p>
                </div>
              </div>

              {/* Attendance */}
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Attendance</p>
                <p className="font-semibold">
                  {selectedReport.days_present} / {selectedReport.total_days} days ({selectedReport.attendance_percentage?.toFixed(1)}%)
                </p>
              </div>

              {/* Remarks */}
              {selectedReport.form_teacher_remarks && (
                <div>
                  <p className="text-sm text-gray-500">Form Teacher Remarks</p>
                  <p className="font-medium">{selectedReport.form_teacher_remarks}</p>
                </div>
              )}
              {selectedReport.principal_remarks && (
                <div>
                  <p className="text-sm text-gray-500">Principal Remarks</p>
                  <p className="font-medium">{selectedReport.principal_remarks}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

