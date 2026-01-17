"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function GradesManagement() {
  const [grades, setGrades] = useState([
    { id: 1, name: "John Doe", subject: "Mathematics", score: 92, type: "exam" },
    { id: 2, name: "Jane Smith", subject: "Mathematics", score: 88, type: "exam" },
    { id: 3, name: "Bob Johnson", subject: "English", score: 85, type: "test" },
  ])

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Grades & Assessment</CardTitle>
          <Button size="sm">Add Grade</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Student</th>
                <th className="text-left py-2 px-2">Subject</th>
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-left py-2 px-2">Score</th>
                <th className="text-left py-2 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade) => (
                <tr key={grade.id} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-2">{grade.name}</td>
                  <td className="py-2 px-2">{grade.subject}</td>
                  <td className="py-2 px-2">{grade.type}</td>
                  <td className="py-2 px-2 font-bold">{grade.score}%</td>
                  <td className="py-2 px-2">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
