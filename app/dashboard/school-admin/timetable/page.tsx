"use client"

import { ModernTimetable } from "@/components/modern-timetable"
import { ProtectedRoute } from "@/lib/protected-route"

export default function TimetablePage() {
  return (
    <ProtectedRoute allowedRoles={["school_admin"]}>
      <div className="space-y-6">
        <ModernTimetable />
      </div>
    </ProtectedRoute>
  )
}
