"use client"

import { useAuthContext } from "@/lib/auth-context"
import { redirect } from "next/navigation"

export default function DashboardPage() {
  const { user, loading } = useAuthContext()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    redirect("/auth/login")
  }

  // Redirect to role-specific dashboard
  const roleRoutes: Record<string, string> = {
    super_admin: "/dashboard/super-admin",
    school_admin: "/dashboard/school-admin",
    teacher: "/dashboard/teacher",
    student: "/dashboard/student",
  }

  const route = roleRoutes[user.role]
  if (route) {
    redirect(route)
  }

  return (
    <div>
      <h1>Dashboard</h1>
    </div>
  )
}
