"use client"

import type React from "react"

import { SidebarNav } from "@/components/sidebar-nav"
import { TopBar } from "@/components/top-bar"
import { ProtectedRoute } from "@/lib/protected-route"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <SidebarNav />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
