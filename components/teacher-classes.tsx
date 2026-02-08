"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { academicsAPI } from "@/lib/api"
import { useRouter } from "next/navigation"

export function TeacherClasses() {
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true)
        const res = await academicsAPI.classes()
        setClasses(res.data.results || res.data || [])
      } catch (error) {
        console.error("[v0] Failed to fetch classes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchClasses()
  }, [])

  if (loading) return <div className="text-center py-4">Loading classes...</div>

  const handleClassClick = (classId: string) => {
    router.push(`/dashboard/teacher/classes/${classId}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Assigned Classes</CardTitle>
      </CardHeader>
      <CardContent>
        {classes.length === 0 ? (
          <p className="text-muted-foreground">No classes assigned yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => handleClassClick(cls.id)}
              >
                <h3 className="font-semibold text-lg">{cls.name}</h3>
                <p className="text-sm text-muted-foreground">Class Code: {cls.code || "N/A"}</p>
                <p className="text-sm mt-2">Stream: {cls.stream || "N/A"}</p>
                <Button
                  size="sm"
                  className="mt-4"
                  onClick={(e) => {
                    e.stopPropagation() // prevent the div's onClick from firing as well
                    handleClassClick(cls.id)
                  }}
                >
                  View Details
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
