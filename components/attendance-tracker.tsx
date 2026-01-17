"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function AttendanceTracker() {
  const [selectedClass, setSelectedClass] = useState("")
  const [attendance, setAttendance] = useState({
    1: "present",
    2: "absent",
    3: "present",
    4: "late",
  })

  const students = [
    { id: 1, name: "John Doe" },
    { id: 2, name: "Jane Smith" },
    { id: 3, name: "Bob Johnson" },
    { id: 4, name: "Alice Brown" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mark Attendance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Select Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded"
          >
            <option value="">Choose a class</option>
            <option value="SS1">Senior 1</option>
            <option value="SS2">Senior 2</option>
            <option value="SS3">Senior 3</option>
          </select>
        </div>

        <div className="space-y-2">
          {students.map((student) => (
            <div key={student.id} className="flex items-center justify-between p-3 border rounded">
              <span>{student.name}</span>
              <select
                value={attendance[student.id as keyof typeof attendance] || "present"}
                onChange={(e) => setAttendance({ ...attendance, [student.id]: e.target.value })}
                className="px-2 py-1 border border-input rounded text-sm"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
              </select>
            </div>
          ))}
        </div>

        <Button className="w-full">Submit Attendance</Button>
      </CardContent>
    </Card>
  )
}
