"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin } from "lucide-react"
import { academicsAPI } from "@/lib/api"

interface Timetable {
  id: number
  class_name: string
  subject_name: string
  day: string
  start_time: string
  end_time: string
  venue?: string
}

interface Class {
  id: number
  name: string
}

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export default function ViewTimetablePage() {
  const [timetables, setTimetables] = useState<Timetable[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [timetablesRes, classesRes] = await Promise.all([
          academicsAPI.timetables(),
          academicsAPI.classes(),
        ])

        setTimetables(timetablesRes.data.results || timetablesRes.data)
        const classesData = classesRes.data.results || classesRes.data
        setClasses(classesData)
        if (classesData.length > 0) {
          setSelectedClass(classesData[0].id.toString())
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
    ? timetables.filter((t) => t.class_name === classes.find((c) => c.id === parseInt(selectedClass))?.name)
    : timetables

  const sortedTimetables = [...filteredTimetables].sort((a, b) => {
    const dayA = DAYS_ORDER.indexOf(a.day)
    const dayB = DAYS_ORDER.indexOf(b.day)
    if (dayA !== dayB) return dayA - dayB
    return a.start_time.localeCompare(b.start_time)
  })

  if (loading) return <div className="text-center py-8">Loading...</div>

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Calendar className="w-8 h-8" />
          School Timetable
        </h1>
        <p className="text-muted-foreground mt-2">View class schedules and class routines</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select a Class</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="class-select">Choose a class to view timetable</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger id="class-select">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedTimetables.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No timetable entries for this class</p>
          ) : (
            <div className="space-y-4">
              {sortedTimetables.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Subject</p>
                      <p className="font-semibold text-lg">{entry.subject_name}</p>
                    </div>

                    <div className="space-y-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Day</p>
                        <Badge variant="secondary">{entry.day}</Badge>
                      </div>
                    </div>

                    <div className="space-y-1 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="font-medium">
                          {entry.start_time} - {entry.end_time}
                        </p>
                      </div>
                    </div>

                    {entry.venue && (
                      <div className="space-y-1 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Venue</p>
                          <p className="font-medium">{entry.venue}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabular View */}
      {sortedTimetables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Timetable Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Venue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTimetables.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.day}</TableCell>
                      <TableCell>{entry.subject_name}</TableCell>
                      <TableCell>{entry.start_time}</TableCell>
                      <TableCell>{entry.end_time}</TableCell>
                      <TableCell>{entry.venue || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
