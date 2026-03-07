"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { attendanceAPI, academicsAPI } from "@/lib/api"
import { CircularLoader } from "@/components/circular-loader"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Calendar as CalendarIcon, Download, Filter, TrendingUp, TrendingDown, Users, BookOpen, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { format, subDays } from "date-fns"

interface OverallReport {
  total_records: number
  present: number
  absent: number
  late: number
  excused: number
  attendance_percentage: number
  unique_students: number
  unique_classes: number
  daily_trend: Array<{
    date: string
    total: number
    present: number
    absent: number
    percentage: number
  }>
}

interface ClassReport {
  class_id: number
  class_name: string
  total_records: number
  present: number
  absent: number
  late: number
  excused: number
  attendance_percentage: number
}

interface SubjectReport {
  subject_id: number
  subject_name: string
  class_name: string
  total_records: number
  present: number
  absent: number
  late: number
  attendance_percentage: number
}

const COLORS = ["#22c55e", "#ef4444", "#eab308", "#6b7280"]

export function AttendanceAnalytics() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  const [overallReport, setOverallReport] = useState<OverallReport | null>(null)
  const [classReport, setClassReport] = useState<ClassReport[]>([])
  const [subjectReport, setSubjectReport] = useState<SubjectReport[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    fetchAllReports()
  }, [selectedClass, dateRange.from, dateRange.to])

  const fetchClasses = async () => {
    try {
      const res = await academicsAPI.get("/classes/")
      setClasses(res.data.results || res.data || [])
    } catch (err) {
      console.error("Failed to fetch classes:", err)
    }
  }

  const fetchAllReports = async () => {
    setLoading(true)
    setError(null)
    try {
      const startDate = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined
      const endDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined
      const classId = selectedClass !== "all" ? parseInt(selectedClass) : undefined

      // Fetch overall report
      const overallRes = await attendanceAPI.overallReport(startDate, endDate)
      setOverallReport(overallRes.data)

      // Fetch class report
      const classRes = await attendanceAPI.classReport(classId, startDate, endDate)
      setClassReport(classRes.data.results || [])

      // Fetch subject report
      const subjectRes = await attendanceAPI.subjectReport(classId, startDate, endDate)
      setSubjectReport(subjectRes.data.results || [])
    } catch (err: any) {
      console.error("Failed to fetch attendance reports:", err)
      setError(err?.response?.data?.detail || "Failed to load attendance data")
    } finally {
      setLoading(false)
    }
  }

  const pieData = overallReport
    ? [
        { name: "Present", value: overallReport.present },
        { name: "Absent", value: overallReport.absent },
        { name: "Late", value: overallReport.late },
        { name: "Excused", value: overallReport.excused },
      ].filter((d) => d.value > 0)
    : []

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM dd")
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <CircularLoader size="lg" />
            <p className="text-gray-500 mt-4">Loading attendance analytics...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 font-medium">{error}</p>
            <Button onClick={fetchAllReports} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="w-full md:w-48">
                <label className="text-sm font-medium text-gray-600 mb-1 block">Class</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-48">
                <label className="text-sm font-medium text-gray-600 mb-1 block">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
                        ) : (
                          format(dateRange.from, "MMM dd, yyyy")
                        )
                      ) : (
                        "Select dates"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button variant="outline" onClick={fetchAllReports} className="gap-2">
              <Filter className="h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      {overallReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Attendance Rate</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {overallReport.attendance_percentage.toFixed(1)}%
                  </p>
                  <div className="flex items-center mt-1">
                    {overallReport.attendance_percentage >= 75 ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className="text-xs text-green-600">
                      {overallReport.attendance_percentage >= 75 ? "Good standing" : "Needs attention"}
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-200 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Records</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{overallReport.total_records}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Across {overallReport.unique_classes} classes
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Active Students</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">{overallReport.unique_students}</p>
                  <p className="text-xs text-purple-600 mt-1">With attendance records</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-200 flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700">Absence Rate</p>
                  <p className="text-3xl font-bold text-amber-600 mt-1">
                    {overallReport.total_records > 0
                      ? ((overallReport.absent / overallReport.total_records) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                  <p className="text-xs text-amber-600 mt-1">{overallReport.absent} absent</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-200 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="classes">By Class</TabsTrigger>
          <TabsTrigger value="subjects">By Subject</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Trend</CardTitle>
                <CardDescription>Daily attendance percentage over time</CardDescription>
              </CardHeader>
              <CardContent>
                {overallReport?.daily_trend && overallReport.daily_trend.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={overallReport.daily_trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDate}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: number) => [`${value.toFixed(1)}%`, "Attendance"]}
                          labelFormatter={(label) => formatDate(label)}
                        />
                        <Line
                          type="monotone"
                          dataKey="percentage"
                          stroke="#22c55e"
                          strokeWidth={2}
                          dot={{ fill: "#22c55e", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    No trend data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Breakdown of attendance status</CardDescription>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    No attendance data
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Daily Details Table */}
          {overallReport?.daily_trend && overallReport.daily_trend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Daily Attendance Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Total</th>
                        <th className="text-right py-3 px-4 font-medium text-green-600">Present</th>
                        <th className="text-right py-3 px-4 font-medium text-red-600">Absent</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overallReport.daily_trend.slice(-10).reverse().map((day, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{formatDate(day.date)}</td>
                          <td className="text-right py-3 px-4">{day.total}</td>
                          <td className="text-right py-3 px-4 text-green-600">{day.present}</td>
                          <td className="text-right py-3 px-4 text-red-600">{day.absent}</td>
                          <td className="text-right py-3 px-4 font-medium">
                            <span
                              className={
                                day.percentage >= 75
                                  ? "text-green-600"
                                  : day.percentage >= 50
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }
                            >
                              {day.percentage.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* By Class Tab */}
        <TabsContent value="classes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Class Attendance Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance by Class</CardTitle>
                <CardDescription>Comparison of attendance rates across classes</CardDescription>
              </CardHeader>
              <CardContent>
                {classReport.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classReport} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <YAxis
                          type="category"
                          dataKey="class_name"
                          width={100}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          formatter={(value: number) => [`${value.toFixed(1)}%`, "Attendance"]}
                        />
                        <Bar dataKey="attendance_percentage" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    No class data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Class Attendance Table */}
            <Card>
              <CardHeader>
                <CardTitle>Class Performance</CardTitle>
                <CardDescription>Detailed attendance stats per class</CardDescription>
              </CardHeader>
              <CardContent>
                {classReport.length > 0 ? (
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Class</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-600">Present</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-600">Absent</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-600">Late</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-600">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classReport.map((cls, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{cls.class_name}</td>
                            <td className="text-right py-3 px-4 text-green-600">{cls.present}</td>
                            <td className="text-right py-3 px-4 text-red-600">{cls.absent}</td>
                            <td className="text-right py-3 px-4 text-yellow-600">{cls.late}</td>
                            <td className="text-right py-3 px-4 font-medium">
                              <span
                                className={
                                  cls.attendance_percentage >= 75
                                    ? "text-green-600"
                                    : cls.attendance_percentage >= 50
                                    ? "text-yellow-600"
                                    : "text-red-600"
                                }
                              >
                                {cls.attendance_percentage.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12 text-gray-500">
                    No class data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* By Subject Tab */}
        <TabsContent value="subjects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance by Subject</CardTitle>
              <CardDescription>Subject-wise attendance analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {subjectReport.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Subject</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Class</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Present</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Absent</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Late</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectReport.map((subj, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{subj.subject_name}</td>
                          <td className="py-3 px-4 text-gray-600">{subj.class_name}</td>
                          <td className="text-right py-3 px-4 text-green-600">{subj.present}</td>
                          <td className="text-right py-3 px-4 text-red-600">{subj.absent}</td>
                          <td className="text-right py-3 px-4 text-yellow-600">{subj.late}</td>
                          <td className="text-right py-3 px-4 font-medium">
                            <span
                              className={
                                subj.attendance_percentage >= 75
                                  ? "text-green-600"
                                  : subj.attendance_percentage >= 50
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }
                            >
                              {subj.attendance_percentage.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12 text-gray-500">
                  <div className="text-center">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No subject data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

