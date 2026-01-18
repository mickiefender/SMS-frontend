"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileText } from "lucide-react"

function SubmissionsContent() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await fetch("/api/assignments/submissions/")
        const data = await res.json()
        setSubmissions(data.results || data || [])
      } catch (error) {
        console.error("Failed to fetch submissions:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchSubmissions()
  }, [])

  const filteredSubmissions = submissions.filter((s) =>
    (s.student_name || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) return <div className="text-center py-8">Loading submissions...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-red-600 mb-2">Assignment Submissions</h1>
        <p className="text-gray-600">Review and grade student submissions</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <Input
            placeholder="Search submissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Assignment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((s) => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3">{s.student_name || "N/A"}</td>
                  <td className="px-6 py-3 flex items-center gap-2">
                    <FileText size={16} className="text-gray-400" />
                    {s.assignment_title || "Assignment"}
                  </td>
                  <td className="px-6 py-3 text-sm">{new Date(s.submitted_at).toLocaleDateString()}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        s.graded ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {s.graded ? "Graded" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function SubmissionsPage() {
  return <SubmissionsContent />
}
