"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { academicsAPI } from "@/lib/api"

interface Timetable {
  id: number
  class_name: string
  subject_name: string
  day: string
  start_time: string
  end_time: string
  venue?: string
  teacher_name?: string
  teacher?: any
}

interface Class {
  id: number
  name: string
}

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const DAYS_SHORT = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

// Day colors inspired by the template
const DAY_COLORS: { [key: string]: string } = {
  "Monday": "bg-yellow-400 text-gray-900",
  "Tuesday": "bg-pink-500 text-white",
  "Wednesday": "bg-blue-600 text-white",
  "Thursday": "bg-green-500 text-white",
  "Friday": "bg-cyan-400 text-gray-900",
  "Saturday": "bg-cyan-300 text-gray-900",
  "Sunday": "bg-yellow-300 text-gray-900",
}

// Subject/Activity colors
const SUBJECT_COLORS = [
  "bg-yellow-300 text-gray-900",
  "bg-green-500 text-white",
  "bg-pink-500 text-white",
  "bg-orange-400 text-white",
  "bg-cyan-400 text-gray-900",
  "bg-indigo-600 text-white",
  "bg-red-500 text-white",
  "bg-purple-500 text-white",
]

// Generate time slots (e.g., 8:00-9:00, 9:00-10:00, etc.)
const generateTimeSlots = (start: string, end: string): string[] => {
  const slots: string[] = []
  const [startHour] = start.split(":").map(Number)
  const [endHour] = end.split(":").map(Number)
  
  for (let i = startHour; i < endHour; i++) {
    slots.push(`${i.toString().padStart(2, "0")}:00-${(i + 1).toString().padStart(2, "0")}:00`)
  }
  
  return slots
}

export default function ViewTimetablePage() {
  const [timetables, setTimetables] = useState<Timetable[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [timeSlots, setTimeSlots] = useState<string[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [timetablesRes, classesRes] = await Promise.all([
          academicsAPI.timetables(),
          academicsAPI.classes(),
        ])

        const timetablesData = timetablesRes.data.results || timetablesRes.data || []
        setTimetables(timetablesData)
        
        const classesData = classesRes.data.results || classesRes.data || []
        setClasses(classesData)
        
        if (classesData.length > 0) {
          setSelectedClass(classesData[0].id.toString())
        }

        // Generate time slots from timetable data
        if (timetablesData.length > 0) {
          const times = timetablesData.map((t: { start_time: any }) => t.start_time).sort()
          const minTime = times[0] || "08:00"
          const maxTime = times[times.length - 1] || "18:00"
          const slots = generateTimeSlots(minTime, maxTime)
          setTimeSlots(slots)
        }
      } catch (error) {
        console.error("Failed to fetch timetable:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredTimetables = selectedClass
    ? timetables.filter((t) => {
        const selectedClassName = classes.find((c) => c.id === parseInt(selectedClass))?.name
        return t.class_name === selectedClassName
      })
    : timetables

  // Build grid data: rows are time slots, columns are days
  const getClassAtTimeSlot = (day: string, timeSlot: string) => {
    return filteredTimetables.find(t => {
      const [slotStart] = timeSlot.split("-")[0].split(":")
      return t.day === day && t.start_time.startsWith(slotStart)
    })
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: "#F39C12" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-wider text-gray-800">SCHOOL SCHEDULE</h1>
          <p className="text-gray-700 mt-2">Weekly Class Timetable</p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-2xl p-8">
          {/* Class Selection */}
          <div className="mb-8 pb-6 border-b">
            <Label htmlFor="class-select" className="text-lg font-semibold text-gray-700 mb-3 block">
              Select a Class
            </Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger id="class-select" className="w-full md:w-64">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timetable Grid */}
          {filteredTimetables.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No timetable entries for this class</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="inline-block w-full border border-gray-300">
                {/* Header Row - Days */}
                <div className="grid gap-0" style={{ gridTemplateColumns: "120px repeat(7, 1fr)" }}>
                  <div className="bg-gray-600 text-white font-bold p-3 text-center">TIME</div>
                  {DAYS_ORDER.map((day, idx) => (
                    <div
                      key={day}
                      className={`font-bold p-3 text-center text-sm ${DAY_COLORS[day]}`}
                    >
                      {DAYS_SHORT[idx]}
                    </div>
                  ))}
                </div>

                {/* Time Slot Rows */}
                {timeSlots.map((slot, slotIdx) => (
                  <div key={slot} className="grid gap-0" style={{ gridTemplateColumns: "120px repeat(7, 1fr)" }}>
                    <div className="bg-gray-700 text-white font-semibold p-3 text-center text-sm border-t border-gray-300">
                      {slot}
                    </div>

                    {DAYS_ORDER.map((day) => {
                      const classItem = getClassAtTimeSlot(day, slot)
                      const colorClass = classItem
                        ? SUBJECT_COLORS[
                            filteredTimetables.indexOf(classItem) % SUBJECT_COLORS.length
                          ]
                        : "bg-gray-50"

                      return (
                        <div
                          key={`${day}-${slot}`}
                          className={`p-2 text-center border-t border-gray-300 min-h-24 flex flex-col justify-center ${
                            classItem ? colorClass : ""
                          }`}
                        >
                          {classItem && (
                            <div className="text-xs md:text-sm font-semibold">
                              <p className="font-bold">{classItem.subject_name}</p>
                              {classItem.venue && (
                                <p className="text-xs opacity-90 mt-1">{classItem.venue}</p>
                              )}
                              {(classItem.teacher_name || classItem.teacher) && (
                                <p className="text-xs opacity-75 mt-1">
                                  {classItem.teacher_name || (typeof classItem.teacher === 'object' ? (classItem.teacher.name || `${classItem.teacher.first_name || ''} ${classItem.teacher.last_name || ''}`) : "")}
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
          {filteredTimetables.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="font-bold text-gray-700 mb-4">Classes</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {filteredTimetables.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded ${SUBJECT_COLORS[idx % SUBJECT_COLORS.length]}`}></div>
                    <span className="text-sm text-gray-700">{item.subject_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t text-center text-sm text-gray-600">
            <p>School Timetable - Generated for {classes.find(c => c.id === parseInt(selectedClass))?.name}</p>
            <p className="mt-2 text-xs">For any changes or updates, please contact the administration office.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
