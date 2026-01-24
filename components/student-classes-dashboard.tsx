"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BookOpen, Users, Calendar } from "lucide-react"
import { academicsAPI } from "@/lib/api"
import { useAuthContext } from "@/lib/auth-context"

interface StudentClass {
  id: number
  class_obj: number
  class_name: string
  student: number
  assigned_date: string
  is_active: boolean
}

interface ClassSubject {
  id: number
  class_name: string
  subject_name: string
  subject_code: string
}

interface EnrollmentWithSubjects extends StudentClass {
  subjects?: ClassSubject[]
}

export function StudentClassesDashboard() {
  const { user } = useAuthContext()
  const [classes, setClasses] = useState<EnrollmentWithSubjects[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedClass, setSelectedClass] = useState<EnrollmentWithSubjects | null>(null)
  const [subjects, setSubjects] = useState<ClassSubject[]>([])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const classesRes = await academicsAPI.studentClasses()
      const classesData = classesRes.data.results || classesRes.data
      setClasses(Array.isArray(classesData) ? classesData : [])

      // Fetch subjects for the first class
      if (classesData && classesData.length > 0) {
        const subjectsRes = await academicsAPI.classSubjects()
        const allSubjects = subjectsRes.data.results || subjectsRes.data
        const classSubjects = Array.isArray(allSubjects)
          ? allSubjects.filter((s: any) => s.class_obj === classesData[0].class_obj)
          : []
        setSubjects(classSubjects)
        setSelectedClass(classesData[0])
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load classes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [user?.id])

  const handleSelectClass = async (classData: EnrollmentWithSubjects) => {
    setSelectedClass(classData)
    try {
      const subjectsRes = await academicsAPI.classSubjects()
      const allSubjects = subjectsRes.data.results || subjectsRes.data
      const classSubjects = Array.isArray(allSubjects)
        ? allSubjects.filter((s: any) => s.class_obj === classData.class_obj)
        : []
      setSubjects(classSubjects)
    } catch (err: any) {
      setError("Failed to load subjects")
    }
  }

  if (loading) return <div className="text-center py-8">Loading your classes...</div>
  if (error) return <div className="text-red-500 py-8">{error}</div>
  if (classes.length === 0) return <div className="text-center py-8 text-muted-foreground">No classes assigned yet</div>

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            My Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((classData) => (
              <div
                key={classData.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedClass?.id === classData.id ? "bg-primary text-white" : "hover:bg-muted"
                }`}
                onClick={() => handleSelectClass(classData)}
              >
                <div className="font-semibold">{classData.class_name}</div>
                <div className="text-sm opacity-75">Enrolled: {new Date(classData.assigned_date).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Subjects in {selectedClass.class_name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <p className="text-muted-foreground">No subjects available for this class</p>
            ) : (
              <div className="space-y-2">
                {subjects.map((subject) => (
                  <div key={subject.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{subject.subject_name}</p>
                      <p className="text-sm text-muted-foreground">{subject.subject_code}</p>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
