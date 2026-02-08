"use client"

import { useAuthContext } from "@/lib/auth-context"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import {
  ChevronDown,
  LayoutDashboard,
  Settings,
  Users,
  User,
  HeartHandshake,
  BookOpen,
  School,
  Book,
  Clock,
  Calendar,
  ClipboardEdit,
  Wrench,
  CheckSquare,
  FileText,
  Bus,
  Home,
  Megaphone,
  MessageSquare,
  Library,
  UserCircle,
  BookUser,
  BarChart,
  ClipboardCheck,
  FilePen,
  UploadCloud,
  MessageCircle,
  DollarSignIcon,
  CreditCard,
  Bell,
} from "lucide-react"

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

type NavSection = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  items?: NavItem[]
  href?: string
}

const navSections: Record<string, NavSection[]> = {
  school_admin: [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard/school-admin",
    },
    {
      label: "Admin",
      icon: Settings,
      items: [
         { label: "Admin Staff Management", href: "/dashboard/school-admin/manage-admin-staff", icon: Users },
        { label: "Students", href: "/dashboard/school-admin/students", icon: Users },
        { label: "Teachers", href: "/dashboard/school-admin/teachers", icon: User },
        
      ],
    },
    {
    label: "Finance",
      icon: CreditCard,
      items: [
        { label: "Billing", href: "/dashboard/school-admin/billing", icon: CreditCard },
        { label: "Payments", href: "/dashboard/school-admin/payments", icon: CreditCard }, { label: "Receipts", href: "/dashboard/school-admin/receipts", icon: BookUser },
        { label: "Expenses", href: "/dashboard/school-admin/expenses", icon: FileText },
      ],
      },
    {
      label: "Academics",
      icon: BookOpen,
      items: [
        { label: "Class", href: "/dashboard/school-admin/classes", icon: School },
        { label: "Subject", href: "/dashboard/school-admin/subjects", icon: Book },
        { label: "Class Routine", href: "/dashboard/school-admin/routine", icon: Clock },
        { label: "Timetable", href: "/dashboard/school-admin/timetable", icon: Calendar },
        { label: "Grading", href: "/dashboard/school-admin/grading", icon: ClipboardEdit },
      ],
    },
    {
      label: "Operations",
      icon: Wrench,
      items: [
        { label: "Attendance", href: "/dashboard/school-admin/attendance", icon: CheckSquare },
        { label: "Exam", href: "/dashboard/school-admin/exam", icon: FileText },
        { label: "Transport", href: "/dashboard/school-admin/transport", icon: Bus },
        { label: "Hostel", href: "/dashboard/school-admin/hostel", icon: Home },
        { label: "Student Assignment", href: "/dashboard/school-admin/student-assignment", icon: ClipboardCheck},
        { label: "Teacher Assignment", href: "/dashboard/school-admin/teacher-assignment", icon: FilePen },
      ],
    },
    {
      label: "Communication",
      icon: MessageCircle,
      items: [
        { label: "Announcement", href: "/dashboard/school-admin/announcement", icon: Megaphone },
        { label: "Message", href: "/dashboard/school-admin/messaging", icon: MessageSquare },
        { label: "News", href: "/dashboard/school-admin/news", icon: BookOpen },
      ],
    },
    {
   label: "Library",
      icon: Library,
      items: [
        { label: "Books", href: "/dashboard/school-admin/library/books", icon: Book },
        { label: "Issued Books", href: "/dashboard/school-admin/library/issued-books", icon: BookUser },
        { label: "Categories", href: "/dashboard/school-admin/library/categories", icon: BookOpen },
      ],
    },
    {
      label: "Profile Pictures",
      icon: UserCircle,
      items: [
        { label: "Teachers", href: "/dashboard/school-admin/profile-pictures/teachers", icon: User },
        { label: "Students", href: "/dashboard/school-admin/profile-pictures/students", icon: Users },
      ],

    }
  ],
  
  teacher: [
    {
      label: "Dashboard",
      icon: ClipboardEdit,
      href: "/dashboard/teacher",
    },
    {
      label: "My Profile",
      icon: UserCircle,
      href: "/dashboard/teacher/profile",
    },
    {
      label: "Teaching",
      icon: User,
      items: [
        { label: "Overview", href: "/dashboard/teacher", icon: User },
        { label: "My Classes", href: "/dashboard/teacher/my-classes", icon: School },
        { label: "Attendance", href: "/dashboard/teacher/attendance", icon: CheckSquare },
        { label: "Grades", href: "/dashboard/teacher/grades", icon: ClipboardEdit },
        { label: "Assignments", href: "/dashboard/teacher/assignments", icon: ClipboardCheck },
        { label: "Submissions", href: "/dashboard/teacher/submissions", icon: BookOpen },
        { label: "Performance", href: "/dashboard/teacher/performance", icon: BarChart},
        { label: "Materials", href: "/dashboard/teacher/materials", icon: UploadCloud },
        { label: "Messages", href: "/dashboard/teacher/messages", icon: MessageCircle },
        { label: "Notifications", href: "/dashboard/teacher/notifications", icon: Bell },
      ],
    },
  ],
  student: [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard/student",
      items: [
        { label: "Overview", href: "/dashboard/student", icon: LayoutDashboard },
         { label: "Profile", href: "/dashboard/student/profile", icon: User },
        { label: "Enrollment", href: "/dashboard/student/enrollment", icon: FilePen },
        { label: "Timetable", href: "/dashboard/student/timetable", icon: Calendar },
        {label: "Notifications", href: "/dashboard/student/notifications", icon: Bell},
        { label: "My Classes", href: "/dashboard/student/my-classes", icon: School },
        { label: "Attendance", href: "/dashboard/student/attendance", icon: CheckSquare },
        { label: "Grades", href: "/dashboard/student/results", icon: BarChart }, 
        { label: "Assignments", href: "/dashboard/student/assignments", icon: ClipboardCheck },
      ],
    },
    
  ],
}

export function SidebarNav() {
  const { user, logout, school, loading } = useAuthContext()
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["Dashboard"]))

  if (!user) return null

  const sections = navSections[user.role as keyof typeof navSections] || []

  const toggleSection = (label: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(label)) {
      newExpanded.delete(label)
    } else {
      newExpanded.add(label)
    }
    setExpandedSections(newExpanded)
  }

  const schoolName = loading ? "Loading..." : school?.name || "School Name"
  const schoolInitial = loading ? "" : school?.name.charAt(0) || "S"

  return (
    <aside className="w-64 bg-gradient-to-b from-[#1a3a52] to-[#0f2438] border-r border-[#ffc107]/20 h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[#ffc107]/20">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-[#ffc107] rounded-lg flex items-center justify-center font-bold text-[#1a3a52]">
            {schoolInitial}
          </div>
          <h1 className="text-xl font-bold text-white">{schoolName}</h1>
        </div>
        <p className="text-xs text-[#ffc107]/80">School Management</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.label)
          const isActive = section.href && pathname.includes(section.href.split("#")[0])
          const Icon = section.icon

          if (!section.items) {
            // Direct link section
            return (
              <Link key={section.label} href={section.href || "#"}>
                <button
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                    isActive
                      ? "bg-[#ffc107] text-[#1a3a52] font-semibold"
                      : "text-[#e0e0e0] hover:bg-[#ffc107]/10 hover:text-[#ffc107]"
                  }`}
                >
                  <Icon className="text-lg" />
                  <span>{section.label}</span>
                </button>
              </Link>
            )
          }

          // Expandable section
          return (
            <div key={section.label}>
              <button
                onClick={() => toggleSection(section.label)}
                className="w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between gap-3 text-[#e0e0e0] hover:bg-[#ffc107]/10 hover:text-[#ffc107]"
              >
                <div className="flex items-center gap-3">
                  <Icon className="text-lg" />
                  <span className="font-medium">{section.label}</span>
                </div>
                <ChevronDown size={18} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </button>

              {/* Submenu Items */}
              {isExpanded && section.items && (
                <div className="ml-4 mt-1 space-y-1 border-l border-[#ffc107]/20 pl-0">
                  {section.items.map((item) => {
                    const ItemIcon = item.icon
                    return (
                      <Link key={item.href} href={item.href}>
                        <button
                          className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                            pathname.includes(item.href.split("#")[0])
                              ? "bg-[#ffc107]/20 text-[#ffc107] font-medium"
                              : "text-[#b0b0b0] hover:text-[#ffc107] hover:bg-[#ffc107]/10"
                          }`}
                        >
                          <ItemIcon className="ml-2" />
                          <span>{item.label}</span>
                        </button>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#ffc107]/20">
        <Button onClick={logout} className="w-full bg-[#ffc107] text-[#1a3a52] hover:bg-[#ffc107]/90 font-semibold">
          Logout
        </Button>
      </div>
    </aside>
  )
}