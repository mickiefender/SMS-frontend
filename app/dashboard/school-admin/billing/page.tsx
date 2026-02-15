"use client"

import { FeesManagement } from "@/components/fees-management"
import { AssignFees } from "@/components/assign-fees"
import { ProtectedRoute } from "@/lib/protected-route"

export default function BillingPage() {
  return (
    <ProtectedRoute allowedRoles={["school_admin"]}>
      <div className="space-y-6 p-4 md:p-6">
        <h1 className="text-2xl font-bold">Billing Management</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <FeesManagement />
          </div>
          <div>
            <AssignFees />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
