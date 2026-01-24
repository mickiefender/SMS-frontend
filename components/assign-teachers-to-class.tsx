"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Plus, Users } from "lucide-react"
import { academicsAPI, usersAPI } from "@/lib/api"
import { useAuthContext } from "@/lib/auth-context"

interface ClassTeacher {
  id: number
  class_obj: number
  class_name: string
  teacher: number
  teacher_name: string
  is_form_tutor: boolean
}

interface Teacher {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  user?: number
  user_data?: {
    id: number
    email: string
    first_name: string
    last_name: string
    username: string
    phone: string
    role: string
  }
}

export function AssignTeachersToClass({ classId, className }: { classId: number; className: string }) {
  const { user } = useAuthContext()
  const [classTeachers, setClassTeachers] = useState<ClassTeacher[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({ teacher: "", is_form_tutor: false })

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [classTeachersRes, teachersRes] = await Promise.all([
        academicsAPI.classTeachers(),
        usersAPI.teachers(),
      ])

      console.log("[v0] Teachers response:", teachersRes.data)
      console.log("[v0] Class teachers response:", classTeachersRes.data)

      const allClassTeachers = classTeachersRes.data.results || classTeachersRes.data || []
      const filteredTeachers = allClassTeachers.filter(
        (ct: ClassTeacher) => ct.class_obj === classId
      )
      const allTeachers = teachersRes.data.results || teachersRes.data || []
      
      console.log("[v0] All teachers count:", allTeachers.length)
      
      if (allTeachers.length === 0) {
        setError("No teachers found. Please create teachers first before assigning.")
      }
      
      setClassTeachers(filteredTeachers)
      setTeachers(allTeachers)
    } catch (err: any) {
      console.error("[v0] Error fetching data:", err)
      setError("Failed to load data. Please refresh.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [classId])

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.teacher) return

    try {
      const teacherProfile = teachers.find(t => t.id.toString() === formData.teacher)
      if (!teacherProfile) {
        setError("Teacher not found")
        return
      }

      // Use the actual User ID from user_data, not the Profile ID
      const userId = teacherProfile.user_data?.id || teacherProfile.user
      if (!userId) {
        setError("Invalid teacher data - missing user ID")
        return
      }

      console.log("[v0] Assigning teacher - Profile ID:", teacherProfile.id, "User ID:", userId)

      await academicsAPI.createClassTeacher({
        class_obj: classId,
        teacher: userId,
        is_form_tutor: formData.is_form_tutor,
      })
      setFormData({ teacher: "", is_form_tutor: false })
      setIsOpen(false)
      setError(null)
      fetchData()
    } catch (err: any) {
      console.error("[v0] Assign teacher error:", err)
      console.log("[v0] Error response status:", err?.response?.status)
      console.log("[v0] Error response data:", err?.response?.data)
      const errorMsg = err?.response?.data?.detail || 
                      err?.response?.data?.teacher?.[0] ||
                      err?.response?.data?.class_obj?.[0] ||
                      JSON.stringify(err?.response?.data) ||
                      err?.message ||
                      "Failed to assign teacher"
      setError(errorMsg)
    }
  }

  const handleRemoveTeacher = async (id: number) => {
    if (!confirm("Are you sure you want to remove this teacher from the class?")) return
    try {
      await academicsAPI.deleteClassTeacher(id)
      fetchData()
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to remove teacher")
    }
  }

  const assignedTeacherIds = new Set(classTeachers.map((ct) => ct.teacher))
  const availableTeachers = teachers.filter((t) => {
    const userId = t.user_data?.id || t.user
    return !assignedTeacherIds.has(userId)
  })

  if (loading) return <div className="text-center py-8">Loading...</div>

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Class Teachers
          </CardTitle>
          {user?.role === "school_admin" && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> Assign Teacher
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Teacher to Class</DialogTitle>
                </DialogHeader>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                )}
                <form onSubmit={handleAssignTeacher} className="space-y-4">
                  {availableTeachers.length === 0 ? (
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
                      <p className="font-semibold">No teachers available</p>
                      <p className="text-sm">
                        {teachers.length === 0 
                          ? "No teachers found in the system. Create teachers first in the Users management section."
                          : "All existing teachers are already assigned to this class."}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="teacher">Select Teacher</Label>
                        <Select value={formData.teacher} onValueChange={(value) => setFormData({ ...formData, teacher: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTeachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                {teacher.first_name} {teacher.last_name} ({teacher.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="form_tutor"
                          checked={formData.is_form_tutor}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, is_form_tutor: checked === true })
                          }
                        />
                        <Label htmlFor="form_tutor">Assign as Form Tutor (Class Manager)</Label>
                      </div>
                    </>
                  )}
                  <Button type="submit" className="w-full" disabled={availableTeachers.length === 0}>
                    Assign Teacher
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {classTeachers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No teachers assigned to this class yet</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  {user?.role === "school_admin" && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {classTeachers.map((classTeacher) => (
                  <TableRow key={classTeacher.id}>
                    <TableCell className="font-medium">{classTeacher.teacher_name}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      <Badge variant={classTeacher.is_form_tutor ? "default" : "secondary"}>
                        {classTeacher.is_form_tutor ? "Form Tutor" : "Teacher"}
                      </Badge>
                    </TableCell>
                    {user?.role === "school_admin" && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTeacher(classTeacher.id)}
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
  )
}
