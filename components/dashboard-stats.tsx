"use client"

import { Users, UserCheck, Users2, DollarSign } from "lucide-react"

interface DashboardStatsProps {
  stats: {
    students: number
    teachers: number
    parents: number
    earnings: number
    loading: boolean
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    { label: "Students", value: stats.students, icon: Users, color: "bg-green-100", textColor: "text-green-600" },
    { label: "Teachers", value: stats.teachers, icon: UserCheck, color: "bg-blue-100", textColor: "text-blue-600" },
    { label: "Parents", value: stats.parents, icon: Users2, color: "bg-yellow-100", textColor: "text-yellow-600" },
    {
      label: "Total Revenue",
      value: `¢${stats.earnings.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-teal-100",
      textColor: "text-teal-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statCards.map((stat, idx) => {
        const Icon = stat.icon
        return (
          <div key={idx} className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
              <Icon className={`${stat.textColor}`} size={24} />
            </div>
            <p className="text-gray-600 text-sm mb-2">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-800">{stats.loading ? "..." : stat.value}</p>
          </div>
        )
      })}
    </div>
  )
}
