"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { schoolsAPI } from "@/lib/api"

export function SchoolProfileSetup() {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [school, setSchool] = useState<any>(null)

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const response = await schoolsAPI.list()
        if (response.data.results && response.data.results.length > 0) {
          setSchool(response.data.results[0])
        }
        setLoading(false)
      } catch (error) {
        console.error("[v0] Failed to fetch school:", error)
        setLoading(false)
      }
    }

    fetchSchool()
  }, [])

  const handleSave = async () => {
    try {
      if (school?.id) {
        await schoolsAPI.update(school.id, school)
        setEditing(false)
      }
    } catch (error) {
      console.error("[v0] Failed to update school:", error)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading school profile...</div>
  }

  if (!school) {
    return <div className="text-center py-4">No school found</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>School Profile</CardTitle>
          <Button size="sm" onClick={() => (editing ? handleSave() : setEditing(true))}>
            {editing ? "Save" : "Edit"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(school).map(([key, value]: [string, any]) => (
            <div key={key}>
              <label className="text-sm font-medium capitalize">{key.replace(/_/g, " ")}</label>
              {editing ? (
                <input
                  type="text"
                  value={value || ""}
                  onChange={(e) => setSchool({ ...school, [key]: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                />
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">{value || "N/A"}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
