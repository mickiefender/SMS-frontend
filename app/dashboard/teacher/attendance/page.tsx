"use client"

import { useState, useEffect, Suspense } from "react"
import { useAuthContext } from "@/lib/auth-context"
import { attendanceAPI } from "@/lib/api"
import Link from "next/link"
import { Calendar, ChevronRight } from "lucide-react"

function AttendanceContent() {
  const { user } = useAuthContext()
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await attendanceAPI.list()
        const records = res.data.results || res.data || []

        // Group by date and get unique dates
        const uniqueDates = [...new Set(records.map((r: any) => r.date))].sort().reverse()
        const grouped = uniqueDates.map((date) => ({
          date,
          count: records.filter((r: any) => r.date === date).length,
        }))

        setAttendanceRecords(grouped)
      } catch (err: any) {
        setError("Failed to load attendance records")
        setAttendanceRecords([])
      } finally {
        setLoading(false)
      }
    }
    fetchAttendanceRecords()
  }, [])

  if (loading) return <div className="text-center py-8">Loading attendance records...</div>
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-red-600 mb-2">Attendance Records</h1>
        <p className="text-gray-600">Click on any date to view detailed attendance</p>
      </div>

      {attendanceRecords.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No attendance records found</div>
      ) : (
        <div className="space-y-3">
          {attendanceRecords.map((record) => (
            <Link key={record.date} href={`/dashboard/teacher/attendance/${record.date}`}>
              <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow cursor-pointer flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <Calendar className="text-red-600" size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Attendance - {new Date(record.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">{record.count} students marked</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-400" size={24} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AttendanceContent />
    </Suspense>
  )
}
