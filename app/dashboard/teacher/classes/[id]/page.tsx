"use client"

import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ClassDetailsPage() {
  const params = useParams()
  const { id } = params

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Class Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Details for class with ID: {id}</p>
          {/* Add more class details here */}
        </CardContent>
      </Card>
    </div>
  )
}
