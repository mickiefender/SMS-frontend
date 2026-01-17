"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { academicsAPI, usersAPI } from "@/lib/api"

interface TeacherAssignment {
  id: number
  teacher: string
  class: string
  subject: string
  status: "assigned" | "pending"
}

export function TeacherAssignment() {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [teachers, setTeachers] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [newAssignment, setNewAssignment] = useState({ teacher: "", class: "", subject: "" })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teachersRes, classesRes, subjectsRes] = await Promise.all([
          usersAPI.list(),
          academicsAPI.classes(),
          academicsAPI.subjects(),
        ])

        setTeachers(teachersRes.data.results || [])
        setClasses(classesRes.data.results || [])
        setSubjects(subjectsRes.data.results || [])
        setLoading(false)
      } catch (error) {
        console.error("[v0] Failed to fetch data:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const addAssignment = async () => {
    if (newAssignment.teacher && newAssignment.class && newAssignment.subject) {
      try {
        const data = {
          teacher_id: newAssignment.teacher,
          class_id: newAssignment.class,
          subject_id: newAssignment.subject,
        }
        await academicsAPI.createClassSubject(data)
        setNewAssignment({ teacher: "", class: "", subject: "" })
        setShowForm(false)
      } catch (error) {
        console.error("[v0] Failed to create assignment:", error)
      }
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading assignments...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Teacher Assignments</CardTitle>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            New Assignment
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {showForm && (
            <div className="p-4 border rounded-lg space-y-3">
              <select
                value={newAssignment.teacher}
                onChange={(e) => setNewAssignment({ ...newAssignment, teacher: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Select Teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.first_name} {teacher.last_name}
                  </option>
                ))}
              </select>
              <select
                value={newAssignment.class}
                onChange={(e) => setNewAssignment({ ...newAssignment, class: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              <select
                value={newAssignment.subject}
                onChange={(e) => setNewAssignment({ ...newAssignment, subject: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button size="sm" onClick={addAssignment}>
                  Assign
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
