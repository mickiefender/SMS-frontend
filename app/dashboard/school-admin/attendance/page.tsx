"use client"

import { AttendanceAnalytics } from "@/components/attendance-analytics"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CheckSquare, Users, BarChart3, FileText, Calendar } from "lucide-react"
import Link from "next/link"

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600 mt-1">Monitor and analyze student attendance across all classes</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/school-admin/classes">
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Manage Classes
            </Button>
          </Link>
        </div>
      </div>


      {/* Main Analytics Component */}
      <AttendanceAnalytics />
    </div>
  )
}

