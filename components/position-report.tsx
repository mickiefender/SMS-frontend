"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { academicsAPI, usersAPI } from "@/lib/api"
import { Award, Trophy, Medal, Star, TrendingUp, Users } from "lucide-react"

export function PositionReport() {
  const [reports, setReports] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSession, setFilterSession] = useState("")
  const [filterClass, setFilterClass] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [reportsRes, sessionsRes, classesRes, studentsRes] = await Promise.all([
        academicsAPI.terminalReports(),
        academicsAPI.academicSessions(),
        academicsAPI.classes(),
        usersAPI.students(),
      ])

      setReports(reportsRes.data.results || reportsRes.data || [])
      setSessions(sessionsRes.data.results || sessionsRes.data || [])
      setClasses(classesRes.data.results || classesRes.data || [])
      setStudents(studentsRes.data.results || studentsRes.data || [])
      
      // Set default filters
      if (sessionsRes.data.results?.length > 0) {
        const currentSession = sessionsRes.data.results.find((s: any) => s.is_current)
        if (currentSession) {
          setFilterSession(currentSession.id.toString())
        }
      }
    } catch (error) {
      console.error("[v0] Failed to fetch position report data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCalculatePositions = async () => {
    if (!filterClass || !filterSession) {
      alert("Please select both class and session")
      return
    }

    try {
      await academicsAPI.calculatePositions({
        class_id: parseInt(filterClass),
        session_id: parseInt(filterSession),
      })
      alert("Positions calculated successfully!")
      await fetchData()
    } catch (error) {
      console.error("[v0] Failed to calculate positions:", error)
      alert("Failed to calculate positions")
    }
  }

  const getStudentName = (id: number) => {
    const student = students.find((s) => (s.user?.id || s.id) === id)
    return student?.user?.first_name ? `${student.user.first_name} ${student.user.last_name}` : `Student ${id}`
  }

  const filteredReports = reports
    .filter((r) => {
      if (filterSession && r.academic_session !== parseInt(filterSession)) return false
      if (filterClass && r.class_obj !== parseInt(filterClass)) return false
      return true
    })
    .sort((a, b) => (a.position || 999) - (b.position || 999))

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

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <Star className="w-5 h-5 text-blue-400" />
    }
  }

  const getPositionBadge = (position: number, total: number) => {
    const percentage = (position / total) * 100
    let color = "bg-gray-100 text-gray-800"
    
    if (position === 1) color = "bg-yellow-100 text-yellow-800 border-2 border-yellow-400"
    else if (position === 2) color = "bg-gray-100 text-gray-800 border-2 border-gray-300"
    else if (position === 3) color = "bg-amber-100 text-amber-800 border-2 border-amber-400"
    else if (percentage <= 25) color = "bg-green-100 text-green-800"
    else if (percentage <= 50) color = "bg-blue-100 text-blue-800"
    
    return (
      <span className={`px-3 py-1 rounded-full font-bold ${color}`}>
        {position}
      </span>
    )
  }

  if (loading) {
    return <div className="text-center py-4">Loading position report...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Position Report
          </h2>
          <p className="text-gray-500">View student rankings and performance</p>
        </div>
        <Button onClick={handleCalculatePositions} disabled={!filterClass || !filterSession}>
          <Award className="w-4 h-4 mr-2" />
          Calculate Positions
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Academic Session</Label>
              <Select value={filterSession || "none"} onValueChange={(v) => setFilterSession(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select Session</SelectItem>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name} {s.is_current && "(Current)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Class</Label>
              <Select value={filterClass || "none"} onValueChange={(v) => setFilterClass(v === "none" ? "" : v)}>
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
          </div>
        </CardContent>
      </Card>

      {/* Top 3 Students */}
      {filteredReports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredReports.slice(0, 3).map((report, index) => (
            <Card key={report.id} className={`${index === 0 ? 'border-yellow-400 border-2' : ''}`}>
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-4">
                  {getPositionIcon(index + 1)}
                </div>
                <h3 className="text-xl font-bold">{getStudentName(report.student)}</h3>
                <p className="text-gray-500">{report.class_name}</p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Average</span>
                    <span className="font-semibold">{report.average_marks?.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Grade</span>
                    <span className={`px-2 py-1 rounded text-sm font-bold ${getGradeColor(report.grade)}`}>
                      {report.grade}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Full Ranking Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Class Ranking
          </CardTitle>
          <CardDescription>
            {filteredReports.length} students ranked
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              No position data available. Please select a class and session, then click "Calculate Positions"
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Position</th>
                    <th className="text-left py-3 px-4">Student</th>
                    <th className="text-left py-3 px-4">Total Marks</th>
                    <th className="text-left py-3 px-4">Average</th>
                    <th className="text-left py-3 px-4">Grade</th>
                    <th className="text-left py-3 px-4">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr 
                      key={report.id} 
                      className={`border-b hover:bg-muted/50 ${report.position === 1 ? 'bg-yellow-50' : ''}`}
                    >
                      <td className="py-3 px-4">
                        {getPositionBadge(report.position || 0, report.total_students || 0)}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {getStudentName(report.student)}
                      </td>
                      <td className="py-3 px-4">{report.total_marks?.toFixed(1)}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold">{report.average_marks?.toFixed(1)}%</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getGradeColor(report.grade)}`}>
                          {report.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {report.attendance_percentage?.toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Detail Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Performance Details</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    {getPositionIcon(selectedStudent.position || 0)}
                  </div>
                  <h3 className="text-xl font-bold">{getStudentName(selectedStudent.student)}</h3>
                  <p className="text-gray-500">{selectedStudent.class_name} - {selectedStudent.session_name}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Position</p>
                  <p className="text-2xl font-bold">{selectedStudent.position} / {selectedStudent.total_students}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Grade</p>
                  <p className={`text-2xl font-bold px-4 py-1 rounded inline-block ${getGradeColor(selectedStudent.grade)}`}>
                    {selectedStudent.grade}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Total Marks</p>
                  <p className="text-xl font-semibold">{selectedStudent.total_marks?.toFixed(1)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Average</p>
                  <p className="text-xl font-semibold">{selectedStudent.average_marks?.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

