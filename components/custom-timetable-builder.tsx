"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, Calendar } from "lucide-react"
import { academicsAPI } from "@/lib/api"
import { useAuthContext } from "@/lib/auth-context"

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
]

interface Timetable {
  id: number
  class_obj: number
  class_name: string
  subject: number
  subject_name: string
  day: string
  start_time: string
  end_time: string
  venue?: string
  teacher?: string
}

interface Class {
  id: number
  name: string
}

interface Subject {
  id: number
  name: string
}

export function CustomTimetableBuilder() {
  const { user } = useAuthContext()
  const [timetables, setTimetables] = useState<Timetable[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [formData, setFormData] = useState({
    class_obj: "",
    subject: "",
    day: "",
    start_time: "",
    end_time: "",
    venue: "",
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const [timetablesRes, classesRes, subjectsRes] = await Promise.all([
        academicsAPI.timetables(),
        academicsAPI.classes(),
        academicsAPI.subjects(),
      ])

      setTimetables(timetablesRes.data.results || timetablesRes.data)
      setClasses(classesRes.data.results || classesRes.data)
      setSubjects(subjectsRes.data.results || subjectsRes.data)
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateTimetable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.class_obj || !formData.subject || !formData.day || !formData.start_time || !formData.end_time) {
      setError("Please fill in all required fields")
      return
    }

    try {
      await academicsAPI.createTimetable(formData)
      setFormData({
        class_obj: "",
        subject: "",
        day: "",
        start_time: "",
        end_time: "",
        venue: "",
      })
      setIsOpen(false)
      fetchData()
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create timetable entry")
    }
  }

  const handleDeleteTimetable = async (id: number) => {
    if (!confirm("Are you sure you want to delete this timetable entry?")) return
    try {
      await academicsAPI.deleteTimetable(id)
      fetchData()
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to delete entry")
    }
  }

  const filteredTimetables = selectedClass ? timetables.filter((t) => t.class_obj === parseInt(selectedClass)) : timetables

  if (loading) return <div className="text-center py-8">Loading timetables...</div>

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          <p>{error}</p>
          <button className="text-sm underline mt-2" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              School Timetable
            </CardTitle>
            {user?.role === "school_admin" && (
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" /> Create Slot
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Timetable Entry</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateTimetable} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="class">Class</Label>
                        <Select value={formData.class_obj} onValueChange={(value) => setFormData({ ...formData, class_obj: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
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

                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map((subj) => (
                              <SelectItem key={subj.id} value={subj.id.toString()}>
                                {subj.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="day">Day</Label>
                        <Select value={formData.day} onValueChange={(value) => setFormData({ ...formData, day: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS_OF_WEEK.map((day) => (
                              <SelectItem key={day} value={day}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="venue">Venue</Label>
                        <Input
                          placeholder="e.g., Room 101"
                          value={formData.venue}
                          onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="start_time">Start Time</Label>
                        <Select value={formData.start_time} onValueChange={(value) => setFormData({ ...formData, start_time: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_SLOTS.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="end_time">End Time</Label>
                        <Select value={formData.end_time} onValueChange={(value) => setFormData({ ...formData, end_time: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_SLOTS.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" className="w-full">
                      Create Entry
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filter">Filter by Class</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredTimetables.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No timetable entries</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Venue</TableHead>
                    {user?.role === "school_admin" && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTimetables.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.class_name}</TableCell>
                      <TableCell>{entry.subject_name}</TableCell>
                      <TableCell>{entry.day}</TableCell>
                      <TableCell>
                        {entry.start_time} - {entry.end_time}
                      </TableCell>
                      <TableCell>{entry.venue || "-"}</TableCell>
                      {user?.role === "school_admin" && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTimetable(entry.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
