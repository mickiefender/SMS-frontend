"use client"

import { ProtectedRoute } from "@/lib/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SchoolsManagement } from "@/components/schools-management"
import { useState, useEffect } from "react"
import { schoolsAPI } from "@/lib/api"
import { LoadingWrapper } from "@/components/loading-wrapper"

import { LoadingWrapper } from "@/components/loading-wrapper"

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState("schools")
  const [stats, setStats] = useState({ totalSchools: 0, activeSubscriptions: 0, monthlyRevenue: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const schoolsRes = await schoolsAPI.list()
      const schools = schoolsRes.data.results || schoolsRes.data
      const activeCount = schools.filter((s: any) => s.is_active).length

      setStats({
        totalSchools: schools.length,
        activeSubscriptions: activeCount,
        monthlyRevenue: activeCount * 650,
      })
    } catch (err) {
      console.log("[v0] Error fetching stats:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["super_admin"]}>
      <LoadingWrapper isLoading={loading}>
        <div className="p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage schools, plans, and billing</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalSchools}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("schools")}
                className={`px-4 py-2 rounded ${activeTab === "schools" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                Schools
              </button>
              <button
                onClick={() => setActiveTab("billing")}
                className={`px-4 py-2 rounded ${activeTab === "billing" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                Billing
              </button>
            </div>

            {activeTab === "schools" && <SchoolsManagement />}
            {activeTab === "billing" && (
              <Card>
                <CardHeader>
                  <CardTitle>Billing & Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Billing management coming soon</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </LoadingWrapper>
    </ProtectedRoute>
  )
}
