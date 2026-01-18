"use client"

import { useAuthContext } from "@/lib/auth-context"
import { usePathname } from "next/navigation"
import Link from "next/link"

const navItems = {
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

export function MobileBottomNav() {
  const { user } = useAuthContext()
  const pathname = usePathname()

  if (!user) return null

  const items = navItems[user.role as keyof typeof navItems] || []

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border">
      <div className="flex justify-around items-center h-16">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <button
              className={`flex flex-col items-center justify-center w-full h-16 text-xs transition-colors ${
                pathname.includes(item.href.split("#")[0])
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          </Link>
        ))}
      </div>
    </nav>
  )
}
