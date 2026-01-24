"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { academicsAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Plus, Users, ArrowRight, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { EnrollStudentsInClass } from "@/components/enroll-students-in-class"

interface Class {
  id: number
  name: string
  code: string
  level?: string
  capacity?: number
}

export default function StudentAssignmentsPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [selectedClassName, setSelectedClassName] = useState<string>("")
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await academicsAPI.classes()
      setClasses(response.data.results || response.data || [])
    } catch (err: any) {
      console.error("[v0] Error fetching classes:", err)
      setError("Failed to load classes")
    } finally {
      setLoading(false)
    }
  }

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) 
     
  )

  const handleSelectClass = (classItem: Class) => {
    setSelectedClassId(classItem.id)
    setSelectedClassName(classItem.name)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Student Enrollment</h1>
          <p className="text-gray-600 mt-1">Manage student assignments to classes</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-start gap-3">
          <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
        <Input
          placeholder="Search classes by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11 border-gray-300"
        />
      </div>

      {/* Classes Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading classes...</p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-600 font-medium">No classes found</p>
            <p className="text-gray-500 text-sm mt-1">
              {searchTerm ? "Try adjusting your search criteria" : "Create classes first"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((classItem) => (
            <Card key={classItem.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                      {classItem.name}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Code: #{classItem.code}</p>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Users size={20} className="text-blue-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Level:</span>
                  <span className="font-medium text-gray-900">{classItem.level || "—"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-medium text-gray-900">{classItem.capacity || "—"}</span>
                </div>
                <Dialog open={dialogOpen && selectedClassId === classItem.id} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => handleSelectClass(classItem)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                      Manage Students
                      <ArrowRight size={16} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">
                        Enroll Students in <span className="text-blue-600">{selectedClassName}</span>
                      </DialogTitle>
                    </DialogHeader>
                    {selectedClassId && (
                      <EnrollStudentsInClass classId={selectedClassId} className={selectedClassName} />
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
