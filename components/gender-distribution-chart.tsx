"use client"

import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usersAPI } from "@/lib/api"

interface GenderData {
  name: string
  value: number
}

export function GenderDistributionChart() {
  const [data, setData] = useState<GenderData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await usersAPI.students()
        const students = response.data.results
        
        const maleCount = students.filter(student => student.gender === "male").length
        const femaleCount = students.filter(student => student.gender === "female").length

        const genderData = [
          { name: "Male", value: maleCount },
          { name: "Female", value: femaleCount },
        ]
        
        setData(genderData)
      } catch (error) {
        console.error("Error fetching student data:", error)
        // Fallback to mock data in case of an error
        setData([
          { name: "Male", value: 45 },
          { name: "Female", value: 55 },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [])

  const colors = ["#3b82f6", "#ec4899"]

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading gender data...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gender Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}