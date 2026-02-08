'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { usersAPI, academicsAPI, attendanceAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Download, MessageSquare, Edit2, AlertCircle, BookOpen, DollarSign, Flag, FileText } from 'lucide-react'
import Link from 'next/link'

interface StudentDetail {
  id: number
  user_data?: {
    id: number
    first_name: string
    last_name: string
    email: string
    phone?: string
    username: string
  }
  user?: {
    id: number
    first_name: string
    last_name: string
    email: string
    phone?: string
    username: string
  }
  student_id?: string
  level?: { id: number; name: string, section?: string }
  department?: { id: number; name: string }
  enrollment_date?: string
  created_at?: string
  gender?: string
  father_name?: string
  mother_name?: string
  date_of_birth?: string
  religion?: string
  father_occupation?: string
  address?: string
  roll_number?: string
}

interface StudentProfile {
  name: string
  email: string
  phone?: string
  studentId?: string
  dateOfBirth?: string
  fatherName?: string
  motherName?: string
  guardianPhone?: string
  address?: string
  religion?: string
  admissionDate?: string
  class?: string
  section?: string
  roll?: number
  fatherOccupation?: string
}

interface ExamResult {
  id: number
  exam?: { id: number; name: string }
  exam_name?: string
  subject?: { id: number; name: string }
  subject_name?: string
  grade_point?: number
  percentage?: number
  marks?: number
  total_marks?: number
  date?: string
  created_at?: string
}

interface Notice {
  id: number
  title?: string
  content?: string
  author?: string
  created_at?: string
}

interface AttendanceSummary {
  total_days: number
  present_days: number
  absent_days: number
  late_days: number
  presence_percentage?: number
}

interface StatsCard {
  label: string
  value: string | number
  icon: typeof BookOpen
  color: string
}

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string

  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [examResults, setExamResults] = useState<ExamResult[]>([])
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null)
  const [notices, setNotices] = useState<Notice[]>([])
  const [dueFees, setDueFees] = useState<number>(0)
  const [upcomingExamsCount, setUpcomingExamsCount] = useState<number>(0)
  const [eventsCount, setEventsCount] = useState<number>(0)
  const [documentsCount, setDocumentsCount] = useState<number>(0)

  useEffect(() => {
    fetchStudentDetails()
  }, [studentId])

  const fetchStudentDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch student detail
      const studentRes = await usersAPI.getStudentById(parseInt(studentId))
      const studentData = studentRes.data
      setStudent(studentData)

      // Fetch exam results
      try {
        const examRes = await academicsAPI.examResults()
        const allResults = examRes.data.results || examRes.data || []
        const studentExams = allResults.filter((result: any) => result.student?.id === parseInt(studentId) || result.student === parseInt(studentId))
        setExamResults(studentExams.slice(0, 6))
      } catch (err) {
        console.log('[v0] Exam results fetch failed, continuing...')
      }

      // Fetch attendance
      try {
        const attendRes = await attendanceAPI.studentReport(parseInt(studentId))
        setAttendance(attendRes.data)
      } catch (err) {
        console.log('[v0] Attendance fetch failed, continuing...')
      }

      // Fetch fees and calculate due amount
      try {
        const feesRes = await academicsAPI.schoolFees();
        const allFees = feesRes.data.results || feesRes.data || [];
        const studentFees = allFees.filter((fee: any) => fee.student?.id === parseInt(studentId) || fee.student === parseInt(studentId));
        const totalDue = studentFees
          .filter((fee: any) => fee.status === 'pending' || fee.status === 'partial')
          .reduce((sum: number, fee: any) => sum + (parseFloat(fee.amount_due) || 0) - (parseFloat(fee.amount_paid) || 0), 0);
        setDueFees(totalDue);
      } catch (err) {
        console.log('[v0] Fees fetch failed, continuing...')
      }

      // Fetch upcoming exams count
      try {
        const examsRes = await academicsAPI.exams();
        const allExams = examsRes.data.results || examsRes.data || [];
        // TODO: This counts all upcoming exams in the school. 
        // A more accurate implementation would require an endpoint for student-specific exams 
        // or a way to filter exams based on the student's enrolled classes.
        const upcomingExams = allExams.filter((exam: any) => new Date(exam.exam_date) > new Date());
        setUpcomingExamsCount(upcomingExams.length);
      } catch (err) {
        console.log('[v0] Upcoming exams fetch failed, continuing...');
      }

      // Fetch events and documents counts
      try {
        const eventsRes = await academicsAPI.events();
        setEventsCount(eventsRes.data.results?.length || 0);
      } catch (err) {
        console.log('[v0] Events fetch failed, continuing...');
      }
      try {
        const documentsRes = await academicsAPI.documents();
        setDocumentsCount(documentsRes.data.results?.length || 0);
      } catch (err) {
        console.log('[v0] Documents fetch failed, continuing...');
      }

      // Fetch notices
      try {
        const noticesRes = await academicsAPI.notices();
        const allNotices = noticesRes.data.results || noticesRes.data || [];
        // TODO: Filter notices relevant to the student. For now, showing latest 5 school-wide.
        setNotices(allNotices.slice(0, 5));
      } catch (err) {
        console.log('[v0] Notices fetch failed, continuing...');
      }

    } catch (err: any) {
      console.error('[v0] Error fetching student details:', err)
      setError('Failed to load student details')
    } finally {
      setLoading(false)
    }
  }

  const getStudentName = (student: StudentDetail): string => {
    if (student.user_data) {
      return `${student.user_data.first_name || ''} ${student.user_data.last_name || ''}`.trim() || student.user_data.username
    }
    if (student.user) {
      return `${student.user.first_name || ''} ${student.user.last_name || ''}`.trim() || student.user.username
    }
    return 'Unknown Student'
  }

  const getStudentEmail = (student: StudentDetail): string => {
    return student.user_data?.email || student.user?.email || 'N/A'
  }

  const getStudentPhone = (student: StudentDetail): string => {
    return student.user_data?.phone || student.user?.phone || 'N/A'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading student details...</div>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 flex flex-col items-center gap-4">
          <AlertCircle size={48} />
          <p>{error || 'Student not found'}</p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const studentName = getStudentName(student)
  const studentEmail = getStudentEmail(student)
  const studentPhone = getStudentPhone(student)

  const stats: StatsCard[] = [
    {
      label: 'Upcoming Exam',
      value: upcomingExamsCount,
      icon: BookOpen,
      color: 'bg-green-500',
    },
    {
      label: 'Due Fees',
      value: `$${dueFees.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-red-500',
    },
    {
      label: 'Events',
      value: eventsCount,
      icon: Flag,
      color: 'bg-blue-500',
    },
    {
      label: 'Documents',
      value: documentsCount,
      icon: FileText,
      color: 'bg-yellow-500',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link href="/dashboard/school-admin" className="hover:text-gray-900">
          Home
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium">Student</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{studentName}</h1>
            <p className="text-gray-600">{studentEmail}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 bg-transparent">
            <Edit2 size={18} />
            Edit
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <MessageSquare size={18} />
            Message
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download size={18} />
            Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className={`${stat.color} rounded-lg p-6 text-white flex items-center gap-4 shadow-md`}>
              <Icon size={32} />
              <div>
                <p className="text-sm opacity-90">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Student Information */}
        <div className="col-span-1">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">My Information</h2>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">✓</button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
              </div>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-32 h-32 bg-cyan-400 rounded-lg flex items-center justify-center text-white font-bold text-4xl mb-4">
                {studentName.charAt(0).toUpperCase()}
              </div>
              <div className="flex gap-3 justify-center">
                <button className="p-2 hover:bg-gray-100 rounded-lg"></button>
                <button className="p-2 hover:bg-gray-100 rounded-lg"></button>
                <button className="p-2 hover:bg-gray-100 rounded-lg"></button>
                <button className="p-2 hover:bg-gray-100 rounded-lg"></button>
              </div>
            </div>

            {/* Information Grid */}
            <div className="space-y-4">
              <InfoField label="Name" value={studentName} />
              <InfoField label="Gender" value={student.gender} />
              <InfoField label="Father Name" value={student.father_name} />
              <InfoField label="Mother Name" value={student.mother_name} />
              <InfoField label="Date Of Birth" value={student.date_of_birth} />
              <InfoField label="Religion" value={student.religion} />
              <InfoField label="Father Occupation" value={student.father_occupation} />
              <InfoField label="E-mail" value={studentEmail} />
              <InfoField label="Admission Date" value={student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : 'N/A'} />
              <InfoField label="Class" value={student.level?.name} />
              <InfoField label="Section" value={student.level?.section} />
              <InfoField label="Roll" value={student.roll_number} />
              <InfoField label="Address" value={student.address} />
              <InfoField label="Phone" value={studentPhone} />
            </div>
          </div>
        </div>

        {/* Right: Notice Board and Exam Results */}
        <div className="col-span-2 space-y-6">
          {/* Attendance Summary */}
          {attendance && (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Total Days" value={String(attendance.total_days)} />
                <InfoField label="Present" value={String(attendance.present_days)} />
                <InfoField label="Absent" value={String(attendance.absent_days)} />
                <InfoField label="Late" value={String(attendance.late_days)} />
                <InfoField label="Presence" value={attendance.presence_percentage ? `${attendance.presence_percentage.toFixed(2)}%` : 'N/A'} />
              </div>
            </div>
          )}

          {/* Notice Board */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Notice Board</h2>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">✓</button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
              </div>
            </div>

            <div className="space-y-4 max-h-72 overflow-y-auto">
              {notices.map((notice) => (
                <div key={notice.id} className="pb-4 border-b last:border-0">
                  <p className="text-xs text-gray-500 mb-1">{notice.created_at}</p>
                  <p className="text-sm font-semibold text-blue-600">{notice.author}</p>
                  <p className="text-sm text-gray-700 mt-2">{notice.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Exam Results */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">All Exam Result</h2>
              <div className="flex gap-2">
                <input type="text" placeholder="Search by Exam ..." className="px-3 py-2 border rounded-lg text-sm" />
                <input type="text" placeholder="Search by Date ..." className="px-3 py-2 border rounded-lg text-sm" />
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                  SEARCH
                </Button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">✓</button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Exam Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Subject</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Grade Point</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Percent From</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Percent Upto</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {examResults.length > 0 ? (
                    examResults.map((result) => (
                      <tr key={result.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{result.exam_name || result.exam?.name || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-700">{result.subject_name || result.subject?.name || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-700">{result.grade_point?.toFixed(2) || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-700">{result.percentage || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-700">100.00</td>
                        <td className="px-4 py-3 text-gray-700">{result.date || new Date(result.created_at || '').toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                        No exam results found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between items-center py-3 border-b">
      <span className="text-gray-600 font-medium">{label} :</span>
      <span className="text-gray-900 font-semibold">{value || 'N/A'}</span>
    </div>
  )
}
