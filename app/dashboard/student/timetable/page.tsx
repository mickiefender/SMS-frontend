"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { academicsAPI } from "@/lib/api"
import { Clock } from "lucide-react"

interface DashboardData {
  timetables: any[]
  subjects: any[]
  teachers: any[]
}

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        let allTimetables = []
        let allSubjects = []
        let allTeachers = []

        try {
          const timetablesRes = await academicsAPI.timetables()
          allTimetables = timetablesRes.data.results || timetablesRes.data || []
        } catch (err) {
          console.error("Error fetching timetables:", err)
        }

        try {
          const subjectsRes = await academicsAPI.subjects()
          allSubjects = subjectsRes.data.results || subjectsRes.data || []
        } catch (err) {
          console.error("Error fetching subjects:", err)
        }

        try {
          const teachersRes = await academicsAPI.teachers()
          allTeachers = teachersRes.data.results || teachersRes.data || []
        } catch (err) {
          console.error("Error fetching teachers:", err)
        }

        setData({
          timetables: allTimetables,
          subjects: allSubjects,
          teachers: allTeachers,
        })

      } catch (err: any) {
        console.error("Error in fetchDashboardData:", err?.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">Failed to load dashboard. Please check the browser console for errors.</p>
        <Button onClick={() => window.location.reload()}>Reload Page</Button>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Timetable</h1>
        <p className="text-gray-600">Weekly Class Schedule</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Timetable</CardTitle>
          <CardDescription>Your class schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => {
              const dayTimetable = data?.timetables
                ?.filter((t) => t.day.toLowerCase() === day.toLowerCase())
                .sort((a, b) => a.start_time.localeCompare(b.start_time))

              if (!dayTimetable || dayTimetable.length === 0) return null

              return (
                <div key={day} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b font-semibold text-gray-700">{day}</div>
                  <div className="divide-y">
                    {dayTimetable.map((slot: any, idx: number) => {
                      const subject = data?.subjects?.find((s) => s.id === slot.subject || s.id === slot.subject_id)
                      const teacher = data?.teachers?.find((t) => t.id === slot.teacher || t.id === slot.teacher_id)

                      return (
                        <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-gray-50">
                          <div className="min-w-[150px]">
                            <div className="flex items-center gap-2 text-blue-600 font-medium">
                              <Clock className="w-4 h-4" />
                              {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{subject?.name || "Unknown Subject"}</h4>
                            <p className="text-sm text-gray-500">
                              {teacher?.full_name || teacher?.username || "Unknown Teacher"}
                            </p>
                          </div>
                          {slot.venue && (
                            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                              Room: {slot.venue}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {(!data?.timetables || data.timetables.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No timetable entries found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
