"use client"

import { FeesManagement } from "@/components/fees-management"
import { ProtectedRoute } from "@/lib/protected-route"

export default function BillingPage() {
  return (
    <ProtectedRoute allowedRoles={["school_admin"]}>
      <div className="p-4 md:p-6">
        <FeesManagement />
      </div>
    </ProtectedRoute>
  )
}