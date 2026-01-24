"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit2, Plus, Search } from "lucide-react"
import { academicsAPI } from "@/lib/api"
import { useAuthContext } from "@/lib/auth-context"

interface Subject {
  id: number
  name: string
  code: string
  description?: string
}

interface ClassSubject {
  id: number
  class_obj: number
  class_name: string
  subject: number
  subject_name: string
  subject_code: string
}

interface ClassSubjectTeacher {
  id: number
  class_obj: number
  class_name: string
  subject: number
  subject_name: string
  subject_code: string
  teacher: number
  teacher_name: string
}

export function ClassSubjectsManagement({ classId, className }: { classId: number; className: string }) {
  const { user } = useAuthContext()
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isTeacherOpen, setIsTeacherOpen] = useState(false)
  const [selectedClassSubject, setSelectedClassSubject] = useState<ClassSubject | null>(null)
  const [formData, setFormData] = useState({ subject: "" })
  const [teacherFormData, setTeacherFormData] = useState({ subject: "", teacher: "" })

  const fetchData = async () => {
    try {
      setLoading(true)
      const [subjectsRes, classSubjectsRes] = await Promise.all([
        academicsAPI.subjects(),
        academicsAPI.classSubjects(),
      ])

      setSubjects(subjectsRes.data.results || subjectsRes.data)
      const filtered = (classSubjectsRes.data.results || classSubjectsRes.data).filter(
        (cs: any) => cs.class_obj === classId
      )
      setClassSubjects(filtered)
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load subjects")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [classId])

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.subject) return

    try {
      await academicsAPI.createClassSubject({
        class_obj: classId,
        subject: formData.subject,
      })
      setFormData({ subject: "" })
      setIsOpen(false)
      fetchData()
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to add subject")
    }
  }

  const handleDeleteSubject = async (id: number) => {
    if (!confirm("Are you sure you want to delete this subject from the class?")) return
    try {
      await academicsAPI.deleteClassSubject(id)
      fetchData()
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to delete subject")
    }
  }

  if (loading) return <div className="text-center py-8">Loading subjects...</div>
  if (error) return <div className="text-red-500 py-8">{error}</div>

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Subjects in {className}</CardTitle>
          {user?.role === "school_admin" && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Subject to Class</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddSubject} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Select Subject</Label>
                    <Select value={formData.subject} onValueChange={(value) => setFormData({ subject: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id.toString()}>
                            {subject.name} ({subject.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">
                    Add Subject
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {classSubjects.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No subjects assigned to this class yet</p>
        ) : (
          <div className="space-y-4">
            {classSubjects.map((classSubject) => (
              <div key={classSubject.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{classSubject.subject_name}</p>
                  <p className="text-sm text-muted-foreground">{classSubject.subject_code}</p>
                </div>
                {user?.role === "school_admin" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSubject(classSubject.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
