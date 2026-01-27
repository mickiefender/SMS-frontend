"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Edit2, Trash2, Search, Shield, AlertCircle } from "lucide-react"
import Loader from "@/components/loader"

const ADMIN_ROLES = [
  { id: "academic_admin", label: "Academic Admin", icon: "📚" },
  { id: "exam_officer", label: "Exam Officer", icon: "📋" },
  { id: "finance_officer", label: "Finance Officer", icon: "💰" },
  { id: "ct_admin_support", label: "CT/Admin Support", icon: "🖥️" },
]

const PERMISSIONS = [
  { id: "manage_students", label: "Manage Students", category: "User Management" },
  { id: "manage_teachers", label: "Manage Teachers", category: "User Management" },
  { id: "manage_classes", label: "Manage Classes", category: "Academics" },
  { id: "manage_subjects", label: "Manage Subjects", category: "Academics" },
  { id: "manage_attendance", label: "Manage Attendance", category: "Operations" },
  { id: "manage_grades", label: "Manage Grades", category: "Academics" },
  { id: "manage_exams", label: "Manage Exams", category: "Exams" },
  { id: "view_exams", label: "View Exams", category: "Exams" },
  { id: "manage_fees", label: "Manage Fees", category: "Finance" },
  { id: "view_fees", label: "View Fees", category: "Finance" },
  { id: "manage_assignments", label: "Manage Assignments", category: "Teaching" },
  { id: "view_reports", label: "View Reports", category: "Analytics" },
  { id: "manage_timetable", label: "Manage Timetable", category: "Academics" },
  { id: "manage_materials", label: "Manage Materials", category: "Teaching" },
  { id: "send_messages", label: "Send Messages", category: "Communication" },
  { id: "manage_notices", label: "Manage Notices", category: "Communication" },
  { id: "manage_events", label: "Manage Events", category: "Communication" },
  { id: "manage_admins", label: "Manage Admin Accounts", category: "Administration" },
  { id: "view_analytics", label: "View Analytics", category: "Analytics" },
]

interface AdminStaff {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  permissions: string[]
  created_at: string
}

export default function ManageAdminStaffPage() {
  const [staff, setStaff] = useState<AdminStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<AdminStaff | null>(null)
  const [selectedRole, setSelectedRole] = useState("")
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
  })

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("[v0] Fetching admin staff from /api/users/admin-staff/")
      
      const token = localStorage.getItem("authToken")
      const response = await fetch("/api/users/admin-staff/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      })

      console.log("[v0] Response status:", response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[v0] Error response:", errorData)
        throw new Error(
          errorData?.detail || errorData?.message || `Failed to fetch staff: ${response.status} ${response.statusText}`
        )
      }
      
      const data = await response.json()
      console.log("[v0] Staff data received:", data)
      setStaff(data.results || data || [])
    } catch (err: any) {
      console.error("[v0] Error fetching staff:", err)
      setError(err.message || "Failed to load admin staff. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole) {
      setError("Please select a role")
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem("authToken")
      console.log("[v0] Creating staff member with role:", selectedRole)
      
      const response = await fetch("/api/users/admin-staff/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          ...formData,
          role: selectedRole,
          permissions: selectedPermissions,
        }),
      })

      console.log("[v0] Create response status:", response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[v0] Error creating staff:", errorData)
        throw new Error(
          errorData?.detail || 
          errorData?.email?.[0] ||
          errorData?.username?.[0] ||
          "Failed to create staff"
        )
      }
      
      console.log("[v0] Staff created successfully")
      setFormData({ username: "", email: "", first_name: "", last_name: "", password: "" })
      setSelectedRole("")
      setSelectedPermissions([])
      setIsOpen(false)
      setError(null)
      fetchStaff()
    } catch (err: any) {
      console.error("[v0] Error creating staff:", err)
      setError(err.message || "Failed to create staff")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePermissions = async (staffId: number) => {
    try {
      setError(null)
      const response = await fetch(`/api/users/admin-staff/${staffId}/permissions/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: selectedPermissions }),
      })

      if (!response.ok) throw new Error("Failed to update permissions")
      setSelectedStaff(null)
      fetchStaff()
    } catch (err: any) {
      console.error("[v0] Update error:", err)
      setError("Failed to update permissions")
    }
  }

  const handleDelete = async (staffId: number) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      try {
        setError(null)
        const response = await fetch(`/api/users/admin-staff/${staffId}/`, {
          method: "DELETE",
        })

        if (!response.ok) throw new Error("Failed to delete staff")
        fetchStaff()
      } catch (err: any) {
        console.error("[v0] Delete error:", err)
        setError("Failed to delete staff member")
      }
    }
  }

  const filteredStaff = staff.filter((s) =>
    `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Loader size="md" color="#3b82f6" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Admin Staff Management</h1>
          <p className="text-gray-600 mt-1">Create and manage administrative staff accounts with custom permissions</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus size={20} />
              Create Admin Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Admin Staff Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateStaff} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="First Name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Last Name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Account Information</h3>
                <div className="space-y-4">
                  <Input
                    placeholder="Username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Assign Role</h3>
                <div className="grid grid-cols-2 gap-3">
                  {ADMIN_ROLES.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => {
                        setSelectedRole(role.id)
                        setSelectedPermissions([])
                      }}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedRole === role.id
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-xl mb-2">{role.icon}</div>
                      <p className="font-semibold text-gray-900">{role.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Permissions Selection */}
              {selectedRole && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield size={16} />
                    Assign Permissions
                  </h3>
                  <div className="space-y-3">
                    {PERMISSIONS.map((permission) => (
                      <label key={permission.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <Checkbox
                          checked={selectedPermissions.includes(permission.id)}
                          onCheckedChange={(checked) => {
                            setSelectedPermissions(
                              checked
                                ? [...selectedPermissions, permission.id]
                                : selectedPermissions.filter((p) => p !== permission.id)
                            )
                          }}
                        />
                        <div>
                          <p className="font-medium text-gray-900">{permission.label}</p>
                          <p className="text-xs text-gray-500">{permission.category}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex gap-2">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Create Staff Account
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
        <Input
          placeholder="Search staff by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      {/* Staff List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4 border-b">
          <CardTitle>Active Admin Staff</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredStaff.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Shield className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p>No admin staff members found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Permissions</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStaff.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{member.first_name} {member.last_name}</p>
                        <p className="text-xs text-gray-500">@{member.username}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{member.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {ADMIN_ROLES.find((r) => r.id === member.role)?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{member.permissions?.length || 0} permissions</span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedStaff(member)
                            setSelectedPermissions(member.permissions || [])
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissions Management Modal */}
      {selectedStaff && (
        <Dialog open={!!selectedStaff} onOpenChange={() => setSelectedStaff(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Permissions - {selectedStaff.first_name} {selectedStaff.last_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Select Permissions</h3>
                <div className="space-y-3">
                  {PERMISSIONS.map((permission) => (
                    <label key={permission.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <Checkbox
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={(checked) => {
                          setSelectedPermissions(
                            checked
                              ? [...selectedPermissions, permission.id]
                              : selectedPermissions.filter((p) => p !== permission.id)
                          )
                        }}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{permission.label}</p>
                        <p className="text-xs text-gray-500">{permission.category}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleUpdatePermissions(selectedStaff.id)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Save Permissions
                </Button>
                <Button
                  onClick={() => setSelectedStaff(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
