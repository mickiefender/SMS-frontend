"use client"

import { useState, useEffect, Suspense } from "react"
import { useParams } from "next/navigation"
import { attendanceAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ArrowLeft, Search, Download } from "lucide-react"

function AttendanceDetailContent() {
  const params = useParams()
  const date = params.date as string
  const [attendances, setAttendances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchAttendanceDetail = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await attendanceAPI.list()
        const records = res.data.results || res.data || []

        // Filter by date
        const dayRecords = records.filter((r: any) => r.date === date)
        setAttendances(dayRecords)
      } catch (err: any) {
        setError("Failed to load attendance details")
        setAttendances([])
      } finally {
        setLoading(false)
      }
    }
    fetchAttendanceDetail()
  }, [date])

  const filteredAttendances = attendances.filter((a) =>
    (a.student_name || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "present":
        return "bg-green-100 text-green-800"
      case "absent":
        return "bg-red-100 text-red-800"
      case "late":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "present":
        return "✓ PRESENT"
      case "absent":
        return "✕ ABSENT"
      case "late":
        return "⏱ LATE"
      default:
        return status
    }
  }

  if (loading) return <div className="text-center py-8">Loading attendance details...</div>
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>

  return (
    <div className="space-y-6 bg-gradient-to-br from-red-50 to-pink-50 min-h-screen p-6 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/teacher/attendance"
            className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 mb-4"
          >
            <ArrowLeft size={20} /> GO BACK
          </Link>
          <h1 className="text-4xl font-bold text-red-600">Daily Attendance</h1>
          <p className="text-gray-600 mt-1">BHM / BHM-2 / Semester 4 / B</p>
        </div>
        <div className="text-right">
          <div className="bg-white px-6 py-3 rounded-lg shadow">
            <p className="text-sm text-gray-600">Date</p>
            <p className="text-lg font-semibold">{new Date(date).toLocaleDateString()}</p>
          </div>
          <Button className="mt-4 gap-2 bg-red-600 hover:bg-red-700">
            <Download size={18} /> EXPORT REPORT
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Students Information</h2>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <Input
              placeholder="Search students by name or roll"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Student Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Previous 7 Days Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Absent Days</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                filteredAttendances.map((att, idx) => (
                  <tr key={att.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{att.student_name || `Student ${att.student}`}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(att.status)}`}>
                        {getStatusBadgeClass(att.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {[...Array(7)].map((_, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded bg-gray-200 text-xs flex items-center justify-center text-gray-600"
                          >
                            {String(5 + i).padStart(2, "0")}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">2</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function AttendanceDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AttendanceDetailContent />
    </Suspense>
  )
}
