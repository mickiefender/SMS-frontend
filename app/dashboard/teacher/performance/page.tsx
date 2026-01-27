"use client"

import { useState, useEffect } from "react"
import { usersAPI } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Search, TrendingUp } from "lucide-react"
import Loader from "@/components/loader"

function PerformanceContent() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await usersAPI.students()
        const data = res.data.results || res.data || []
        setStudents(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Failed to fetch students:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStudents()
  }, [])

  const filteredStudents = students.filter((s) => (s.first_name || "").toLowerCase().includes(searchTerm.toLowerCase()))

  if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader size="md" color="#f5c607" />
    </div>
  )
}
 return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-red-600 mb-2">Student Performance</h1>
        <p className="text-gray-600">Track and analyze student progress</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid gap-4">
          {filteredStudents.map((s) => (
            <div key={s.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">
                    {s.first_name} {s.last_name}
                  </h3>
                  <p className="text-sm text-gray-600">ID: {s.id}</p>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <TrendingUp size={20} />
                  <span className="font-semibold">85%</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "85%" }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PerformancePage() {
  return <PerformanceContent />
}
