"use client"

import { useAuthContext } from "@/lib/auth-context"
import { useState } from "react"

export function TopBar() {
  const { user, logout } = useAuthContext()
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  if (!user) return null

  const roleLabels = {
    super_admin: "Super Administrator",
    school_admin: "School Administrator",
    teacher: "Teacher",
    student: "Student",
  }

  return (
    <header className="border-b border-[#e0e0e0] bg-white h-16 flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Left side - Welcome text */}
      <h2 className="text-lg text-[#666] font-medium">Dashboard</h2>

      {/* Right side - Search, language, notifications, profile */}
      <div className="flex items-center gap-6">
        {/* Search Bar */}
        <div className="hidden md:flex items-center bg-[#f5f5f5] rounded-lg px-4 py-2 w-64">
          <span className="text-[#999]">🔍</span>
          <input
            type="text"
            placeholder="Search here ..."
            className="bg-transparent outline-none ml-2 text-sm text-[#666] flex-1"
          />
        </div>

        {/* Language Selector */}
        <select className="bg-transparent text-sm text-[#666] font-medium outline-none cursor-pointer hover:text-[#1a3a52]">
          <option>English</option>
          <option>Bangla</option>
          <option>Arabic</option>
        </select>

        {/* Notifications */}
        <button className="relative text-[#999] hover:text-[#1a3a52] transition-colors">
          <span className="text-2xl">🔔</span>
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            3
          </span>
        </button>

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 hover:bg-[#f5f5f5] px-3 py-2 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-[#ffc107] rounded-full flex items-center justify-center text-sm font-bold text-[#1a3a52]">
              {user.first_name?.[0]}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-[#333]">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-[#999]">{roleLabels[user.role as keyof typeof roleLabels]}</p>
            </div>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 bg-white border border-[#e0e0e0] rounded-lg shadow-lg w-48">
              <button className="w-full text-left px-4 py-2 text-sm text-[#666] hover:bg-[#f5f5f5]">My Profile</button>
              <button className="w-full text-left px-4 py-2 text-sm text-[#666] hover:bg-[#f5f5f5]">Settings</button>
              <hr className="my-2" />
              <button
                onClick={() => {
                  setShowProfileMenu(false)
                  logout()
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
