"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/lib/auth-context"

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuthContext()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/dashboard")
      } else {
        router.push("/auth/login")
      }
    }
  }, [user, loading, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">School Management SaaS</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
