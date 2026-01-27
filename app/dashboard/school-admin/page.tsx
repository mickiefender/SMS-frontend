"use client"

import { ProtectedRoute } from "@/lib/protected-route"
import { useState, useEffect } from "react"
import { usersAPI } from "@/lib/api"
import { DashboardStats } from "@/components/dashboard-stats"
import { FeesChart } from "@/components/fees-chart"
import { ClassPerformanceAnalytics } from "@/components/class-performance-analytics"
import { EventCalendar } from "@/components/event-calendar"
import { NoticeBoard } from "@/components/notice-board"
import { RecentActivities } from "@/components/recent-activities"
import { StudentsManagement } from "@/components/students-management"
import { TeachersManagement } from "@/components/teachers-management"
import { SchoolProfileSetup } from "@/components/school-profile-setup"
import { AcademicStructure } from "@/components/academic-structure"
import { TimetableManagement } from "@/components/timetable-management"
import { GradingSystem } from "@/components/grading-system"
import LoadingWrapper from "@/components/loading-wrapper"



export default function SchoolAdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    parents: 0,
    earnings: 0,
    loading: true,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [studentsRes, teachersRes] = await Promise.all([usersAPI.students(), usersAPI.teachers()])

        setStats({
          students: studentsRes?.data?.results?.length || 0,
          teachers: teachersRes?.data?.results?.length || 0,
          parents: 0,
          earnings: 7500000, // Changed to GHS (Ghanaian Cedis)
          loading: false,
        })
      } catch (error) {
        setStats((prev) => ({ ...prev, loading: false }))
      }
    }

    fetchStats()
  }, [])

  return (
    <ProtectedRoute allowedRoles={["school_admin"]}>
      <LoadingWrapper isLoading={stats.loading}>
        <div className="space-y-6 p-4 md:p-6">
          {activeTab === "dashboard" && (
            <>
              {/* Statistics Cards */}
              <DashboardStats stats={stats} />

              {/* Charts and Calendar Row - responsive grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Fees Chart */}
                <div className="md:col-span-1">
                  <FeesChart />
                </div>

                {/* Calendar and Notice Board */}
                <div className="md:col-span-2 space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
                  <div>
                    <EventCalendar />
                  </div>
                  <div>
                    <NoticeBoard />
                  </div>
                </div>
              </div>

              {/* Class Performance Analytics - Full Width */}
              <div className="w-full">
                <ClassPerformanceAnalytics />
              </div>

              {/* Recent Activities */}
              <div className="w-full">
                <RecentActivities />
              </div>
            </>
          )}

          {/* Existing code */}
          {activeTab === "students" && <StudentsManagement />}
          {activeTab === "teachers" && <TeachersManagement />}
          {activeTab === "academics" && <AcademicStructure />}
          {activeTab === "timetable" && <TimetableManagement />}
          {activeTab === "grading" && <GradingSystem />}
          {activeTab === "settings" && <SchoolProfileSetup />}
        </div>
      </LoadingWrapper>
    </ProtectedRoute>
  )
}
