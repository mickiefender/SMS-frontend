"use client"

import { useState, useEffect, useRef } from "react"
import { ProtectedRoute } from "@/lib/protected-route"
import { useAuthContext } from "@/lib/auth-context"
import Link from "next/link"
import { ArrowLeft, Calendar, Download } from "lucide-react"
import { apiClient } from "@/lib/api"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const DAYS_SHORT = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

// Day colors inspired by gym schedule template
const DAY_STYLES: { [key: string]: { bg: string; color: string } } = {
  Monday: { bg: "#facc15", color: "#111827" }, // yellow-400, gray-900
  Tuesday: { bg: "#ec4899", color: "#ffffff" }, // pink-500, white
  Wednesday: { bg: "#2563eb", color: "#ffffff" }, // blue-600, white
  Thursday: { bg: "#22c55e", color: "#ffffff" }, // green-500, white
  Friday: { bg: "#22d3ee", color: "#111827" }, // cyan-400, gray-900
  Saturday: { bg: "#67e8f9", color: "#111827" }, // cyan-300, gray-900
  Sunday: { bg: "#fde047", color: "#111827" }, // yellow-300, gray-900
}

// Subject/Class colors
const SUBJECT_STYLES = [
  { bg: "#fde047", color: "#111827" }, // yellow-300
  { bg: "#22c55e", color: "#ffffff" }, // green-500
  { bg: "#ec4899", color: "#ffffff" }, // pink-500
  { bg: "#fb923c", color: "#ffffff" }, // orange-400
  { bg: "#22d3ee", color: "#111827" }, // cyan-400
  { bg: "#4f46e5", color: "#ffffff" }, // indigo-600
  { bg: "#ef4444", color: "#ffffff" }, // red-500
  { bg: "#a855f7", color: "#ffffff" }, // purple-500
]

interface TimeSlot {
  id?: number
  day: string
  start_time: string
  end_time: string
  subject_name?: string
  subject?: any
  teacher_name?: string
  teacher?: any
  venue?: string
}

// Generate time slots
const generateTimeSlots = (timetable: TimeSlot[]): string[] => {
  const times = new Set<string>()
  timetable.forEach(slot => {
    if (slot.start_time && slot.end_time) {
      const [startHour] = slot.start_time.split(":").map(Number)
      times.add(`${startHour.toString().padStart(2, "0")}:00-${(startHour + 1).toString().padStart(2, "0")}:00`)
    }
  })
  return Array.from(times).sort()
}

export default function TimetablePage() {
  const { user } = useAuthContext()
  const [timetable, setTimetable] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [downloading, setDownloading] = useState(false)
  const timetableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true)
        const res = await apiClient.get("/academics/timetables/")
        const data = res.data.results || res.data || []
        setTimetable(data)
        
        // Generate time slots from timetable data
        if (data.length > 0) {
          const slots = generateTimeSlots(data)
          setTimeSlots(slots)
        }
      } catch (err: any) {
        setError("Failed to load timetable")
        console.error("[v0] Failed to fetch timetable:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTimetable()
  }, [])

  const getClassAtTime = (day: string, timeSlot: string) => {
    const [slotStart] = timeSlot.split("-")[0].split(":").map(Number)
    return timetable.find((slot) => {
      const slotDay = slot.day?.toLowerCase()
      const dayLower = day.toLowerCase()
      const [hour] = (slot.start_time || "00:00").split(":").map(Number)
      return slotDay === dayLower && hour === slotStart
    })
  }

  const handleDownloadPDF = async () => {
    if (!timetableRef.current) return
    
    try {
      setDownloading(true)
      
      // Dynamically import html2canvas and jsPDF
      const html2canvas = (await import("html2canvas")).default
      const { jsPDF } = await import("jspdf")
      
      // Capture the timetable element
      const canvas = await html2canvas(timetableRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      })
      
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "mm",
        format: canvas.width > canvas.height ? "a4" : "a4",
      })
      
      const imgWidth = pdf.internal.pageSize.getWidth() - 10
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      pdf.addImage(imgData, "PNG", 5, 5, imgWidth, imgHeight)
      
      // Generate filename with student name and date
      const fileName = `${user?.first_name}_${user?.last_name}_Timetable_${new Date().toISOString().split("T")[0]}.pdf`
      pdf.save(fileName)
    } catch (err) {
      console.error("[v0] Error downloading PDF:", err)
      alert("Failed to download timetable. Please try again.")
    } finally {
      setDownloading(false)
    }
  }

  if (loading)
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <div className="p-8 animate-pulse">
          <div className="h-12 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </ProtectedRoute>
    )

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="min-h-screen p-8" style={{ backgroundColor: "#F39C12" }}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/dashboard/student">
              <button className="mb-4 p-2 hover:bg-white rounded-lg transition-colors flex items-center gap-2 text-white hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
            </Link>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-wider text-white">MY SCHEDULE</h1>
            <p className="text-white mt-2">
              {user?.first_name} {user?.last_name}
            </p>
          </div>

          {/* Download Button */}
          {timetable.length > 0 && (
            <div className="mb-6 flex justify-center">
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                {downloading ? "Downloading..." : "Download Schedule"}
              </button>
            </div>
          )}

          {/* Main Content Card */}
          <div className="bg-white rounded-lg shadow-2xl p-8" ref={timetableRef}>
            {error && (
              <div className="mb-4 text-red-600 p-4 bg-red-50 rounded-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {timetable.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No classes scheduled yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="inline-block w-full border border-gray-300">
                  {/* Header Row - Days */}
                  <div className="grid gap-0" style={{ gridTemplateColumns: "120px repeat(7, 1fr)" }}>
                    <div className="font-bold p-3 text-center" style={{ backgroundColor: "#4b5563", color: "#ffffff" }}>TIME</div>
                    {DAYS.map((day, idx) => (
                      <div
                        key={day}
                        className="font-bold p-3 text-center text-sm"
                        style={{ backgroundColor: DAY_STYLES[day].bg, color: DAY_STYLES[day].color }}
                      >
                        {DAYS_SHORT[idx]}
                      </div>
                    ))}
                  </div>

                  {/* Time Slot Rows */}
                  {timeSlots.map((slot) => (
                    <div key={slot} className="grid gap-0" style={{ gridTemplateColumns: "120px repeat(7, 1fr)" }}>
                      <div className="font-semibold p-3 text-center text-sm border-t border-gray-300" style={{ backgroundColor: "#374151", color: "#ffffff" }}>
                        {slot}
                      </div>

                      {DAYS.map((day) => {
                        const classItem = getClassAtTime(day, slot)
                        const style = classItem
                          ? SUBJECT_STYLES[
                              timetable.indexOf(classItem) % SUBJECT_STYLES.length
                            ]
                          : { bg: "#f9fafb", color: "inherit" } // gray-50

                        return (
                          <div
                            key={`${day}-${slot}`}
                            className="p-2 text-center border-t border-gray-300 min-h-24 flex flex-col justify-center"
                            style={{ backgroundColor: style.bg, color: style.color }}
                          >
                            {classItem && (
                              <div className="text-xs md:text-sm font-semibold">
                                <p className="font-bold">{classItem.subject_name || (typeof classItem.subject === 'object' ? classItem.subject?.name : classItem.subject)}</p>
                                {classItem.venue && (
                                  <p className="text-xs opacity-90 mt-1">{classItem.venue}</p>
                                )}
                                {(classItem.teacher_name || (typeof classItem.teacher === 'object' && classItem.teacher?.name)) && (
                                  <p className="text-xs opacity-75 mt-1">
                                    {classItem.teacher_name || classItem.teacher?.name}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legend */}
            {timetable.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="font-bold text-gray-700 mb-4">Your Classes</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {timetable.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: SUBJECT_STYLES[idx % SUBJECT_STYLES.length].bg }}></div>
                      <span className="text-sm text-gray-700">
                        {item.subject_name || (typeof item.subject === 'object' ? item.subject?.name : item.subject)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t text-center text-sm text-gray-600">
              <p>Your weekly class schedule</p>
              <p className="mt-2 text-xs">For any changes, please contact your class teacher or the administration.</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
