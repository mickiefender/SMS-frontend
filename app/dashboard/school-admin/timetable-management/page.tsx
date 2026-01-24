"use client"

import { ProtectedRoute } from "@/lib/protected-route"
import { CustomTimetableBuilder } from "@/components/custom-timetable-builder"
import { useAuthContext } from "@/lib/auth-context"

export default function TimetableManagementPage() {
  const { user } = useAuthContext()

  return (
    <ProtectedRoute allowedRoles={["school_admin"]}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">School Timetable Management</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage school timetables, class schedules, and subject assignments
          </p>
        </div>

        <CustomTimetableBuilder />
      </div>
    </ProtectedRoute>
  )
}
