"use client"

import dynamic from 'next/dynamic'
import { ProtectedRoute } from '@/lib/protected-route'
import { useState, useEffect } from 'react'
import { usersAPI, academicsAPI, promotionAPI } from '@/lib/api'
import { DashboardStats } from '@/components/dashboard-stats'
import { FeesChart } from '@/components/fees-chart'
import { BestPerformingClass } from '@/components/best-performing-class'
import Link from 'next/link'
import { School, BookOpen, Users2 } from 'lucide-react'
import { LayoutDashboard, Users, DollarSign, CalendarDays } from 'lucide-react'

// Lazy-load analytics tab so its API calls only fire when user clicks "Analytics"
const StudentsManagement = dynamic(
  () => import('@/components/students-management').then(m => m.StudentsManagement),
  { ssr: false }
)
const TeachersManagement = dynamic(
  () => import('@/components/teachers-management').then(m => m.TeachersManagement),
  { ssr: false }
)

interface StatsType {
  students: number
  teachers: number
  parents: number
  earnings: number
  loading: boolean
}

interface AcademicYearInfo {
  id: number
  name: string
  is_current: boolean
  status: string
}

export default function SchoolAdminPage() {
  const [activeTab, setActiveTab ] = useState('dashboard')
  const [stats, setStats] = useState<StatsType>({
    students: 0,
    teachers: 0,
    parents: 0,
    earnings: 0,
    loading: true,
  })
  const [classesCount, setClassesCount] = useState(0)
  const [subjectsCount, setSubjectsCount] = useState(0)
  const [currentYear, setCurrentYear] = useState<AcademicYearInfo | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [studentsRes, teachersRes, parentsRes, classesRes, subjectsRes, yearsRes] = await Promise.all([
          usersAPI.students(),
          usersAPI.teachers(),
          usersAPI.parents().catch(() => null),
          academicsAPI.classes(),
          academicsAPI.subjects(),
          promotionAPI.academicYears().catch(() => null),
        ])

        const years = yearsRes?.data?.results || yearsRes?.data || []
        setCurrentYear(years.find((y: AcademicYearInfo) => y.is_current) || null)

        setClassesCount(classesRes.data.results?.length || classesRes.data?.length || 0)
        setSubjectsCount(subjectsRes.data.results?.length || subjectsRes.data?.length || 0)

        setStats({
          students: studentsRes?.data?.results?.length || studentsRes?.data?.length || 0,
          teachers: teachersRes?.data?.results?.length || 0,
          parents: parentsRes?.data?.results?.length || parentsRes?.data?.length || 0,
          earnings: 0,
          loading: false,
        })
      } catch (error) {
        setStats((prev: StatsType) => ({ ...prev, loading: false }))
      }
    }

    fetchStats()
  }, [])

  return (
    <ProtectedRoute allowedRoles={["school_admin"]}>
      <div className="space-y-8 p-4 md:p-6 lg:p-8">
        <div className="animate-glass-in flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              School Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2 text-base md:text-lg">
              Live overview of fees and academic performance
              {currentYear && (
                <span className="inline-flex items-center gap-1.5 ml-3 align-middle px-3 py-1 rounded-full text-sm font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  <CalendarDays className="w-4 h-4" />
                  Academic Year: {currentYear.name}
                </span>
              )}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all border
                ${activeTab === 'dashboard'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 border-primary'
                  : 'glass hover:bg-secondary/10 text-foreground hover:-translate-y-px'
                }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all border
                ${activeTab === 'analytics'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 border-primary'
                  : 'glass hover:bg-secondary/10 text-foreground hover:-translate-y-px'
                }`}
            >
              <Users className="w-5 h-5" />
              Analytics
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <>
            <DashboardStats stats={stats} />

            <div className="stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              <Link href="/dashboard/school-admin/classes" className="block">
                <div className="glass-card glass-hover p-6 cursor-pointer group h-full flex flex-col justify-between min-h-[120px] hover:shadow-blue-500/15">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-500/15 dark:bg-blue-400/15 border border-white/30 dark:border-white/10 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                      <School className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Classes</p>
                      <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">{classesCount.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium group-hover:underline">Manage Classes →</p>
                </div>
              </Link>

              <Link href="/dashboard/school-admin/subjects" className="block">
                <div className="glass-card glass-hover p-6 cursor-pointer group h-full flex flex-col justify-between min-h-[120px] hover:shadow-emerald-500/15">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-emerald-500/15 dark:bg-emerald-400/15 border border-white/30 dark:border-white/10 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                      <BookOpen className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Subjects</p>
                      <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">{subjectsCount.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium group-hover:underline">Manage Subjects →</p>
                </div>
              </Link>

              <Link href="/dashboard/school-admin/students" className="block">
                <div className="glass-card glass-hover p-6 cursor-pointer group h-full flex flex-col justify-between min-h-[120px] hover:shadow-purple-500/15">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-purple-500/15 dark:bg-purple-400/15 border border-white/30 dark:border-white/10 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                      <Users2 className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Enrol</p>
                      <p className="text-2xl font-bold tracking-tight text-foreground">Enroll Students</p>
                    </div>
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium group-hover:underline">Student Onboarding →</p>
                </div>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-primary" />
                  Fee Collection Overview
                </h2>
                <FeesChart />
              </div>

              <div className="glass-card p-6">
                <BestPerformingClass />
              </div>
            </div>
          </>
        )}

        {activeTab === 'analytics' && (
          <div className="stagger grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">Students Overview</h2>
              <StudentsManagement />
            </div>
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">Teachers Overview</h2>
              <TeachersManagement />
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
