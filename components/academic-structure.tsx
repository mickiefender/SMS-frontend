"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface Department {
  id: number
  name: string
  hod: string
  level: string
}

interface Subject {
  id: number
  code: string
  name: string
  department: string
  creditHours: number
}

export function AcademicStructure() {
  const [activeTab, setActiveTab] = useState<"departments" | "classes" | "subjects">("departments")

  const [departments, setDepartments] = useState<Department[]>([
    { id: 1, name: "Science", hod: "Dr. Adams", level: "All" },
    { id: 2, name: "Humanities", hod: "Mrs. Brown", level: "All" },
    { id: 3, name: "Technical", hod: "Mr. Wilson", level: "SS2-SS3" },
  ])

  const [classes, setClasses] = useState([
    { id: 1, name: "SS1A", form: "SS1", capacity: 40, current: 38 },
    { id: 2, name: "SS1B", form: "SS1", capacity: 40, current: 39 },
    { id: 3, name: "SS2A", form: "SS2", capacity: 45, current: 42 },
  ])

  const [subjects, setSubjects] = useState<Subject[]>([
    { id: 1, code: "ENG101", name: "English Language", department: "Humanities", creditHours: 3 },
    { id: 2, code: "MTH101", name: "Mathematics", department: "Science", creditHours: 4 },
    { id: 3, code: "BIO101", name: "Biology", department: "Science", creditHours: 3 },
  ])

  const [showNewDept, setShowNewDept] = useState(false)
  const [newDept, setNewDept] = useState({ name: "", hod: "" })

  const addDepartment = () => {
    if (newDept.name && newDept.hod) {
      setDepartments([...departments, { id: Date.now(), ...newDept, level: "All" }])
      setNewDept({ name: "", hod: "" })
      setShowNewDept(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Academic Structure</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("departments")}
            className={`px-4 py-2 rounded text-sm ${
              activeTab === "departments" ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            Departments
          </button>
          <button
            onClick={() => setActiveTab("classes")}
            className={`px-4 py-2 rounded text-sm ${activeTab === "classes" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            Classes
          </button>
          <button
            onClick={() => setActiveTab("subjects")}
            className={`px-4 py-2 rounded text-sm ${activeTab === "subjects" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            Subjects
          </button>
        </div>

        {activeTab === "departments" && (
          <div className="space-y-4">
            <div>
              <Button size="sm" onClick={() => setShowNewDept(!showNewDept)} className="mb-4">
                Add Department
              </Button>
              {showNewDept && (
                <div className="p-4 border rounded-lg space-y-3 mb-4">
                  <input
                    type="text"
                    placeholder="Department name"
                    value={newDept.name}
                    onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Head of Department"
                    value={newDept.hod}
                    onChange={(e) => setNewDept({ ...newDept, hod: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addDepartment}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowNewDept(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Department</th>
                    <th className="text-left py-2 px-2">Head of Department</th>
                    <th className="text-left py-2 px-2">Levels</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => (
                    <tr key={dept.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 font-medium">{dept.name}</td>
                      <td className="py-2 px-2">{dept.hod}</td>
                      <td className="py-2 px-2">{dept.level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "classes" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Class Name</th>
                  <th className="text-left py-2 px-2">Form</th>
                  <th className="text-left py-2 px-2">Capacity</th>
                  <th className="text-left py-2 px-2">Current</th>
                  <th className="text-left py-2 px-2">Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls) => (
                  <tr key={cls.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2 font-medium">{cls.name}</td>
                    <td className="py-2 px-2">{cls.form}</td>
                    <td className="py-2 px-2">{cls.capacity}</td>
                    <td className="py-2 px-2">{cls.current}</td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${(cls.current / cls.capacity) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{Math.round((cls.current / cls.capacity) * 100)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "subjects" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Code</th>
                  <th className="text-left py-2 px-2">Subject</th>
                  <th className="text-left py-2 px-2">Department</th>
                  <th className="text-left py-2 px-2">Credit Hours</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2 font-medium">{subject.code}</td>
                    <td className="py-2 px-2">{subject.name}</td>
                    <td className="py-2 px-2">{subject.department}</td>
                    <td className="py-2 px-2">{subject.creditHours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
