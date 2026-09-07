"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/lib/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getErrorMessage, usersAPI } from "@/lib/api"
import { GraduationCap, Loader2, Users } from "lucide-react"
import { toast } from "sonner"

type Dashboard = {
  first_name: string
  last_name: string
  children: Array<{ id: number; student_name: string; student_id: string | null; school_name: string; relationship_type: string }>
}

export default function ParentDashboardPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    usersAPI.parentDashboard()
      .then((response) => setDashboard(response.data))
      .catch((error) => toast.error(getErrorMessage(error, "Unable to load your family information.")))
      .finally(() => setLoading(false))
  }, [])

  return (
    <ProtectedRoute allowedRoles={["parent"]}>
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        {loading ? <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading family information…</div> : (
          <>
            <div><p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Parent portal</p><h1 className="mt-2 text-3xl font-bold">Welcome back, {dashboard?.first_name}</h1><p className="mt-1 text-muted-foreground">Approved student relationships linked to your account.</p></div>
            <Card className="max-w-3xl"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>My children</CardTitle><CardDescription>{dashboard?.children.length ?? 0} approved relationship{dashboard?.children.length === 1 ? "" : "s"}</CardDescription></div><Users className="h-5 w-5 text-primary" /></CardHeader><CardContent className="space-y-3">{dashboard?.children.length ? dashboard.children.map((child) => <div key={child.id} className="flex items-center gap-3 rounded-xl border p-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><GraduationCap className="h-5 w-5" /></div><div><p className="font-semibold">{child.student_name}</p><p className="text-sm text-muted-foreground">{child.student_id || "Student ID pending"} · {child.school_name} · {child.relationship_type}</p></div></div>) : <p className="text-sm text-muted-foreground">No approved student relationships are linked to your account yet.</p>}</CardContent></Card>
          </>
        )}
      </div>
    </ProtectedRoute>
  )
}
