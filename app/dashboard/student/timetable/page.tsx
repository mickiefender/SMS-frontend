"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { academicsAPI, authAPI } from "@/lib/api"
import { BookOpen, DollarSign, Calendar, FileText, Bell, Edit2, Download, Share2, Users } from "lucide-react"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StudentClassesDashboard } from "@/components/student-classes-dashboard"

interface DashboardData {
  upcomingExams: any[]
  dueFees: number
  events: any[]
  documents: any[]
  userProfile: any
  notices: any[]
  examResults: any[]
  schoolFees: any[]
}

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [profilePic, setProfilePic] = useState<string>("")

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log("[v0] Starting dashboard data fetch...")
        
        // Fetch user data first
        const user = await authAPI.me()
        console.log("[v0] User data fetched successfully")

        // Fetch each data type independently with error handling
        let upcomingExams = []
        let dueFees = 0
        let allEvents = []
        let allDocuments = []
        let allNotices = []
        let allResults = []
        let allFees = []

        try {
          const examsRes = await academicsAPI.exams()
          upcomingExams = (examsRes.data.results || examsRes.data || []).filter(
            (exam: any) => new Date(exam.exam_date) > new Date()
          )
          console.log("[v0] Exams fetched:", upcomingExams.length)
        } catch (err) {
          console.error("[v0] Error fetching exams:", err)
        }

        try {
          const feesRes = await academicsAPI.schoolFees()
          allFees = feesRes.data.results || feesRes.data || []
          dueFees = allFees
            .filter((fee: any) => fee.status === "pending" || fee.status === "partial")
            .reduce(
              (sum: number, fee: any) => sum + (parseFloat(fee.amount_due) || 0) - (parseFloat(fee.amount_paid) || 0),
              0
            )
          console.log("[v0] Fees fetched, total due:", dueFees)
        } catch (err) {
          console.error("[v0] Error fetching fees:", err)
        }

        try {
          const eventsRes = await academicsAPI.events()
          allEvents = eventsRes.data.results || eventsRes.data || []
          console.log("[v0] Events fetched:", allEvents.length)
        } catch (err) {
          console.error("[v0] Error fetching events:", err)
        }

        try {
          const docsRes = await academicsAPI.documents()
          allDocuments = docsRes.data.results || docsRes.data || []
          console.log("[v0] Documents fetched:", allDocuments.length)
        } catch (err) {
          console.error("[v0] Error fetching documents:", err)
        }

        try {
          const noticesRes = await academicsAPI.notices()
          allNotices = (noticesRes.data.results || noticesRes.data || []).slice(0, 5)
          console.log("[v0] Notices fetched:", allNotices.length)
        } catch (err) {
          console.error("[v0] Error fetching notices:", err)
        }

        try {
          const resultsRes = await academicsAPI.examResults()
          allResults = (resultsRes.data.results || resultsRes.data || []).slice(0, 6)
          console.log("[v0] Exam results fetched:", allResults.length)
        } catch (err) {
          console.error("[v0] Error fetching exam results:", err)
        }

        setData({
          upcomingExams,
          dueFees,
          events: allEvents,
          documents: allDocuments,
          userProfile: user.data,
          notices: allNotices,
          examResults: allResults,
          schoolFees: allFees,
        })

        // Fetch profile picture
        try {
          const picRes = await academicsAPI.profilePictures()
          if (picRes.data.results?.length > 0) {
            setProfilePic(picRes.data.results[0].picture)
          }
        } catch (err) {
          console.log("[v0] No profile picture found")
        }
      } catch (err: any) {
        console.error("[v0] Critical error in fetchDashboardData:", err?.response?.data || err?.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">Failed to load dashboard. Please check the browser console for errors.</p>
        <Button onClick={() => window.location.reload()}>Reload Page</Button>
      </div>
    )
  }

  const cards = [
    {
      title: "Upcoming Exams",
      count: data?.upcomingExams?.length || 0,
      icon: BookOpen,
      bgColor: "bg-green-500",
    },
    {
      title: "Due Fees",
      count: `$${(data?.dueFees || 0).toFixed(2)}`,
      icon: DollarSign,
      bgColor: "bg-red-500",
    },
    {
      title: "Events",
      count: data?.events?.length || 0,
      icon: Calendar,
      bgColor: "bg-blue-500",
    },
    {
      title: "Documents",
      count: data?.documents?.length || 0,
      icon: FileText,
      bgColor: "bg-yellow-500",
    },
  ]

  return (
    <div className="p-6 bg-gray-50">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Welcome to Akkhor School Management System</h1>
        <p className="text-gray-600">Student Dashboard</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, index) => {
          const Icon = card.icon
          return (
            <div key={index} className={`${card.bgColor} text-white p-6 rounded-lg shadow-lg`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">{card.title}</p>
                  <p className="text-3xl font-bold mt-2">{card.count}</p>
                </div>
                <Icon className="w-12 h-12 opacity-50" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="classes" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            My Classes
          </TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* My Information Section */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>My Information</CardTitle>
                    <CardDescription>Your personal and academic details</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Profile Picture */}
                    <div className="flex justify-center">
                      <div className="w-32 h-32 bg-cyan-400 rounded-lg flex items-center justify-center overflow-hidden">
                        {profilePic ? (
                          <Image src={profilePic || "/placeholder.svg"} alt="Profile" width={128} height={128} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center text-white">
                            <p className="text-sm">No Picture</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Student Information */}
                    <div className="md:col-span-2 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-500 text-sm">Name :</p>
                          <p className="font-semibold">{data?.userProfile?.first_name} {data?.userProfile?.last_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Gender :</p>
                          <p className="font-semibold">-</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Father Name :</p>
                          <p className="font-semibold">-</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Mother Name :</p>
                          <p className="font-semibold">-</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Date Of Birth :</p>
                          <p className="font-semibold">-</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Religion :</p>
                          <p className="font-semibold">-</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">E-mail :</p>
                          <p className="font-semibold text-sm">{data?.userProfile?.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Class :</p>
                          <p className="font-semibold">-</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Roll :</p>
                          <p className="font-semibold">-</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Section :</p>
                          <p className="font-semibold">-</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-500 text-sm">Address :</p>
                          <p className="font-semibold">-</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Phone :</p>
                          <p className="font-semibold">{data?.userProfile?.phone || "-"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notice Board */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notice Board
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {data?.notices?.map((notice, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-3 py-2">
                        <p className="text-xs text-gray-500">{new Date(notice.created_at).toLocaleDateString()}</p>
                        <p className="font-semibold text-sm">{notice.posted_by_name}</p>
                        <p className="text-sm text-gray-700 line-clamp-2">{notice.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="classes">
          <StudentClassesDashboard />
        </TabsContent>

        <TabsContent value="results">
          {/* Exam Results Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>All Exam Result</CardTitle>
                  <CardDescription>Your exam performance</CardDescription>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search by Exam ..."
                    className="px-4 py-2 border rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Search by Date ..."
                    className="px-4 py-2 border rounded-lg text-sm"
                  />
                  <Button className="bg-blue-600">SEARCH</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Exam Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Subject</th>
                      <th className="text-left py-3 px-4 font-semibold">Grade Point</th>
                      <th className="text-left py-3 px-4 font-semibold">Percent From</th>
                      <th className="text-left py-3 px-4 font-semibold">Percent Upto</th>
                      <th className="text-left py-3 px-4 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.examResults?.map((result, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{result.exam_details?.title || "-"}</td>
                        <td className="py-3 px-4">{result.subject_name}</td>
                        <td className="py-3 px-4">
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">{result.grade}</span>
                        </td>
                        <td className="py-3 px-4">{result.percentage?.toFixed(1) || 0}%</td>
                        <td className="py-3 px-4">{result.exam_details?.total_marks || 100}</td>
                        <td className="py-3 px-4">{new Date(result.recorded_date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
