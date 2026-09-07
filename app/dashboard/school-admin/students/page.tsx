"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { usersAPI, getErrorMessage } from "@/lib/api"
import { DataStateTableRow } from "@/components/data-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useAuthContext } from "@/lib/auth-context"
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit2,
  Search,
  Eye,
  UserPlus,
  Users,
  GraduationCap,
  Filter,
  Download,
  CheckSquare,
  Square,
  X,
  AlertCircle,
  User,
  AtSign,
  Mail,
  Phone,
  MapPin,
  Lock,
} from "lucide-react"
import { ProfileAvatar } from "@/components/profile-avatar"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { exportToCSV, exportToExcel } from "@/lib/export-utils"


interface Student {
  id: number
  user?: { id: number; first_name: string; last_name: string; email: string; username: string }
  user_data?: { id: number; first_name: string; last_name: string; email: string; username: string }
  first_name?: string
  last_name?: string
  email?: string
  username?: string
  user_email?: string
  phone?: string
  address?: string
  date_of_birth?: string
  student_id?: string
  enrollment_date?: string
  is_active?: boolean
  profile_picture_url?: string | null
}

function StudentsPageContent() {
  const searchParams = useSearchParams()
  const { user } = useAuthContext()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isOpen, setIsOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    phone: "",
    address: "",
  })

  const [exportLoading, setExportLoading] = useState(false)

  const itemsPerPage = 10

  const fetchStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await usersAPI.students()
      const data = response.data.results || response.data || []
      setStudents(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to load students. Please try again."))
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      if (editingStudent) {
        await usersAPI.updateStudent(editingStudent.id, formData)
      } else {
        const schoolId = user?.school_id
        if (!schoolId) {
          setError("No school associated with your account")
          return
        }
        await usersAPI.createStudent({
          ...formData,
          username: formData.username.trim().replace(/\s+/g, ""),
          school_id: schoolId,
        })
      }
      setIsOpen(false)
      setEditingStudent(null)
      setFormData({ username: "", email: "", first_name: "", last_name: "", password: "", phone: "", address: "" })
      fetchStudents()
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to save student. Please check the highlighted details and try again."))
    }
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setFormData({
      username: student.username || student.user_data?.username || student.user?.username || "",
      email: student.email || student.user_email || student.user_data?.email || student.user?.email || "",
      first_name: student.first_name || student.user_data?.first_name || student.user?.first_name || "",
      last_name: student.last_name || student.user_data?.last_name || student.user?.last_name || "",
      password: "",
      phone: student.phone || "",
      address: student.address || "",
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this student?")) {
      try {
        await usersAPI.deleteStudent(id)
        setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next })
        fetchStudents()
      } catch (err: any) {
        setError("Failed to delete student")
      }
    }
  }

  const getStudentName = (student: Student) => {
    if (student.first_name || student.last_name) {
      return `${student.first_name || ""} ${student.last_name || ""}`.trim() || student.username || "N/A"
    }
    if (student.user_data) {
      return (
        `${student.user_data.first_name || ""} ${student.user_data.last_name || ""}`.trim() ||
        student.user_data.username
      )
    }
    if (student.user) {
      return `${student.user.first_name || ""} ${student.user.last_name || ""}`.trim() || student.user.username
    }
    return student.username || "N/A"
  }

  const getStudentEmail = (student: Student) => {
    return student.email || student.user_email || student.user_data?.email || student.user?.email || "N/A"
  }

  const filteredStudents = students.filter(
    (student) =>
      getStudentName(student).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getStudentEmail(student).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.student_id || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage)

  const isAllSelected = paginatedStudents.length > 0 && paginatedStudents.every((s) => selectedIds.has(s.id))
  const isSomeSelected = paginatedStudents.some((s) => selectedIds.has(s.id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        paginatedStudents.forEach((s) => next.delete(s.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        paginatedStudents.forEach((s) => next.add(s.id))
        return next
      })
    }
  }

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const activeCount = students.filter((s) => s.is_active !== false).length


  const handleExport = async (format: "csv" | "excel") => {
    const source =
      selectedIds.size > 0 ? filteredStudents.filter((s) => selectedIds.has(s.id)) : filteredStudents
    if (source.length === 0) return
    setExportLoading(true)
    try {
      const headers = ["Name", "Email", "Student ID", "Phone", "Address", "Status", "Enrollment Date"]
      const rows = source.map((s) => [
        getStudentName(s),
        getStudentEmail(s),
        s.student_id || "",
        s.phone || "",
        s.address || "",
        s.is_active !== false ? "Active" : "Inactive",
        s.enrollment_date ? new Date(s.enrollment_date).toLocaleDateString() : "",
      ])
      const date = new Date().toISOString().slice(0, 10)
      if (format === "csv") {
        exportToCSV(`students-${date}.csv`, headers, rows)
      } else {
        await exportToExcel(`students-${date}.xlsx`, "Students", headers, rows)
      }
    } catch {
      setError("Failed to export student list")
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/dashboard/school-admin" className="hover:text-primary transition-colors">Dashboard</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Students</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-secondary" />
            Student Registry
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage and monitor all enrolled students
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={exportLoading || filteredStudents.length === 0}
              >
                <Download size={15} />
                {exportLoading
                  ? "Exporting…"
                  : selectedIds.size > 0
                    ? `Export (${selectedIds.size})`
                    : "Export"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("csv")}>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("excel")}>Export as Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => {
                  setEditingStudent(null)
                  setFormData({
                    username: "",
                    email: "",
                    first_name: "",
                    last_name: "",
                    password: "",
                    phone: "",
                    address: "",
                  })
                  setError(null)
                }}
              >
                <UserPlus size={16} />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border px-6 py-5">
                <DialogHeader className="space-y-0">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/15 ring-1 ring-primary/20 flex items-center justify-center flex-shrink-0">
                      <GraduationCap size={22} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <DialogTitle className="text-lg font-bold text-foreground">
                        {editingStudent ? "Edit Student" : "Enrol New Student"}
                      </DialogTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {editingStudent
                          ? "Update the student's information below."
                          : "Fill in the details below to register a new student. Fields marked * are required."}
                      </p>
                    </div>
                  </div>
                </DialogHeader>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit}>
                <div className="px-6 py-5 space-y-6 max-h-[60vh] overflow-y-auto">
                  {error && (
                    <div className="flex items-start gap-2 bg-destructive/10 text-destructive border border-destructive/20 px-4 py-3 rounded-lg text-sm">
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* ── Personal Information ── */}
                  <fieldset className="space-y-4">
                    <legend className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      <span className="w-6 h-px bg-border" />
                      Personal Information
                      <span className="flex-1 h-px bg-border" />
                    </legend>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="first_name" className="text-sm font-medium text-foreground">First Name <span className="text-destructive">*</span></Label>
                        <div className="relative">
                          <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          <Input
                            id="first_name"
                            placeholder="e.g. Kofi"
                            className="pl-9 bg-background"
                            value={formData.first_name}
                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="last_name" className="text-sm font-medium text-foreground">Last Name <span className="text-destructive">*</span></Label>
                        <div className="relative">
                          <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          <Input
                            id="last_name"
                            placeholder="e.g. Mensah"
                            className="pl-9 bg-background"
                            value={formData.last_name}
                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="username" className="text-sm font-medium text-foreground">Username <span className="text-destructive">*</span></Label>
                        <div className="relative">
                          <AtSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          <Input
                            id="username"
                            placeholder="e.g. kmensah"
                            className="pl-9 bg-background"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-sm font-medium text-foreground">Email Address <span className="text-destructive">*</span></Label>
                        <div className="relative">
                          <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="student@school.edu"
                            className="pl-9 bg-background"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </fieldset>

                  {/* ── Contact Information ── */}
                  <fieldset className="space-y-4">
                    <legend className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      <span className="w-6 h-px bg-border" />
                      Contact Information
                      <span className="flex-1 h-px bg-border" />
                    </legend>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-sm font-medium text-foreground">Phone Number</Label>
                        <div className="relative">
                          <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          <Input
                            id="phone"
                            placeholder="+233 XX XXX XXXX"
                            className="pl-9 bg-background"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="address" className="text-sm font-medium text-foreground">Address</Label>
                        <div className="relative">
                          <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          <Input
                            id="address"
                            placeholder="City, Region"
                            className="pl-9 bg-background"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </fieldset>

                  {/* ── Account Security ── */}
                  {!editingStudent && (
                    <fieldset className="space-y-4">
                      <legend className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        <span className="w-6 h-px bg-border" />
                        Account Security
                        <span className="flex-1 h-px bg-border" />
                      </legend>

                      <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-sm font-medium text-foreground">Password <span className="text-destructive">*</span></Label>
                        <div className="relative">
                          <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          <Input
                            id="password"
                            type="password"
                            placeholder="Min. 8 characters"
                            className="pl-9 bg-background"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          The student will use this password to sign in to their account.
                        </p>
                      </div>
                    </fieldset>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setIsOpen(false); setError(null) }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground min-w-[150px]">
                    <UserPlus size={15} />
                    {editingStudent ? "Save Changes" : "Enrol Student"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Students</p>
            <p className="text-2xl font-bold text-foreground">{students.length.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Active Students</p>
            <p className="text-2xl font-bold text-foreground">{activeCount.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <Filter className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Search Results</p>
            <p className="text-2xl font-bold text-foreground">{filteredStudents.length.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* ── Search & Bulk Actions Bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search by name, email or student ID…"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9 pr-9 bg-background"
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(""); setCurrentPage(1) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary font-medium flex-shrink-0">
            <CheckSquare size={15} />
            {selectedIds.size} selected
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-1 hover:opacity-70 transition-opacity"
            >
              <X size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ── Data Table ── */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left w-10">
                  <button
                    onClick={toggleSelectAll}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isAllSelected ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                  Student
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs hidden md:table-cell">
                  Student ID
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs hidden lg:table-cell">
                  Contact
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs hidden xl:table-cell">
                  Address
                </th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground uppercase tracking-wider text-xs hidden sm:table-cell">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedStudents.length === 0 ? (
                loading ? (
                  <DataStateTableRow colSpan={7} loading={loading} emptyMessage="No students found" />
                ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <div className="w-14 h-14 rounded-full bg-muted/60 flex items-center justify-center">
                        <GraduationCap size={24} className="opacity-50" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">No students found</p>
                        <p className="text-sm mt-0.5">
                          {searchTerm
                            ? `No results for "${searchTerm}". Try a different search.`
                            : "Get started by adding your first student."}
                        </p>
                      </div>
                      {!searchTerm && (
                        <Button
                          size="sm"
                          className="mt-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                          onClick={() => setIsOpen(true)}
                        >
                          <UserPlus size={14} />
                          Add First Student
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
                )
              ) : (
                paginatedStudents.map((student) => {
                  const name = getStudentName(student)
                  const email = getStudentEmail(student)
                  const isSelected = selectedIds.has(student.id)
                  const isActive = student.is_active !== false

                  return (
                    <tr
                      key={student.id}
                      className={`group transition-colors hover:bg-muted/30 ${isSelected ? "bg-primary/5" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5 w-10">
                        <button
                          onClick={() => toggleSelectOne(student.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {isSelected
                            ? <CheckSquare size={16} className="text-primary" />
                            : <Square size={16} />
                          }
                        </button>
                      </td>

                      {/* Student Name + Email */}
                      <td className="px-4 py-3.5">
                        <Link href={`/dashboard/school-admin/students/${student.id}`}>
                          <div className="flex items-center gap-3 cursor-pointer">
                            <ProfileAvatar
                              src={student.profile_picture_url}
                              userId={student.id || student.user?.id || student.user_data?.id}
                              alt={name}
                              size="md"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                {name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{email}</p>
                            </div>
                          </div>
                        </Link>
                      </td>

                      {/* Student ID */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        {student.student_id ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-muted text-xs font-mono font-medium text-foreground">
                            {student.student_id}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5 hidden lg:table-cell text-sm text-muted-foreground">
                        {student.phone || <span className="text-xs">—</span>}
                      </td>

                      {/* Address */}
                      <td className="px-4 py-3.5 hidden xl:table-cell text-sm text-muted-foreground max-w-[160px]">
                        <span className="truncate block">{student.address || <span className="text-xs">—</span>}</span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5 hidden sm:table-cell text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-muted text-muted-foreground border border-border"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/dashboard/school-admin/students/${student.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              title="View Profile"
                            >
                              <Eye size={15} />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            onClick={() => handleEdit(student)}
                            title="Edit Student"
                          >
                            <Edit2 size={15} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => handleDelete(student.id)}
                            title="Delete Student"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer / Pagination ── */}
        {filteredStudents.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredStudents.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">{filteredStudents.length}</span>{" "}
              student{filteredStudents.length !== 1 ? "s" : ""}
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft size={14} />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Show first, last, current and neighbours
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  )
                })
                .reduce<(number | "…")[]>((acc, page, idx, arr) => {
                  if (idx > 0 && typeof arr[idx - 1] === "number" && (page as number) - (arr[idx - 1] as number) > 1) {
                    acc.push("…")
                  }
                  acc.push(page)
                  return acc
                }, [])
                .map((item, idx) =>
                  item === "…" ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-sm">
                      …
                    </span>
                  ) : (
                    <Button
                      key={item}
                      variant={currentPage === item ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(item as number)}
                      className={`h-8 w-8 p-0 text-xs ${currentPage === item ? "bg-primary text-primary-foreground border-primary" : ""}`}
                    >
                      {item}
                    </Button>
                  )
                )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function StudentsPage() {
  return (
    <Suspense fallback={null}>
      <StudentsPageContent />
    </Suspense>
  )
}
