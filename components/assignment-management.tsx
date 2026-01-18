"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { assignmentAPI, academicsAPI } from "@/lib/api"

export function AssignmentManagement() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    class_obj: "",
    subject: "",
    title: "",
    description: "",
    due_date: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [assignmentsRes, classesRes, subjectsRes] = await Promise.all([
          assignmentAPI.list(),
          academicsAPI.classes(),
          academicsAPI.subjects(),
        ])

        setAssignments(assignmentsRes.data.results || assignmentsRes.data || [])
        setClasses(classesRes.data.results || classesRes.data || [])
        setSubjects(subjectsRes.data.results || subjectsRes.data || [])
      } catch (error) {
        console.error("[v0] Failed to fetch assignments data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await assignmentAPI.create({
        class_obj: Number.parseInt(formData.class_obj),
        subject: Number.parseInt(formData.subject),
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date,
      })

      setFormData({
        class_obj: "",
        subject: "",
        title: "",
        description: "",
        due_date: "",
      })
      setIsOpen(false)

      // Refresh assignments
      const res = await assignmentAPI.list()
      setAssignments(res.data.results || res.data || [])
    } catch (error: any) {
      console.error("[v0] Failed to create assignment:", error)
      alert(error?.response?.data?.detail || "Failed to create assignment")
    }
  }

  const getClassName = (classId: number) => {
    const cls = classes.find((c) => c.id === classId)
    return cls?.name || `Class ${classId}`
  }

  const getSubjectName = (subjectId: number) => {
    const subject = subjects.find((s) => s.id === subjectId)
    return subject?.name || `Subject ${subjectId}`
  }

  if (loading) return <div className="text-center py-4">Loading assignments...</div>

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Assignments</CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Create Assignment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div>
                  <Label htmlFor="class">Class</Label>
                  <select
                    id="class"
                    value={formData.class_obj}
                    onChange={(e) => setFormData({ ...formData, class_obj: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <select
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  Create Assignment
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {assignments.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No assignments created yet</p>
          ) : (
            assignments.map((assignment) => (
              <div key={assignment.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{assignment.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {getClassName(assignment.class_obj || assignment.class_obj_id)} -{" "}
                      {getSubjectName(assignment.subject || assignment.subject_id)}
                    </p>
                    <p className="text-sm mt-2">{assignment.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Due: {new Date(assignment.due_date).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
