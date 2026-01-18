"use client"

import { useState, useEffect, Suspense } from "react"
import { useAuthContext } from "@/lib/auth-context"
import { academicsAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, BookOpen, Calendar } from "lucide-react"

function MyClassesContent() {
  const { user } = useAuthContext()
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await academicsAPI.classes()
        const classesData = res.data.results || res.data || []
        setClasses(Array.isArray(classesData) ? classesData : [])
      } catch (err: any) {
        setError("Failed to load classes")
        setClasses([])
      } finally {
        setLoading(false)
      }
    }
    fetchClasses()
  }, [])

  if (loading) return <div className="text-center py-8">Loading classes...</div>
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-red-600 mb-2">My Classes</h1>
        <p className="text-gray-600">Manage your assigned classes</p>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">No classes assigned yet</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <Card key={cls.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{cls.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <BookOpen size={18} />
                  <span>Class Code: {cls.class_code}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Users size={18} />
                  <span>Level: {cls.level}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={18} />
                  <span>Year: {cls.year}</span>
                </div>
                <Button className="w-full bg-red-600 hover:bg-red-700">View Details</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function MyClassesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MyClassesContent />
    </Suspense>
  )
}
