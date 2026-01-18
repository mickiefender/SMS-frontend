"use client"

import { Menu, Search, Globe, Bell, User } from "lucide-react"

interface AdminTopbarProps {
  onMenuClick: () => void
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={onMenuClick} className="lg:hidden">
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">Welcome To Akkhor School Management System</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden md:flex items-center bg-gray-100 rounded px-3 py-2 gap-2">
            <Search size={18} className="text-gray-500" />
            <input type="text" placeholder="Search here ..." className="bg-transparent outline-none text-sm w-48" />
          </div>

          {/* Actions */}
          <button className="text-gray-600 hover:text-gray-800">
            <Globe size={20} />
          </button>
          <button className="relative text-gray-600 hover:text-gray-800">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              2
            </span>
          </button>

          {/* User profile */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">Kazi Fahim</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User size={18} />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
