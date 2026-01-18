"use client"

import { useState } from "react"
import {
  X,
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  Calendar,
  Award,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react"

interface AdminSidebarProps {
  open: boolean
  onToggle: () => void
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function AdminSidebar({ open, onToggle, activeTab, setActiveTab }: AdminSidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())

  const toggleMenu = (menu: string) => {
    const newMenus = new Set(expandedMenus)
    if (newMenus.has(menu)) {
      newMenus.delete(menu)
    } else {
      newMenus.add(menu)
    }
    setExpandedMenus(newMenus)
  }

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "admin", label: "Admin", icon: Settings, submenu: [] },
    { id: "students", label: "Students", icon: Users },
    { id: "teachers", label: "Teachers", icon: UserCheck },
    { id: "academics", label: "Academics", icon: BookOpen, submenu: [] },
    { id: "timetable", label: "Timetable", icon: Calendar },
    { id: "grading", label: "Grading", icon: Award },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  return (
    <>
      {/* Mobile backdrop */}
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onToggle} />}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static left-0 top-0 h-screen w-[168px] bg-akkhor-dark text-white z-50 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-4 border-b border-akkhor-border flex items-center justify-between">
          <div className="text-2xl font-bold text-akkhor-yellow">Akkhor</div>
          <button onClick={onToggle} className="lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="mt-6 space-y-2 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            const isExpanded = expandedMenus.has(item.id)

            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    setActiveTab(item.id)
                    if (item.submenu) toggleMenu(item.id)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                    isActive ? "bg-akkhor-yellow text-akkhor-dark" : "text-akkhor-text hover:bg-akkhor-border"
                  }`}
                >
                  <Icon size={18} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.submenu && <ChevronDown size={16} className={isExpanded ? "rotate-180" : ""} />}
                </button>
              </div>
            )
          })}
        </nav>

        <div className="absolute bottom-4 left-2 right-2">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-akkhor-text hover:bg-akkhor-border transition-colors">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
