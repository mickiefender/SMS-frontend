"use client"

import { ProtectedRoute } from "@/lib/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClassSubjectsManagement } from "@/components/class-subjects-management"
import { EnrollStudentsInClass } from "@/components/enroll-students-in-class"
import { AssignTeachersToClass } from "@/components/assign-teachers-to-class"
import { AssignSubjectTeachers } from "@/components/assign-subject-teachers"
import { useState, useEffect } from "react"
import { academicsAPI } from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface Class {
  id: number
  name: string
}

export default function ClassManagementPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await academicsAPI.classes()
        const classesData = response.data.results || response.data || []
        setClasses(classesData)
        if (classesData.length > 0) {
          setSelectedClass(classesData[0])
        }
      } catch (error) {
        console.error("Failed to fetch classes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchClasses()
  }, [])

  if (loading) return <div className="text-center py-8">Loading...</div>

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Class Management</h1>
        <p className="text-muted-foreground mt-2">Manage subjects, students, and teachers for your classes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select a Class</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="class-select">Choose a class to manage</Label>
            <Select
              value={selectedClass?.id?.toString() || ""}
              onValueChange={(value) => {
                const cls = classes.find((c) => c.id === parseInt(value))
                setSelectedClass(cls || null)
              }}
            >
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

      {selectedClass && (
        <Tabs defaultValue="subjects" className="w-full">
          <TabsList>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="teachers">Teachers</TabsTrigger>
            <TabsTrigger value="subject-teachers">Subject Teachers</TabsTrigger>
          </TabsList>

          <TabsContent value="subjects">
            <ClassSubjectsManagement classId={selectedClass.id} className={selectedClass.name} />
          </TabsContent>

          <TabsContent value="students">
            <EnrollStudentsInClass classId={selectedClass.id} className={selectedClass.name} />
          </TabsContent>

          <TabsContent value="teachers">
            <AssignTeachersToClass classId={selectedClass.id} className={selectedClass.name} />
          </TabsContent>

          <TabsContent value="subject-teachers">
            <AssignSubjectTeachers classId={selectedClass.id} className={selectedClass.name} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
