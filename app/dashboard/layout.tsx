"use client"

import type React from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { TopBar } from "@/components/top-bar"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { ProtectedRoute } from "@/lib/protected-route"
import { NotificationProvider } from "@/lib/notifications-context"
import { MobileToggleProvider } from "@/lib/mobile-toggle-context"
import { useAuthContext } from "@/lib/auth-context"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"


function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext()
  const pathname = usePathname()
  // Super-admin has its own platform shell (sidebar + topbar); skip this legacy chrome.
  const isSuperAdminRoute = pathname?.startsWith("/dashboard/super-admin") ?? false
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const toggleSidebar = () => {
    console.log("Toggling sidebar collapse");
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const toggleUnified = () => {
    console.log("Hamburger clicked", { isDesktop });
    if (isDesktop) {
      toggleSidebar()
    } else {
      const newOpen = !mobileOpen
      setMobileOpen(newOpen)
      // Toggle body class for global mobile sidebar state
      if (typeof document !== 'undefined') {
        if (newOpen) {
          document.body.classList.add('mobile-sidebar-open')
        } else {
          document.body.classList.remove('mobile-sidebar-open')
        }
      }
    }
  }

  return (
    <NotificationProvider userId={user?.id}>
      <MobileToggleProvider toggleSidebar={toggleUnified}>
        <div className="relative flex h-screen bg-background dark:bg-slate-950 overflow-hidden">
          {/* Gradient-mesh background: drifting blurred blobs the glass panels refract */}
          <div className="dashboard-bg" aria-hidden="true">
            <div className="dashboard-blob dashboard-blob-1" />
            <div className="dashboard-blob dashboard-blob-2" />
            <div className="dashboard-blob dashboard-blob-3" />
          </div>

          {!isSuperAdminRoute && (
            <>
              {/* Desktop Sidebar - Flex item that can collapse */}
              <div
                className={`relative z-10 hidden lg:block transition-all duration-300 ease-in-out ${sidebarCollapsed ? "w-20" : "w-72"}`}
              >
                <SidebarNav isCollapsed={sidebarCollapsed} />
              </div>

              {/* Mobile Sidebar - Full screen overlay */}
              {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-50">
                  {/* Backdrop */}
                  <div 
                    className="absolute inset-0 bg-black/50"
                    onClick={() => setMobileOpen(false)}
                  />
                  {/* Sidebar */}
                  <div className="absolute left-0 top-0 h-[100dvh] w-[85%] max-w-[320px] bg-slate-900 shadow-2xl overflow-y-auto overflow-x-hidden">
                    <SidebarNav isMobile={true} onClose={() => setMobileOpen(false)} />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Main Content - Flexes to fill remaining space */}
          <div className="relative z-10 flex-1 flex flex-col min-w-0 h-screen overflow-hidden lg:pb-0 pb-20">
            {/* Top Bar - includes hamburger for mobile */}
            {!isSuperAdminRoute && <TopBar onToggle={toggleUnified} />}

            {/* Main Content - transparent so the mesh background shows through the glass */}
            <main className="flex-1 overflow-auto">
              {children}
            </main>

            {/* Mobile Bottom Nav */}
            {!isSuperAdminRoute && <MobileBottomNav />}
          </div>
        </div>
      </MobileToggleProvider>
    </NotificationProvider>
  )

}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <DashboardContent>{children}</DashboardContent>
    </ProtectedRoute>
  )
}
