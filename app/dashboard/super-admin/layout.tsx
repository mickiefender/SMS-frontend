"use client"

import { ProtectedRoute } from "@/lib/protected-route"
import { PlatformSidebar } from "@/components/super-admin/platform-sidebar"
import { PlatformTopbar } from "@/components/super-admin/platform-topbar"

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["super_admin"]}>
      <div className="sa-theme min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen">
          <PlatformSidebar />
          <div className="flex-1 min-w-0 flex flex-col">
            <PlatformTopbar />
            <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
