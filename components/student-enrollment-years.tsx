"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { promotionAPI, usersAPI, getErrorMessage } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowRight,
  CalendarDays,
  GraduationCap,
  History,
  RefreshCw,
  Search,
} from "lucide-react"

type StudentOption = {
  id: number
  name: string
  email?: string
}

type YearEnrollment = {
  enrollment_id: number
  academic_year_id: number
  academic_year: string
  year_status: string
  class_id: number
  class_name: string
  status: string
  notes: string
}

type PromotionEntry = {
  id: number
  batch_id: number
  from_year: string
  to_year: string
  action: string
  from_class: string | null
  to_class: string | null
  final_average: number | null
  reason: string
  status: string
  date: string
}

const ENROLLMENT_STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  promoted: "bg-sky-100 text-sky-800 border-sky-200",
  repeating: "bg-amber-100 text-amber-800 border-amber-200",
  graduated: "bg-violet-100 text-violet-800 border-violet-200",
  withdrawn: "bg-rose-100 text-rose-800 border-rose-200",
  transferred: "bg-orange-100 text-orange-800 border-orange-200",
}

export function StudentEnrollmentYears() {
  const [students, setStudents] = useState<StudentOption[]>([])
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string>("")
  const [enrollments, setEnrollments] = useState<YearEnrollment[]>([])
  const [promotions, setPromotions] = useState<PromotionEntry[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    usersAPI.students()
      .then((res) => {
        const list = res.data.results || res.data || []
        setStudents(
          list.map((s: any) => ({
            id: s.user_data?.id ?? s.user ?? s.id,
            name:
              [s.first_name, s.last_name].filter(Boolean).join(" ") ||
              s.username ||
              s.email,
            email: s.email || s.user_data?.email,
          })).filter((s: StudentOption) => Number.isFinite(s.id)),
        )
      })
      .catch((err) => toast.error(getErrorMessage(err, "Failed to load students")))
      .finally(() => setLoadingStudents(false))
  }, [])

  const loadHistory = useCallback(async (studentId: number) => {
    setLoadingHistory(true)
    try {
      const res = await promotionAPI.academicHistory(studentId)
      setEnrollments(res.data.history || [])
      setPromotions(res.data.promotions || [])
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load enrollment history"))
      setEnrollments([])
      setPromotions([])
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return students.slice(0, 200)
    return students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.email || "").toLowerCase().includes(q),
      )
      .slice(0, 200)
  }, [students, search])

  const selectedStudent = students.find((s) => String(s.id) === selectedId)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Enrollment By Academic Year
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Pick a student to see every academic year they are enrolled in, the class
            for each year, and their full promotion history.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_260px_auto]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedId} onValueChange={(v) => { setSelectedId(v); loadHistory(Number(v)) }}>
              <SelectTrigger><SelectValue placeholder={loadingStudents ? "Loading students..." : "Select a student"} /></SelectTrigger>
              <SelectContent>
                {filteredOptions.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}{s.email ? ` (${s.email})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => selectedId && loadHistory(Number(selectedId))}
              disabled={!selectedId || loadingHistory}
            >
              <RefreshCw className={`h-4 w-4 ${loadingHistory ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {!selectedId && (
            <p className="text-sm text-muted-foreground py-4">
              No student selected yet.
            </p>
          )}
        </CardContent>
      </Card>

      {selectedStudent && (
        <>
          {/* Year-by-year enrollments */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {selectedStudent.name} — Enrolled Years
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Loading...</p>
              ) : enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  This student has no year-based enrollments yet. They will appear here once
                  you run a promotion preview (which backfills the current year automatically).
                </p>
              ) : (
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Academic Year</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Enrollment Status</TableHead>
                        <TableHead>Year Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollments.map((e) => (
                        <TableRow key={e.enrollment_id}>
                          <TableCell className="font-medium">{e.academic_year}</TableCell>
                          <TableCell>{e.class_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={ENROLLMENT_STATUS_COLORS[e.status] ?? ""}>
                              {e.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm capitalize text-muted-foreground">
                            {e.year_status}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Promotion history */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4" />
                Promotion History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {promotions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No promotions recorded for this student yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {promotions.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border px-3 py-2 gap-3 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium whitespace-nowrap">
                          {p.from_year} <ArrowRight className="inline h-3.5 w-3.5 text-muted-foreground" /> {p.to_year}
                        </span>
                        <Badge variant="outline" className="capitalize">{p.action}</Badge>
                        <span className="text-xs text-muted-foreground truncate">
                          {p.from_class ?? "—"} → {p.to_class ?? "—"}
                          {p.final_average != null && ` · avg ${p.final_average}%`}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(p.date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
