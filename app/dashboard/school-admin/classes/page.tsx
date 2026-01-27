"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { academicsAPI, apiClient, authAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, Trash2, Edit2, Search, Plus, Users, BookOpen, Users2, UserCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Suspense } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ClassSubjectsManagement } from "@/components/class-subjects-management"
import { EnrollStudentsInClass } from "@/components/enroll-students-in-class"
import { AssignTeachersToClass } from "@/components/assign-teachers-to-class"
import { AssignSubjectTeachers } from "@/components/assign-subject-teachers"
import Loader from '@/components/loader'



interface Class {
  id: number
  name: string
  code: string
  level?: number
  capacity?: number
  is_active?: boolean
}

interface Level {
  id: number
  name: string
}

function ClassesPageContent() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isOpen, setIsOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [formData, setFormData] = useState({ name: "", code: "", level: "", capacity: "" })
  const [schoolId, setSchoolId] = useState<number | null>(null)
  const [levels, setLevels] = useState<Level[]>([])
  const [selectedClassName, setSelectedClassName] = useState<string>("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null) // Declare setSelectedClassId

  const itemsPerPage = 10

  const generateClassCode = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .substring(0, 4)
      .padEnd(4, "0")
  }

  const fetchUserAndClasses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use authAPI.me() to get current user
      const userRes = await authAPI.me()
      console.log("[v0] User data from authAPI.me():", userRes.data)
      
      if (!userRes.data.school) {
        console.log("[v0] WARNING: User has no school assigned")
        setError("Your account is not associated with a school. Contact your administrator.")
        setLoading(false)
        return
      }
      
      setSchoolId(userRes.data.school)
      console.log("[v0] School ID set to:", userRes.data.school)
      
      // Fetch classes
      const classesResponse = await academicsAPI.classes()
      console.log("[v0] Classes response:", classesResponse.data)
      setClasses(classesResponse.data.results || classesResponse.data || [])
      
      // Fetch levels - try with error handling
      try {
        const levelsResponse = await academicsAPI.levels()
        console.log("[v0] Levels response:", levelsResponse.data)
        setLevels(levelsResponse.data.results || levelsResponse.data || [])
      } catch (levelsErr) {
        console.log("[v0] Could not fetch levels, continuing without them:", levelsErr)
        setLevels([])
      }
      
      setError(null)
    } catch (err: any) {
      console.log("[v0] Full error object:", err)
      console.log("[v0] Error status:", err?.response?.status)
      console.log("[v0] Error data:", err?.response?.data)
      console.log("[v0] Error message:", err?.message)
      
      if (err?.response?.status === 401) {
        setError("You are not authenticated. Please log in again.")
      } else if (err?.response?.status === 403) {
        setError("You do not have permission to access this page. Only school admins can view classes.")
      } else {
        setError(`Failed to load school information. Error: ${err?.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const response = await academicsAPI.classes()
      setClasses(response.data.results || response.data || [])
    } catch (err) {
      console.log("[v0] Error fetching classes:", err)
      setError("Failed to load classes")
    }
  }

  useEffect(() => {
    fetchUserAndClasses()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!formData.name || !formData.capacity) {
        setError("Name and capacity are required")
        return
      }

      if (!schoolId) {
        setError("School ID not loaded. Please refresh the page.")
        return
      }

      const submitData: any = {
        name: formData.name,
        capacity: parseInt(formData.capacity, 10),
        school: schoolId,
      }

      // Only include level if provided - it's now optional
      if (formData.level) {
        submitData.level = parseInt(formData.level, 10)
      } else {
        submitData.level = null
      }

      console.log("[v0] Submitting class data:", submitData)

      if (editingClass) {
        await academicsAPI.updateClass(editingClass.id, submitData)
      } else {
        await academicsAPI.createClass(submitData)
      }
      setIsOpen(false)
      setEditingClass(null)
      setFormData({ name: "", code: "", level: "", capacity: "" })
      setError(null)
      fetchUserAndClasses()
    } catch (err: any) {
      console.log("[v0] Error details:", err?.response?.data)
      setError(err?.response?.data?.detail || JSON.stringify(err?.response?.data) || "Failed to save class")
    }
  }

  const handleEdit = (cls: Class) => {
    setEditingClass(cls)
    setFormData({
      name: cls.name,
      code: cls.code,
      level: cls.level?.toString() || "",
      capacity: cls.capacity?.toString() || "",
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure?")) {
      try {
        await academicsAPI.deleteClass(id)
        fetchUserAndClasses()
      } catch (err) {
        setError("Failed to delete class")
      }
    }
  }

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) 
      
  )

  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage)
  const paginatedClasses = filteredClasses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="space-y-6 pb-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Classes Management</h1>
          <p className="text-gray-600 mt-1">Manage all your school classes, assignments, and settings</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Plus size={20} />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingClass ? "Edit Class" : "Add New Class"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Class Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Senior 1A"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Level (Optional)</Label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a level</option>
                    {levels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Capacity *</Label>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    required
                    placeholder="e.g., 50"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-blue-600">
                {editingClass ? "Update Class" : "Create Class"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-800 font-medium">Error</p>
          <p className="text-red-700 text-sm">{error}</p>
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

      {/* Classes Table/List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-lg">All Classes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading classes...</div>
          ) : paginatedClasses.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-600">No classes found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Class Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Capacity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedClasses.map((cls) => (
                    <tr key={cls.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Users2 size={18} className="text-blue-600" />
                          </div>
                          <span className="font-semibold text-gray-900">{cls.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          #{cls.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{cls.level || "—"}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-gray-400" />
                          <span className="text-gray-900">{cls.capacity || "—"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEdit(cls)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit class"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(cls.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete class"
                          >
                            <Trash2 size={18} />
                          </button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedClassId(cls.id)
                              setSelectedClassName(cls.name)
                              setSheetOpen(true)
                            }}
                            className="ml-2 border-green-200 text-green-700 hover:bg-green-50"
                          >
                            Manage
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Showing <span className="font-medium">{paginatedClasses.length}</span> of{" "}
            <span className="font-medium">{filteredClasses.length}</span> classes
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronLeft size={16} />
              Previous
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page ? "bg-blue-600 text-white" : ""}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="gap-1"
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Class Management Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full md:w-3/4 lg:w-2/3 overflow-y-auto bg-gray-50">
          <SheetHeader className="border-b pb-4 mb-6">
            <SheetTitle className="text-2xl">
              Manage Class: <span className="text-blue-600">{selectedClassName}</span>
            </SheetTitle>
            <p className="text-sm text-gray-600 mt-2">Configure students, teachers, subjects, and schedule for this class</p>
          </SheetHeader>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-blue-600" />
                Subjects
              </h3>
              <ClassSubjectsManagement classId={selectedClassId || 0} className={selectedClassName} />
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={20} className="text-green-600" />
                Enroll Students
              </h3>
              <EnrollStudentsInClass classId={selectedClassId || 0} className={selectedClassName} />
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserCheck size={20} className="text-purple-600" />
                Assign Teachers
              </h3>
              <AssignTeachersToClass classId={selectedClassId || 0} className={selectedClassName} />
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users2 size={20} className="text-orange-600" />
                Subject Teachers
              </h3>
              <AssignSubjectTeachers classId={selectedClassId || 0} className={selectedClassName} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default function ClassesPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <ClassesPageContent />
    </Suspense>
  )
}
