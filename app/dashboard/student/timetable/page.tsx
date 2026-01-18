"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/lib/protected-route"
import { useAuthContext } from "@/lib/auth-context"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { apiClient } from "@/lib/api"

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const DAY_COLORS = [
  "bg-yellow-100",
  "bg-blue-100",
  "bg-green-100",
  "bg-yellow-100",
  "bg-pink-100",
  "bg-purple-100",
  "bg-green-100",
]
const TIME_PERIODS = [
  "08:00 - 09:00",
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 01:00",
  "01:00 - 02:00",
  "02:00 - 03:00",
  "03:00 - 04:00",
]

interface TimeSlot {
  day: string
  start_time: string
  end_time: string
  subject: string
  teacher_name: string
  venue: string
}

export default function TimetablePage() {
  const { user } = useAuthContext()
  const [timetable, setTimetable] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true)
        const res = await apiClient.get("/academics/timetables/")
        setTimetable(res.data.results || res.data || [])
      } catch (err: any) {
        setError("Failed to load timetable")
        console.error("[v0] Failed to fetch timetable:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTimetable()
  }, [])

  const getClassAtTime = (day: string, timePeriod: string) => {
    const [startHour] = timePeriod.split(" - ")[0].split(":").map(Number)
    return timetable.find((slot) => {
      const slotDay = slot.day?.toLowerCase()
      const dayLower = day.toLowerCase()
      const [slotHour] = slot.start_time.split(":").map(Number)
      return slotDay === dayLower && slotHour === startHour
    })
  }

  if (loading)
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <div className="p-8">Loading timetable...</div>
      </ProtectedRoute>
    )

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/student">
            <button className="p-2 hover:bg-gray-100 rounded">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold">Weekly Schedule</h1>
            <p className="text-gray-600 mt-2">
              Name: {user?.first_name} {user?.last_name}
            </p>
          </div>
        </div>

        {error && <div className="text-red-500 p-4 bg-red-50 rounded">{error}</div>}

        {/* Weekly Timetable Grid */}
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full border-collapse">
            {/* Header Row */}
            <thead>
              <tr>
                <th className="border-2 border-black p-4 bg-gray-200 font-bold text-left">Time / period</th>
                {DAYS.map((day, idx) => (
                  <th key={day} className={`border-2 border-black p-4 font-bold text-center ${DAY_COLORS[idx]}`}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Time Slots */}
            <tbody>
              {TIME_PERIODS.map((period) => (
                <tr key={period}>
                  {/* Time Period Cell */}
                  <td className="border-2 border-black p-4 font-semibold bg-gray-100 text-sm">{period}</td>

                  {/* Day Cells */}
                  {DAYS.map((day) => {
                    const classSlot = getClassAtTime(day, period)
                    return (
                      <td key={`${day}-${period}`} className="border-2 border-black p-4 h-24 align-top">
                        {classSlot ? (
                          <div className="text-xs space-y-1">
                            <p className="font-bold text-blue-700">{classSlot.subject}</p>
                            <p className="text-gray-600">{classSlot.teacher_name}</p>
                            <p className="text-gray-500">{classSlot.venue}</p>
                          </div>
                        ) : null}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="text-xs text-gray-500 text-center">School Management System - Weekly Schedule</div>
      </div>
    </ProtectedRoute>
  )
}
