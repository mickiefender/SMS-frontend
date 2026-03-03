"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { academicsAPI, authAPI, assignmentAPI, billingAPI, gradesAPI, attendanceAPI, usersAPI } from "@/lib/api"
import { BookOpen, DollarSign, Calendar, FileText, Edit2, Download, Share2, ClipboardList, UserCheck } from "lucide-react"
import Image from "next/image"
import Loader from '@/components/loader'
import { NoticeBoard } from "@/components/notice-board"
import AssignmentSubmissionModal from "@/components/AssignmentSubmissionModal"
import React from "react"

interface DashboardData {
  upcomingExams: any[]
  dueFees: number
  events: any[]
  documents: any[]
  userProfile: any
  examResults: any[]
  schoolFees: any[]
  assignments: any[]
  grades: any[]
}

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [profilePic, setProfilePic] = useState<string>("")
  const [studentProfile, setStudentProfile] = useState<any>(null)
  const [studentClass, setStudentClass] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [user, exams, fees, events, documents, results, assignmentsRes, gradesRes] = await Promise.all([
          authAPI.me(),
          academicsAPI.exams(),
          billingAPI.myFees(),
          academicsAPI.events(),
          academicsAPI.documents(),
          academicsAPI.examResults(),
          assignmentAPI.list(),
          gradesAPI.list(),
        ])

        // Get upcoming exams
        const upcomingExams = (exams.data.results || exams.data || []).filter((exam: any) => new Date(exam.exam_date) > new Date())

        // Calculate due fees
        const allFees = fees.data.results || fees.data || []
        const dueFees = allFees
          .filter((fee: any) => !fee.paid)
          .reduce((sum: number, fee: any) => sum + (parseFloat(fee.amount) || 0), 0)

        const allEvents = events.data.results || events.data || []
        const allDocuments = documents.data.results || documents.data || []
        const allResults = (results.data.results || results.data || []).slice(0, 6)
        const allAssignments = assignmentsRes.data.results || assignmentsRes.data || []
        const allGrades = gradesRes.data.results || gradesRes.data || []
        
        setAssignments(allAssignments)
        setGrades(allGrades)

        setData({
          upcomingExams,
          dueFees,
          events: allEvents,
          documents: allDocuments,
          userProfile: user.data,
          examResults: allResults,
          schoolFees: allFees,
          assignments: allAssignments,
          grades: allGrades,
        })
      
        // Fetch profile picture
        try {
          const picRes = await academicsAPI.profilePictures()
          if (picRes.data.results?.length > 0) {
            setProfilePic(picRes.data.results[0].display_url || picRes.data.results[0].storage_url || picRes.data.results[0].picture || "")
          }
        } catch (err) {
          console.log("No profile picture yet")
        }

        // Fetch full student profile data
        try {
          const studentsRes = await usersAPI.students()
          const allStudents = studentsRes.data.results || studentsRes.data || []
          const userId = user.data.id
          const myProfile = allStudents.find((s: any) => 
            s.user === userId || s.user?.id === userId || s.user_data?.id === userId || s.id === userId
          )
          if (myProfile) {
            setStudentProfile(myProfile)
          }
        } catch (err) {
          console.log("Could not fetch student profile details")
        }

        // Fetch student class enrollment
        try {
          const classesRes = await academicsAPI.studentClasses()
          const allEnrollments = classesRes.data.results || classesRes.data || []
          const userId = user.data.id
          const myClass = allEnrollments.find((e: any) => 
            e.student === userId || e.student?.id === userId || e.student_data?.id === userId
          )
          if (myClass) {
            setStudentClass(myClass)
          }
        } catch (err) {
          console.log("Could not fetch class enrollment data")
        }

        // Fetch attendance data
        try {
          const userId = user.data.id
          if (userId) {
            console.log("Fetching attendance for user:", userId)
            const attendanceRes = await attendanceAPI.studentReport(userId)
            console.log("Attendance response:", attendanceRes.data)
            setAttendance(attendanceRes.data)
          }
        } catch (err: any) {
          console.log("No attendance data yet or error:", err?.response?.data || err.message)
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Get unique subjects from grades for filtering
  const subjectGrades = grades.reduce((acc: any, grade: any) => {
    const subject = grade.subject_name || grade.subject
    if (!acc[subject]) {
      acc[subject] = []
    }
    acc[subject].push(grade)
    return acc
  }, {})

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

  // Calculate GPA from grades
  const calculateGPA = () => {
    if (grades.length === 0) return "0.0"
    const totalPercentage = grades.reduce((sum: number, g: any) => sum + (g.percentage || 0), 0)
    const avgPercentage = totalPercentage / grades.length
    return ((avgPercentage / 100) * 4.0).toFixed(2)
  }

  const handleOpenModal = (assignment: any) => {
    setSelectedAssignment(assignment)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setSelectedAssignment(null)
    setIsModalOpen(false)
  }

  const cards: { title: string; count: string | number; icon: React.ElementType; bgColor: string }[] = [
    {
      title: "Upcoming Exams",
      count: data?.upcomingExams?.length || 0,
      icon: BookOpen,
      bgColor: "bg-green-500",
    },
    {
      title: "Due Fees",
      count: `${(data?.dueFees || 0).toFixed(2)}`,
      icon: DollarSign,
      bgColor: "bg-red-500",
    },
    {
      title: "Attendance",
      count: `${attendance?.presence_percentage?.toFixed(1) || 0}%`,
      icon: UserCheck,
      bgColor: "bg-blue-500",
    },
    {
      title: "Assignments",
      count: assignments.length,
      icon: ClipboardList,
      bgColor: "bg-purple-500",
    },
    {
      title: "Documents",
      count: data?.documents?.length || 0,
      icon: FileText,
      bgColor: "bg-yellow-500",
    },
  ]

  return (
    <div className="p-6 bg-gray-50">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Welcome to Akkhor School Management System</h1>
        <p className="text-gray-600">Student Dashboard</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((card, index) => {
          const Icon = card.icon
          return (
            <div key={index} className={`${card.bgColor} text-white p-6 rounded-lg shadow-lg`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">{card.title}</p>
                  <p className="text-3xl font-bold mt-2">{card.count}</p>
                </div>
                <Icon className="w-12 h-12 opacity-50" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Information Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Information</CardTitle>
                <CardDescription>Your personal and academic details</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Picture */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-32 h-32 bg-cyan-400 rounded-lg flex items-center justify-center overflow-hidden">
                    {profilePic ? (
                      <Image src={profilePic || "/placeholder.svg"} alt="Profile" width={128} height={128} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-white">
                        <p className="text-sm">No Picture</p>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{data?.userProfile?.first_name} {data?.userProfile?.last_name}</p>
                    <p className="text-xs text-gray-500">ID: {studentProfile?.student_id || data?.userProfile?.student_id || data?.userProfile?.username || "-"}</p>
                  </div>
                </div>

                {/* Student Information */}
                <div className="md:col-span-2 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm">Name :</p>
                      <p className="font-semibold">{data?.userProfile?.first_name} {data?.userProfile?.last_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Gender :</p>
                      <p className="font-semibold">{studentProfile?.gender || data?.userProfile?.gender || "-"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Father Name :</p>
                      <p className="font-semibold">{studentProfile?.father_name || data?.userProfile?.father_name || "-"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Mother Name :</p>
                      <p className="font-semibold">{studentProfile?.mother_name || data?.userProfile?.mother_name || "-"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Date Of Birth :</p>
                      <p className="font-semibold">
                        {studentProfile?.date_of_birth || data?.userProfile?.date_of_birth
                          ? new Date(studentProfile?.date_of_birth || data?.userProfile?.date_of_birth).toLocaleDateString()
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Religion :</p>
                      <p className="font-semibold">{studentProfile?.religion || data?.userProfile?.religion || "-"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">E-mail :</p>
                      <p className="font-semibold text-sm">{data?.userProfile?.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Class :</p>
                      <p className="font-semibold">{studentClass?.class_name || studentClass?.class_obj_name || studentProfile?.class_name || "-"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Roll :</p>
                      <p className="font-semibold">{studentClass?.roll_number || studentProfile?.roll_number || studentProfile?.student_id || "-"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Section :</p>
                      <p className="font-semibold">{studentClass?.section || studentProfile?.section || "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500 text-sm">Address :</p>
                      <p className="font-semibold">{studentProfile?.address || data?.userProfile?.address || "-"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Phone :</p>
                      <p className="font-semibold">{data?.userProfile?.phone || studentProfile?.phone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Student ID :</p>
                      <p className="font-semibold">{studentProfile?.student_id || data?.userProfile?.student_id || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notice Board */}
        <NoticeBoard />
      </div>

      {/* My Attendance Section */}
      {attendance && attendance.total_days > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-500" />
                  My Attendance
                </CardTitle>
                <CardDescription>Your attendance record and statistics</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Presence</p>
                <p className={`text-2xl font-bold ${(attendance.presence_percentage || 0) >= 75 ? 'text-green-600' : (attendance.presence_percentage || 0) >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {(attendance.presence_percentage || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Circular Progress and Stats */}
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Circular Progress */}
                <div className="relative w-32 h-32 flex-shrink-0">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="none"
                      strokeDasharray={351.86}
                      strokeDashoffset={351.86 - (351.86 * (attendance.presence_percentage || 0)) / 100}
                      className={`${(attendance.presence_percentage || 0) >= 75 ? 'text-green-500' : (attendance.presence_percentage || 0) >= 50 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-1000`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-bold ${(attendance.presence_percentage || 0) >= 75 ? 'text-green-600' : (attendance.presence_percentage || 0) >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {(attendance.presence_percentage || 0).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-700">{attendance.total_days || 0}</p>
                    <p className="text-xs text-blue-600">Total Days</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-700">{attendance.present_days || 0}</p>
                    <p className="text-xs text-green-600">Present</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-red-700">{attendance.absent_days || 0}</p>
                    <p className="text-xs text-red-600">Absent</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-700">{attendance.late_days || 0}</p>
                    <p className="text-xs text-yellow-600">Late</p>
                  </div>
                </div>
              </div>

              {/* Recent Attendance Records */}
              {attendance.records && attendance.records.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Attendance Records</h3>
                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Date</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Subject</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Class</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Teacher</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {attendance.records.slice(0, 10).map((record: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2">{record.date}</td>
                            <td className="px-3 py-2">{record.subject_name || 'N/A'}</td>
                            <td className="px-3 py-2">{record.class_name || 'N/A'}</td>
                            <td className="px-3 py-2">{record.teacher_name || 'N/A'}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                ${record.status === 'present' ? 'bg-green-100 text-green-800' : 
                                  record.status === 'absent' ? 'bg-red-100 text-red-800' : 
                                  record.status === 'late' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-gray-100 text-gray-800'}`}>
                                {record.status?.charAt(0).toUpperCase() + record.status?.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Assignments Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>My Assignments</CardTitle>
          <CardDescription>All your assignments are listed here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="border p-4 rounded-lg flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{assignment.title}</h3>
                  <p className="text-sm text-gray-500">
                    {assignment.subject_name} - Due: {new Date(assignment.due_date).toLocaleDateString()}
                  </p>
                </div>
                <Button onClick={() => handleOpenModal(assignment)}>Submit</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* My Grades Section */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>My Grades</CardTitle>
              <CardDescription>All your grades and performance</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">GPA</p>
              <p className="text-2xl font-bold text-blue-600">{calculateGPA()}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {grades.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No grades found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Subject</th>
                    <th className="text-left py-3 px-4 font-semibold">Assessment Type</th>
                    <th className="text-left py-3 px-4 font-semibold">Score</th>
                    <th className="text-left py-3 px-4 font-semibold">Percentage</th>
                    <th className="text-left py-3 px-4 font-semibold">Grade</th>
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((grade: any, index: number) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{grade.subject_name || grade.subject}</td>
                      <td className="py-3 px-4 capitalize">{grade.assessment_type}</td>
                      <td className="py-3 px-4">{grade.score}/{grade.max_score}</td>
                      <td className="py-3 px-4">{grade.percentage?.toFixed(1) || 0}%</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded ${getGradeColor(grade.grade)}`}>
                          {grade.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4">{new Date(grade.recorded_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      

      {/* My Fees Section */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-red-500" />
                My Fees & Expenses
              </CardTitle>
              <CardDescription>Your fee status and payment history</CardDescription>
            </div>
            <Button className="bg-blue-600">Download Statement</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Fee Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-gray-600">Total Due</p>
                <p className="text-2xl font-bold text-red-600">
                  $
                  {(
                    (data?.schoolFees || [])
                      .filter((f: any) => !f.paid)
                      .reduce((sum: number, f: any) => sum + (parseFloat(f.amount) || 0), 0)
                  ).toFixed(2)}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  $
                  {(
                    (data?.schoolFees || [])
                      .filter((f: any) => f.paid)
                      .reduce((sum: number, f: any) => sum + (parseFloat(f.amount) || 0), 0)
                  ).toFixed(2)}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600">Total Charged</p>
                <p className="text-2xl font-bold text-blue-600">
                  $
                  {(
                    (data?.schoolFees || [])
                      .reduce((sum: number, f: any) => sum + (parseFloat(f.amount) || 0), 0)
                  ).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Fees Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold">Fee Type</th>
                    <th className="text-left py-3 px-4 font-semibold">Amount Due</th>
                    <th className="text-left py-3 px-4 font-semibold">Amount Paid</th>
                    <th className="text-left py-3 px-4 font-semibold">Balance</th>
                    <th className="text-left py-3 px-4 font-semibold">Due Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.schoolFees && data.schoolFees.length > 0 ? (
                    data.schoolFees.map((fee: any, index: number) => {
                      const feeAmount = parseFloat(fee.amount) || 0
                      const amountPaid = fee.paid ? feeAmount : 0
                      const balance = feeAmount - amountPaid
                      const feeStatus = fee.paid ? "paid" : "pending"
                      const statusColor = fee.paid
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"

                      return (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{fee.fee_name}</td>
                          <td className="py-3 px-4">${feeAmount.toFixed(2)}</td>
                          <td className="py-3 px-4 text-green-600 font-medium">${amountPaid.toFixed(2)}</td>
                          <td className="py-3 px-4 font-medium">${balance.toFixed(2)}</td>
                          <td className="py-3 px-4">{new Date(fee.due_date).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                              {feeStatus.charAt(0).toUpperCase() + feeStatus.slice(1)}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        No fees found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Payment Methods Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900">Need to Pay?</p>
              <p className="text-sm text-blue-800 mt-1">
                Contact your school admin or visit the payment portal to pay your outstanding fees online.
              </p>
              <Button className="mt-3 bg-blue-600 hover:bg-blue-700">Go to Payment Portal</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedAssignment && (
        <AssignmentSubmissionModal
          assignment={selectedAssignment}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
