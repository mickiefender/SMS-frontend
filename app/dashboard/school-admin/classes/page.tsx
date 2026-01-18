"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { academicsAPI, apiClient, authAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, Trash2, Edit2, Search } from "lucide-react"
import { Suspense } from "react"

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
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage)
  const paginatedClasses = filteredClasses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-purple-700">Class List</h1>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
            {error}
          </div>
        )}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">+ Add Class</Button>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              <Button type="submit" className="w-full bg-purple-600">
                {editingClass ? "Update" : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <Input
          placeholder="Search classes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Class Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Class Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Capacity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedClasses.map((cls) => (
              <tr key={cls.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 font-medium">{cls.name}</td>
                <td className="px-6 py-3">#{cls.code}</td>
                <td className="px-6 py-3">{cls.level || "N/A"}</td>
                <td className="px-6 py-3">{cls.capacity || "N/A"}</td>
                <td className="px-6 py-3 flex gap-2">
                  <button onClick={() => handleEdit(cls)} className="text-blue-600">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(cls.id)} className="text-red-600">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">{itemsPerPage} / page</span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={18} />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
              className={currentPage === page ? "bg-purple-600" : ""}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>
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
