"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthContext } from "@/lib/auth-context"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [studentId, setStudentId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [loginType, setLoginType] = useState("email") // "email" or "student_id"
  const { login } = useAuthContext()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (loginType === "email") {
        await login(email, password)
      } else {
        await login(studentId, password, "student_id")
      }
    } catch (err) {
      setError("Invalid credentials. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">School Management SaaS</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {isClient && (
            <Tabs value={loginType} onValueChange={setLoginType} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Staff/Admin</TabsTrigger>
                <TabsTrigger value="student_id">Student</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-destructive/10 text-destructive px-3 py-2 rounded text-sm">{error}</div>}

            {loginType === "email" ? (
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="student_id">Student ID</Label>
                <Input
                  id="student_id"
                  type="text"
                  placeholder="Enter your student ID"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Your student ID is in the format: SCHOOLCODE-001, SCHOOLCODE-002, etc.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
