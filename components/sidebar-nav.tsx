"use client"

import { useAuthContext } from "@/lib/auth-context"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { academicsAPI, bgFetch } from "@/lib/api"
import {
  ChevronLeft,
  LayoutDashboard,
  Settings,
  Users,
  User,
  BookOpen,
  School,
  Book,
  Calendar,
  ClipboardEdit,
  Wrench,
  CheckSquare,
  FileText,
  Bus,
  Home,
  Library,
  UserCircle,
  BookUser,
  BarChart,
  ClipboardCheck,
  FilePen,
  UploadCloud,
  MessageCircle,
  Newspaper,
  DollarSignIcon,
  CreditCard,
  Bell,
  Search,
  X,
  Shield,
  ClipboardList,
  Sparkles,
  Megaphone,
  ArrowRightLeft,
} from "lucide-react"

import { NAV_LINK_PERMISSIONS } from "@/lib/permissions"
import { iconsMap } from "@/components/icons-map"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

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
  super_admin: [
    {
      label: "Super Admin",
      icon: Shield,
      items: [
        { label: "Super Admin Home", href: "/dashboard/super-admin", icon: LayoutDashboard },
        { label: "Schools & Usage", href: "/dashboard/super-admin#schools-usage", icon: School },
        { label: "School Onboarding", href: "/dashboard/super-admin/onboarding", icon: School },
        { label: "Global Users", href: "/dashboard/super-admin#global-users", icon: Users },
        { label: "Subscriptions & Billing", href: "/dashboard/super-admin#billing", icon: CreditCard },
        { label: "Analytics & Reports", href: "/dashboard/super-admin#analytics", icon: BarChart },
      ],
    },
  ],
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
        { label: "Student Assignment", href: "/dashboard/school-admin/student-assignment", icon: ClipboardCheck },
        { label: "Teacher Assignment", href: "/dashboard/school-admin/teacher-assignment", icon: FilePen },
        { label: "School Profile", href: "/dashboard/school-admin/settings", icon: Settings },
      ],
    },
    {
      label: "Academics",
      icon: BookOpen,
      items: [
        { label: "Class", href: "/dashboard/school-admin/classes", icon: School },
        { label: "Subject", href: "/dashboard/school-admin/subjects", icon: Book },
        { label: "Timetable", href: "/dashboard/school-admin/timetable", icon: Calendar },
        { label: "Student Promotion", href: "/dashboard/school-admin/promotion", icon: ArrowRightLeft },
        { label: "Grading", href: "/dashboard/school-admin/grading", icon: ClipboardEdit },
        { label: "Attendance", href: "/dashboard/school-admin/attendance", icon: CheckSquare },
        { label: "Exam", href: "/dashboard/school-admin/exam", icon: FileText },
      ],
    },
    {
      label: "Results",
      icon: BarChart,
      items: [
        { label: "Examination", href: "/dashboard/school-admin/results/examination", icon: ClipboardEdit },
        { label: "Report Cards", href: "/dashboard/school-admin/results/report-cards", icon: FileText },
        { label: "Export Results", href: "/dashboard/school-admin/results/export", icon: FileText },
        { label: "Report Templates", href: "/dashboard/school-admin/results/templates", icon: FileText },
      ],
    },
    {
      label: "Finance",
      icon: CreditCard,
      items: [
        { label: "Manage Types", href: "/dashboard/school-admin/manage-fees", icon: CreditCard },
        { label: "Collect Fees", href: "/dashboard/school-admin/collect-fees", icon: DollarSignIcon },
        { label: "Payments", href: "/dashboard/school-admin/payments", icon: CreditCard },
        { label: "Withdrawals", href: "/dashboard/school-admin/withdrawals", icon: DollarSignIcon },
        { label: "Receipts", href: "/dashboard/school-admin/receipts", icon: BookUser },
        { label: "Expenses", href: "/dashboard/school-admin/expenses", icon: FileText },
      ],
    },
    {
      label: "Operations",
      icon: Wrench,
      items: [
        { label: "Transport", href: "/dashboard/school-admin/transport", icon: Bus },
        { label: "Hostel", href: "/dashboard/school-admin/hostel", icon: Home },
      ],
    },
    {
      label: "Communication",
      icon: MessageCircle,
      items: [
        { label: "Announcements", href: "/dashboard/school-admin/announcements", icon: Megaphone },
        { label: "Notices", href: "/dashboard/school-admin/manage-notices", icon: Bell },
        { label: "News", href: "/dashboard/school-admin/news", icon: Newspaper },
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
  ],
  admin_staff: [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard/admin-staff",
    },
    {
      label: "Profile",
      icon: UserCircle,
      href: "/dashboard/admin-staff/profile",
    },
    {
      label: "Permissions",
      icon: Shield,
      href: "/dashboard/admin-staff/permissions",
    },
    {
      label: "My Tasks",
      icon: ClipboardList,
      items: [
        { label: "Quick Actions", href: "/dashboard/admin-staff/tasks", icon: ClipboardCheck },
      ],
    },
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
        { label: "Ai Chat", href: "/dashboard/teacher/ai-assistant", icon: Sparkles },
        { label: "Submissions", href: "/dashboard/teacher/submissions", icon: BookOpen },
        { label: "Performance", href: "/dashboard/teacher/performance", icon: BarChart },
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
      items: [
        { label: "Overview", href: "/dashboard/student", icon: LayoutDashboard },
        { label: "AI Chat", href: "/dashboard/student/ai-chat", icon: Sparkles },
        { label: "Fees & Payments", href: "/dashboard/student/fees", icon: DollarSignIcon },
        { label: "Timetable", href: "/dashboard/student/timetable", icon: Calendar },
        { label: "Notifications", href: "/dashboard/student/notifications", icon: Bell },
        { label: "Attendance", href: "/dashboard/student/attendance", icon: CheckSquare },
        { label: "Grades", href: "/dashboard/student/results", icon: BarChart },
        { label: "Assignments", href: "/dashboard/student/assignments", icon: ClipboardCheck },
        { label: "Documents", href: "/dashboard/student/documents", icon: FileText },
      ],
    },
  ],
}

/**
 * Icon for each permission id — used to render admin-staff nav items
 * generated from their assigned permissions.
 */
const PERMISSION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  manage_admins: Users,
  manage_students: Users,
  manage_teachers: User,
  manage_student_assignment: ClipboardCheck,
  manage_teacher_assignment: FilePen,
  manage_school_profile: Settings,
  manage_classes: School,
  manage_subjects: Book,
  manage_timetable: Calendar,
  manage_grades: ClipboardEdit,
  manage_attendance: CheckSquare,
  manage_exams: FileText,
  view_performance: BarChart,
  export_results: FileText,
  manage_report_templates: FileText,
  manage_grading_policy: ClipboardEdit,
  manage_fees: CreditCard,
  collect_fees: DollarSignIcon,
  view_payments: CreditCard,
  manage_withdrawals: DollarSignIcon,
  manage_expenses: FileText,
  view_fees: BookUser,
  manage_transport: Bus,
  manage_hostel: Home,
  manage_news: Newspaper,
  manage_materials: Book,
  manage_issued_books: BookUser,
  manage_library_categories: BookOpen,
}

/** Category header icons for grouped permission sections. */
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Admin: Settings,
  Academics: BookOpen,
  Results: BarChart,
  Finance: CreditCard,
  Operations: Wrench,
  Communication: MessageCircle,
  Library: Library,
}

/**
 * Build the admin-staff nav sections from their assigned permissions:
 * core links (Dashboard / Profile / Permissions / My Tasks) plus one
 * section per permission category, mirroring how the school-admin
 * dashboard sidebar groups its items.
 */
function buildAdminStaffSections(perms: string[]): NavSection[] {
  const coreSections: NavSection[] = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard/admin-staff",
    },
    {
      label: "Profile",
      icon: UserCircle,
      href: "/dashboard/admin-staff/profile",
    },
    {
      label: "Permissions",
      icon: Shield,
      href: "/dashboard/admin-staff/permissions",
    },
    {
      label: "My Tasks",
      icon: ClipboardList,
      items: [
        { label: "Quick Actions", href: "/dashboard/admin-staff/tasks", icon: ClipboardCheck },
      ],
    },
  ]

  const grouped = new Map<string, NavItem[]>()
  for (const perm of NAV_LINK_PERMISSIONS) {
    if (perm.category === "Admin Staff") continue
    if (!perms.includes(perm.id)) continue
    const items = grouped.get(perm.category) ?? []
    items.push({
      label: perm.label,
      href: perm.href,
      icon: PERMISSION_ICONS[perm.id] ?? iconsMap.FileText ?? FileText,
    })
    grouped.set(perm.category, items)
  }

  return [
    ...coreSections,
    ...Array.from(grouped.entries()).map(([category, items]) => ({
      label: category,
      icon: CATEGORY_ICONS[category] ?? Wrench,
      items,
    })),
  ]
}

interface SidebarNavProps {
  isCollapsed?: boolean
  onClose?: () => void
  isMobile?: boolean
  onToggleCollapse?: () => void
}

import { AuthBoundary } from "@/components/auth-boundary"

export function SidebarNav({ isCollapsed = false, onClose, isMobile = false, onToggleCollapse }: SidebarNavProps) {
  return (
    <AuthBoundary>
      <SidebarNavContent
        isCollapsed={isCollapsed}
        onClose={onClose}
        isMobile={isMobile}
        onToggleCollapse={onToggleCollapse}
      />
    </AuthBoundary>
  )
}

interface SidebarNavContentProps {
  isCollapsed: boolean
  onClose?: () => void
  isMobile: boolean
  onToggleCollapse?: () => void
}

function SidebarNavContent({ isCollapsed, onClose, isMobile, onToggleCollapse }: SidebarNavContentProps) {
  const { user, logout, school, loading } = useAuthContext()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")
  const [profilePic, setProfilePic] = useState<string>("")
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)

  useEffect(() => {
    const fetchProfilePic = async () => {
      if (!user?.id) return
      try {
        const picRes = await bgFetch.get(`/academics/profile-pictures/?user=${user.id}`)
        const pics = picRes.data.results || picRes.data || []
        if (pics.length > 0) {
          const picUrl = pics[0].display_url || pics[0].storage_url || pics[0].picture || ""
          setProfilePic(picUrl)
        }
      } catch (err) {
        // silent
      }
    }
    fetchProfilePic()
  }, [user?.id])

  if (!user || loading) return null

  // Permission-based filtering for admin staff roles
  const userPerms = user.permissions || []
  const isAdminStaff = ['academic_admin', 'exam_officer', 'finance_officer', 'ct_admin_support'].includes(user.role || '')

  // Admin staff: build nav directly from assigned permissions (grouped by
  // category like the school-admin sidebar). Other roles use static sections.
  const sections = isAdminStaff
    ? buildAdminStaffSections(userPerms)
    : navSections[user.role as keyof typeof navSections] || []

  const permissionFilteredSections = sections.map(section => ({
    ...section,
    items: section.items?.filter(item => {
      // Always allow dashboard/admin core for school_admin
      if (user.role === 'school_admin') return true
      // Admin staff: filter by permissions
      if (isAdminStaff) {
        // Exact match by href from NAV_LINK_PERMISSIONS
        const hrefMatch = NAV_LINK_PERMISSIONS.find(p => p.href === item.href)
        if (hrefMatch && userPerms.includes(hrefMatch.id as any)) return true

        // Fallback heuristic
        const itemId = item.href.split('/').pop()?.replace(/-/g, '_') || ''
        return userPerms.includes(itemId) ||
               userPerms.includes('view_' + itemId)
      }
      return true
    })
  }))

  // Filter sections based on search + permissions - always show core admin_staff sections
  const filteredSections = searchQuery
    ? permissionFilteredSections.map(section => ({
        ...section,
        items: section.items?.filter(
          item => item.label.toLowerCase().includes(searchQuery.toLowerCase())
        ) || []
      })).filter(section =>
        section.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (section.items?.length ?? 0) > 0 ||
        // Always show core admin_staff sections
        (isAdminStaff && ['Dashboard', 'Profile', 'Permissions', 'My Tasks'].includes(section.label))
      )
    : permissionFilteredSections.filter(section =>
        !(section.items && section.items.length === 0) ||
        // Always show core admin_staff sections even if filtered items empty
        (isAdminStaff && ['Dashboard', 'Profile', 'Permissions', 'My Tasks'].includes(section.label))
      )

  const schoolName = school?.name || "School Name"

  const schoolLogoUrl = school?.logo_url || school?.logo_url_computed
  const schoolInitial = school?.name?.charAt(0) || "S"

  const isIconOnly = isCollapsed && !isMobile

  return (
    <aside
      className={`
        relative flex flex-col overflow-hidden
        ring-1 ring-inset ring-white/10
        transition-all duration-300 ease-in-out
        ${isMobile ? "h-[100dvh] w-full shadow-2xl border-r-0" : `h-screen border-r border-black/40 ${isCollapsed ? "w-20" : "w-72"}`}
      `}
      style={{
        background: "linear-gradient(180deg, #991b1b 0%, #5a0d0d 45%, #1a0404 80%, #000000 100%)",
        "--sidebar-foreground-computed": "#f8fafc",
        "--sidebar-primary": "#f87171",
        "--sidebar-border": "rgba(255, 255, 255, 0.12)",
      } as React.CSSProperties}
    >
      {/* Liquid-glass glow accents */}
      <div className="pointer-events-none absolute -z-10 -top-24 -left-16 h-64 w-64 rounded-full blur-3xl opacity-80" style={{ backgroundColor: "var(--sidebar-glow-primary)" }} />
      <div className="pointer-events-none absolute -z-10 bottom-0 -right-20 h-72 w-72 rounded-full blur-3xl opacity-70" style={{ backgroundColor: "var(--sidebar-glow-secondary)" }} />
      <div className="pointer-events-none absolute -z-10 inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />

      {/* Header */}
      <div className={`
relative h-16 px-4 flex items-center justify-between
        ${isIconOnly ? "justify-center px-2 gap-0" : "gap-3"}
      `}>
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground-computed/70 hover:text-sidebar-foreground-computed transition-colors"
          >
            <X size={20} />
          </button>
        )}

        {schoolLogoUrl ? (
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-sidebar-primary/10 shadow-lg">
            <img
              src={schoolLogoUrl}
              alt={school?.name || "School"}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 ring-1 ring-white/20 rounded-xl flex items-center justify-center font-bold text-sidebar-primary-foreground flex-shrink-0 shadow-lg shadow-sidebar-primary/30">
            {schoolInitial}
          </div>
        )}

        {!isIconOnly ? (
          <>
            <div className="min-w-0 flex-1 pt-1">
              <h1 className="text-base font-bold text-sidebar-foreground-computed truncate">{schoolName}</h1>
              <p className="text-xs text-sidebar-foreground-computed/60">School Management</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sidebar-primary/60 to-transparent"></div>
          </>
        ) : null}
      </div>

      {/* Search Bar */}
      {!isIconOnly ? (
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sidebar-foreground-computed/50" size={16} />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}

              className="w-full bg-white/10 backdrop-blur-sm border border-white/15 rounded-lg pl-9 pr-4 py-2 text-sm text-sidebar-foreground-computed placeholder:text-sidebar-foreground-computed/50 focus:outline-none focus:ring-2 focus:ring-sidebar-ring/50 focus:border-sidebar-ring/50 transition-all"

            />
          </div>
        </div>
      ) : null}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-sidebar-accent scrollbar-track-transparent">
        {isAdminStaff && (
          <div>
            <button
              onClick={() => setShowPermissionsDialog(true)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200

                text-sidebar-foreground-computed/70 hover:bg-white/10 hover:text-sidebar-foreground-computed group

                ${isIconOnly ? "justify-center" : ""}
              `}
            >
              <Shield className="w-4 h-4 flex-shrink-0 text-sidebar-foreground-computed/60 group-hover:text-sidebar-foreground-computed" />
              {!isIconOnly ? (
                <>
                  <span className="font-medium text-sm flex-1 text-left truncate">My Permissions</span>
                  <div className="flex items-center gap-1 bg-sidebar-primary/20 text-sidebar-primary text-xs px-2 py-0.5 rounded-full font-medium">
                    {userPerms.length}
                  </div>
                </>
              ) : (
                <div className="w-5 h-5 bg-sidebar-primary/20 text-sidebar-primary text-xs rounded-full flex items-center justify-center font-medium">
                  {userPerms.length}
                </div>
              )}
            </button>
          </div>
        )}
        {filteredSections.map((section) => {
          const Icon = section.icon
          const hasItems = section.items && section.items.length > 0

          /* ── Simple link (no children) ─────────────────────────── */
          if (!hasItems) {
            const isActive = pathname === section.href || (section.href && pathname.startsWith(section.href))
            return (
              <Link key={section.label} href={section.href || "#"} onClick={isMobile ? onClose : undefined}>
                <div
                  title={isIconOnly ? section.label : undefined}
                    className={`
                    group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                    ${isActive
                      ? "text-sidebar-foreground-computed"
                      : "text-sidebar-foreground-computed/70 hover:bg-white/10 hover:text-sidebar-foreground-computed"
                    }
                    ${isIconOnly ? "justify-center" : ""}
                  `}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-sidebar-primary" : "text-sidebar-foreground-computed/60 group-hover:text-sidebar-foreground-computed"}`} />
                  {!isIconOnly ? (
                    <span className="font-medium text-[15px] truncate">{section.label}</span>
                  ) : null}
                </div>
              </Link>
            )
          }

          /* ── Category with permanently visible sub-links ───────── */
          return (
            <div key={section.label}>
              {/* Category header */}
              <div
                title={isIconOnly ? section.label : undefined}
                className={`
                  flex items-center gap-3 px-3 pb-1.5
                  ${isIconOnly ? "justify-center pt-1" : ""}
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0 text-sidebar-primary/90" />
                {!isIconOnly ? (
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground-computed/50 truncate">
                    {section.label}
                  </span>
                ) : null}
              </div>

              {/* Divider under the category header */}
              {!isIconOnly && (
                <div className="ml-10 h-px bg-gradient-to-r from-white/15 to-transparent mb-1.5" />
              )}

              {/* Sub-links — always rendered, no click needed */}
              <div className={isIconOnly ? "space-y-1" : "ml-3 space-y-0.5 border-l border-white/10 pl-3"}>
                {section.items?.map((item) => {
                  const ItemIcon = item.icon
                  const isItemActive = pathname.includes(item.href.split("#")[0])
                  return (
                    <Link key={item.href} href={item.href} onClick={isMobile ? onClose : undefined}>
                      <div
                        title={isIconOnly ? item.label : undefined}
                        className={`
                          group relative flex items-center gap-3 px-3 py-2 rounded-lg text-[15px] transition-all duration-200
                          ${isItemActive
                            ? "bg-sidebar-primary/15 backdrop-blur-sm text-sidebar-primary font-medium ring-1 ring-sidebar-primary/30"
                            : "text-sidebar-foreground-computed/60 hover:text-sidebar-foreground-computed hover:bg-white/10"
                          }
                          ${isIconOnly ? "justify-center" : ""}
                        `}
                      >
                        {/* Active indicator bar */}
                        {isItemActive && !isIconOnly && (
                          <span className="absolute -left-[13px] top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-sidebar-primary" />
                        )}
                        <ItemIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isItemActive ? "text-sidebar-primary" : "text-sidebar-foreground-computed/50 group-hover:text-sidebar-foreground-computed"}`} />
                        {!isIconOnly ? (
                          <span className="truncate">{item.label}</span>
                        ) : null}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Permissions Dialog for Staff Admins */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              My Permissions ({userPerms.length})
            </DialogTitle>
            <DialogDescription>
              These are the permissions assigned to your account by the school administrator.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {userPerms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm">No permissions assigned yet.</p>
                <p className="text-xs">Contact your school administrator to grant access.</p>
              </div>
            ) : (
              userPerms.map((permId) => {
                const permission = NAV_LINK_PERMISSIONS.find(p => p.id === permId)
                if (!permission) return null
                return (
                  <div key={permId} className="flex items-center justify-between p-3 bg-sidebar-accent/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 bg-gradient-to-b from-sidebar-primary/60 to-sidebar-primary/40 rounded-sm" />
                      <div>
                        <p className="font-medium text-sidebar-foreground-computed">{permission.label}</p>
                        <p className="text-xs text-sidebar-foreground-computed/60">{permission.category}</p>
                      </div>
                    </div>
                    <div className="w-2 h-8 bg-green-400 rounded-sm animate-pulse" />
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">

        <Button
          onClick={logout}
          className={`

            w-full bg-white/10 backdrop-blur-sm hover:bg-white/15 text-sidebar-foreground-computed hover:text-white
            border border-white/15 hover:border-sidebar-primary/50 font-semibold transition-all duration-200

            ${isIconOnly ? "px-2" : ""}
          `}
          variant="ghost"
        >
          <span className={isIconOnly ? "sr-only" : "flex items-center gap-2 justify-center"}>
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </span>
        </Button>
      </div>
    </aside>
  )
}
