"use client"

import { useAuthContext } from "@/lib/auth-context"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

const navItems = {
  super_admin: [
    { label: "Dashboard", href: "/dashboard/super-admin", icon: "📊" },
    { label: "Schools", href: "/dashboard/super-admin#schools", icon: "🏫" },
    { label: "Billing", href: "/dashboard/super-admin#billing", icon: "💳" },
  ],
  school_admin: [
    { label: "Dashboard", href: "/dashboard/school-admin", icon: "📊" },
    { label: "Students", href: "/dashboard/school-admin#students", icon: "👨‍🎓" },
    { label: "Teachers", href: "/dashboard/school-admin#teachers", icon: "👨‍🏫" },
    { label: "Academics", href: "/dashboard/school-admin#academics", icon: "📚" },
  ],
  teacher: [
    { label: "Dashboard", href: "/dashboard/teacher", icon: "📊" },
    { label: "Attendance", href: "/dashboard/teacher#attendance", icon: "✓" },
    { label: "Grades", href: "/dashboard/teacher#grades", icon: "📝" },
    { label: "Assignments", href: "/dashboard/teacher#assignments", icon: "📋" },
  ],
  student: [
    { label: "Dashboard", href: "/dashboard/student", icon: "📊" },
    { label: "Grades", href: "/dashboard/student#grades", icon: "📊" },
    { label: "Attendance", href: "/dashboard/student#attendance", icon: "📅" },
    { label: "Assignments", href: "/dashboard/student#assignments", icon: "📝" },
  ],
}

export function SidebarNav() {
  const { user, logout } = useAuthContext()
  const pathname = usePathname()

  if (!user) return null

  const items = navItems[user.role as keyof typeof navItems] || []

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground">SchoolHub</h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1">Management System</p>
      </div>

      <nav className="p-4 space-y-2">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <button
              className={`w-full text-left px-4 py-2 rounded transition-colors ${
                pathname.includes(item.href.split("#")[0])
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "hover:bg-sidebar-accent"
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </button>
          </Link>
        ))}
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <Button variant="outline" onClick={logout} className="w-full bg-transparent">
          Logout
        </Button>
      </div>
    </aside>
  )
}
