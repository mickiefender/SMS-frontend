"use client"

import { ProtectedRoute } from "@/lib/protected-route"
import { SchoolProfileSetup } from "@/components/school-profile-setup"

export default function SchoolAdminSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={["school_admin"]}>
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a3a52]">School Profile Settings</h1>
          <p className="text-muted-foreground">Manage your school information and logo</p>
        </div>
        
        <SchoolProfileSetup />
      </div>
    </ProtectedRoute>
  )
}

