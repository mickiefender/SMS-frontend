"use client"

import { useAuthContext } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"

export function TopBar() {
  const { user, logout } = useAuthContext()

  if (!user) return null

  const roleLabels = {
    super_admin: "Super Administrator",
    school_admin: "School Administrator",
    teacher: "Teacher",
    student: "Student",
  }

  return (
    <header className="border-b border-border bg-card h-16 flex items-center justify-between px-6">
      <div>
        <p className="text-sm text-muted-foreground">{roleLabels[user.role as keyof typeof roleLabels]}</p>
        <p className="font-medium">
          {user.first_name} {user.last_name}
        </p>
      </div>
      <Button variant="ghost" onClick={logout} size="sm">
        Sign out
      </Button>
    </header>
  )
}
