"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"
import { schoolsAPI } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface School {
  id: number
  name: string
  email: string
  status: string
  plan?: { name: string }
}

interface SchoolsManagementProps {
  refreshTrigger?: () => void
}

export function SchoolsManagement({ refreshTrigger }: SchoolsManagementProps) {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [openDialog, setOpenDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    admin_username: "",
    admin_email: "",
    admin_password: "",
  })

  useEffect(() => {
    fetchSchools()
  }, [])

  const fetchSchools = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await schoolsAPI.list()
      console.log("[v0] Full API response:", response)
      const schoolsData = response.data.results || response.data
      console.log("[v0] Schools data:", schoolsData)
      console.log("[v0] Schools array check - Array.isArray:", Array.isArray(schoolsData))
      console.log("[v0] Schools length:", schoolsData?.length)
      setSchools(Array.isArray(schoolsData) ? schoolsData : [])
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || "Failed to fetch schools"
      setError(errorMsg)
      console.log("[v0] Error fetching schools:", errorMsg)
      console.log("[v0] Full error object:", err)
      setSchools([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError("")
      await schoolsAPI.create(formData)
      console.log("[v0] School created successfully")
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        country: "",
        postal_code: "",
        admin_username: "",
        admin_email: "",
        admin_password: "",
      })
      setOpenDialog(false)
      await fetchSchools()
      if (refreshTrigger) refreshTrigger()
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || "Failed to create school"
      setError(errorMsg)
      console.log("[v0] Error creating school:", errorMsg)
    }
  }

  const handleToggleSuspend = async (id: number, currentStatus: string) => {
    try {
      setError("")
      if (currentStatus === "active") {
        await schoolsAPI.suspend(id)
        console.log("[v0] School suspended successfully")
      }
      else {
        await schoolsAPI.activate(id)
        console.log("[v0] School activated successfully")
      }
      await fetchSchools()
      if (refreshTrigger) refreshTrigger()
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || "Failed to update school status"
      setError(errorMsg)
      console.log("[v0] Error updating school status:", errorMsg)
    }
  }

  if (loading && schools.length === 0) {
    return <div className="text-center py-4">Loading schools...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Schools Management</CardTitle>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button size="sm">Add School</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New School</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSchool} className="space-y-4 max-h-96 overflow-y-auto">
                {/* School Information */}
                <div>
                  <Label>School Name</Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter school name"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter school email"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter address"
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Enter state"
                  />
                </div>
                <div>
                  <Label>Postal Code</Label>
                  <Input
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="Enter postal code"
                  />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Enter country"
                  />
                </div>

                {/* School Admin Credentials Section */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-sm mb-3">School Admin Credentials</h3>
                  <div>
                    <Label>Admin Username</Label>
                    <Input
                      value={formData.admin_username}
                      onChange={(e) => setFormData({ ...formData, admin_username: e.target.value })}
                      placeholder="e.g., admin_john"
                    />
                  </div>
                  <div>
                    <Label>Admin Email</Label>
                    <Input
                      type="email"
                      value={formData.admin_email}
                      onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                      placeholder="e.g., admin@school.edu"
                    />
                  </div>
                  <div>
                    <Label>Admin Password</Label>
                    <Input
                      type="password"
                      value={formData.admin_password}
                      onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                      placeholder="Set school admin password"
                    />
                  </div>
                </div>

                {error && <div className="text-red-500 text-sm">{error}</div>}
                <Button type="submit" className="w-full">
                  Create School
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {schools.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No schools found. Create one to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">School Name</th>
                  <th className="text-left py-2 px-2">Email</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schools &&
                  schools.length > 0 &&
                  schools.map((school) => (
                    <tr key={school.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-2 px-2">{school.name}</td>
                      <td className="py-2 px-2">{school.email}</td>
                      <td className="py-2 px-2">
                        <span
                          className={`px-2 py-1 rounded text-xs transition-colors ${
                            school.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {school.status ? school.status.charAt(0).toUpperCase() + school.status.slice(1) : "N/A"}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleSuspend(school.id, school.status)}
                          className={
                            school.status === "active"
                              ? "text-red-500 hover:text-red-700"
                              : "text-green-500 hover:text-green-700"
                          }
                        >
                          {school.status === "active" ? "Suspend" : "Unsuspend"}
                        </Button>
                      </td>
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
