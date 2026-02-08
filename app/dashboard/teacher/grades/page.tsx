"use client"

import { TeacherGrading } from "@/components/teacher-grading"

export default function TeacherGradesPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Record Grades</h1>
      <TeacherGrading />
    </div>
  )
}
