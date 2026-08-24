"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { promotionAPI, academicsAPI, getErrorMessage } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  UserMinus,
  Users,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AcademicYear = {
  id: number
  name: string
  start_date: string
  end_date: string
  is_current: boolean
  status: "upcoming" | "active" | "completed"
}

type ClassInfo = { id: number; name: string }

type PreviewStudent = {
  student_id: number
  student_name: string
  student_number: string
  current_class_id: number
  current_class_name: string
  recommended_action: "promote" | "repeat" | "graduate" | "withdraw" | "transfer" | "manual_review"
  destination_class_id: number | null
  destination_class_name: string | null
  final_average: number | null
  reason: string
  warnings: string[]
}

type PreviewClass = {
  class_id: number
  class_name: string
  total_students: number
  counts: Record<string, number>
  students: PreviewStudent[]
}

type Diagnostics = {
  total_active_students: number
  students_with_class_assignment: number
  unassigned_students: number
  backfilled_enrollments: number
  rules_configured: number
}

type Preview = {
  source_year: { id: number; name: string }
  destination_year: { id: number; name: string }
  policy_mode: string
  classes: PreviewClass[]
  summary: Record<string, number>
  diagnostics?: Diagnostics
}

// Editable per-student decision (overrides the recommendation)
type Decision = {
  action: PreviewStudent["recommended_action"]
  to_class_id: number | null
}

const ACTION_LABELS: Record<string, string> = {
  promote: "Promote",
  repeat: "Repeat",
  graduate: "Graduate",
  withdraw: "Withdraw",
  transfer: "Transfer",
  manual_review: "Needs Review",
}

const ACTION_COLORS: Record<string, string> = {
  promote: "bg-emerald-100 text-emerald-800 border-emerald-200",
  repeat: "bg-amber-100 text-amber-800 border-amber-200",
  graduate: "bg-sky-100 text-sky-800 border-sky-200",
  withdraw: "bg-rose-100 text-rose-800 border-rose-200",
  transfer: "bg-violet-100 text-violet-800 border-violet-200",
  manual_review: "bg-orange-100 text-orange-800 border-orange-200",
}

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  promote: ArrowRight,
  repeat: RefreshCw,
  graduate: GraduationCap,
  withdraw: UserMinus,
  manual_review: ShieldAlert,
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StudentPromotion({ onPromoted }: { onPromoted?: () => void }) {
  const [years, setYears] = useState<AcademicYear[]>([])
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [sourceYear, setSourceYear] = useState<string>("")
  const [destYear, setDestYear] = useState<string>("")
  const [preview, setPreview] = useState<Preview | null>(null)
  const [decisions, setDecisions] = useState<Record<number, Decision>>({})
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([])
  const [showCreateYear, setShowCreateYear] = useState(false)
  const [newYear, setNewYear] = useState({ name: "", start_date: "", end_date: "", is_current: false })

  const loadYears = useCallback(async () => {
    try {
      const res = await promotionAPI.academicYears()
      const list: AcademicYear[] = res.data.results || res.data
      setYears(list)
      const current = list.find((y) => y.is_current)
      if (current && !sourceYear) setSourceYear(String(current.id))
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load academic years"))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadYears()
    academicsAPI.classes()
      .then((res) => setClasses(res.data.results || res.data))
      .catch(() => setClasses([]))
  }, [loadYears])

  const classMap = useMemo(
    () => Object.fromEntries(classes.map((c) => [c.id, c.name])),
    [classes],
  )

  const handlePreview = async () => {
    if (!sourceYear || !destYear) {
      toast.error("Select both the current and the new academic year")
      return
    }
    if (sourceYear === destYear) {
      toast.error("Source and destination years must be different")
      return
    }
    setLoading(true)
    setPreview(null)
    try {
      const res = await promotionAPI.previewPromotion({
        source_academic_year: Number(sourceYear),
        destination_academic_year: Number(destYear),
        ...(selectedClassIds.length > 0 ? { class_ids: selectedClassIds } : {}),
      })
      const data: Preview = res.data
      setPreview(data)
      // Seed editable decisions from recommendations.
      const seeded: Record<number, Decision> = {}
      for (const c of data.classes) {
        for (const s of c.students) {
          seeded[s.student_id] = { action: s.recommended_action, to_class_id: s.destination_class_id }
        }
      }
      setDecisions(seeded)
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to build promotion preview"))
    } finally {
      setLoading(false)
    }
  }

  const setDecision = (studentId: number, patch: Partial<Decision>) => {
    setDecisions((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], ...patch },
    }))
  }

  // Live counts based on (possibly overridden) decisions.
  const liveSummary = useMemo(() => {
    const summary = { promote: 0, repeat: 0, graduate: 0, withdraw: 0, transfer: 0, manual_review: 0 }
    if (!preview) return summary
    for (const c of preview.classes) {
      for (const s of c.students) {
        const d = decisions[s.student_id]
        const action = d?.action ?? s.recommended_action
        summary[action] = (summary[action] ?? 0) + 1
      }
    }
    return summary
  }, [preview, decisions])

  const handleConfirm = async () => {
    if (!preview) return
    setConfirming(true)
    try {
      const decisionList = Object.entries(decisions)
        .filter(([, d]) => d.action !== "manual_review")
        .map(([studentId, d]) => ({
          student_id: Number(studentId),
          action: d.action,
          to_class_id: d.to_class_id,
        }))

      const res = await promotionAPI.bulkPromotion({
        source_academic_year: Number(sourceYear),
        destination_academic_year: Number(destYear),
        decisions: decisionList,
      })

      const b = res.data
      toast.success(
        `Promotion completed: ${b.promoted_count} promoted, ${b.repeated_count} repeated, ` +
        `${b.graduated_count} graduated` +
        (b.failed_count ? `, ${b.failed_count} failed` : "") +
        (b.skipped_count ? `, ${b.skipped_count} skipped (already enrolled)` : ""),
      )
      setShowConfirm(false)
      setPreview(null)
      setDecisions({})
      onPromoted?.()
      loadYears()
    } catch (err) {
      toast.error(getErrorMessage(err, "Promotion failed — nothing was changed"))
    } finally {
      setConfirming(false)
    }
  }

  const handleCreateYear = async () => {
    if (!newYear.name || !newYear.start_date || !newYear.end_date) {
      toast.error("Year name, start date and end date are required")
      return
    }
    try {
      await promotionAPI.createAcademicYear(newYear)
      toast.success(`Academic year ${newYear.name} created`)
      setShowCreateYear(false)
      setNewYear({ name: "", start_date: "", end_date: "", is_current: false })
      loadYears()
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create academic year"))
    }
  }

  const filteredClasses = useMemo(() => {
    if (!preview) return []
    const q = search.trim().toLowerCase()
    if (!q) return preview.classes
    return preview.classes
      .map((c) => ({
        ...c,
        students: c.students.filter(
          (s) =>
            s.student_name.toLowerCase().includes(q) ||
            (s.student_number || "").toLowerCase().includes(q),
        ),
      }))
      .filter((c) => c.students.length > 0)
  }, [preview, search])

  const sourceYearObj = years.find((y) => String(y.id) === sourceYear)
  const destYearObj = years.find((y) => String(y.id) === destYear)

  return (
    <div className="space-y-6">
      {/* ── Step 1: Select years ─────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Student Promotion
            {sourceYearObj && destYearObj && (
              <span className="text-muted-foreground font-normal">
                — {sourceYearObj.name} → {destYearObj.name}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Current Academic Year</Label>
              <Select value={sourceYear} onValueChange={setSourceYear}>
                <SelectTrigger><SelectValue placeholder="Select current year" /></SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y.id} value={String(y.id)}>
                      {y.name} {y.is_current ? "(current)" : `(${y.status})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>New Academic Year</Label>
              <Select value={destYear} onValueChange={setDestYear}>
                <SelectTrigger><SelectValue placeholder="Select new year" /></SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y.id} value={String(y.id)} disabled={y.id === Number(sourceYear)}>
                      {y.name} {y.is_current ? "(current)" : `(${y.status})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handlePreview} disabled={loading || !sourceYear || !destYear} className="flex-1">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
                Preview Promotion
              </Button>
              <Button variant="outline" onClick={() => setShowCreateYear(true)}>New Year</Button>
            </div>
          </div>
          {years.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No academic years yet — create one (e.g. 2025/2026) to get started.
            </p>
          )}

          {/* Class selection: which classes to include in this promotion run */}
          {classes.length > 0 && (
            <div className="space-y-2">
              <Label>
                Classes To Promote
                <span className="text-muted-foreground font-normal">
                  {" "}— leave all unchecked to include every class
                </span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {classes.map((c) => {
                  const active = selectedClassIds.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setSelectedClassIds((prev) =>
                          prev.includes(c.id)
                            ? prev.filter((id) => id !== c.id)
                            : [...prev, c.id],
                        )
                      }
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-secondary/60 border-border"
                      }`}
                    >
                      {c.name}
                    </button>
                  )
                })}
              </div>
              {selectedClassIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Preview will only include {selectedClassIds.length} of {classes.length} classes.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Step 2: Preview + review ─────────────────────────── */}
      {preview && preview.summary.total === 0 && (
        <Card className="border-amber-300 bg-amber-50/60">
          <CardContent className="py-5 space-y-2">
            <p className="font-medium text-amber-900 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              No students found for promotion in {preview.source_year.name}
            </p>
            {preview.diagnostics && (
              <div className="text-sm text-amber-800 space-y-1">
                <p>
                  Students in your school: <strong>{preview.diagnostics.total_active_students}</strong>{" "}
                  · With a class assignment:{" "}
                  <strong>{preview.diagnostics.students_with_class_assignment}</strong>
                  {preview.diagnostics.unassigned_students > 0 && (
                    <>
                      {" "}· Not assigned to any class:{" "}
                      <strong>{preview.diagnostics.unassigned_students}</strong>
                    </>
                  )}
                </p>
                {preview.diagnostics.total_active_students === 0 ? (
                  <p>No active students exist yet — create student accounts first.</p>
                ) : preview.diagnostics.students_with_class_assignment === 0 ? (
                  <p>
                    None of your students are assigned to a class yet. Go to{" "}
                    <strong>Classes → Manage → Students</strong> and enroll students into their
                    classes, then run the preview again.
                  </p>
                ) : preview.diagnostics.rules_configured === 0 ? (
                  <p>
                    Students were found, but no class progression rules are configured — open the{" "}
                    <strong>Class Rules</strong> tab to define where each class promotes to.
                    Without rules every student lands in &ldquo;Needs Review&rdquo;.
                  </p>
                ) : (
                  <p>
                    Enrolled students exist but none matched this selection. Check that you picked
                    the correct source year (the year your students are currently enrolled in).
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {preview && preview.summary.total > 0 && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(["promote", "repeat", "graduate", "withdraw", "transfer", "manual_review"] as const).map((key) => {
              const Icon = ACTION_ICONS[key] ?? Users
              return (
                <Card key={key} className="py-3">
                  <CardContent className="px-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-2xl font-bold leading-none">{liveSummary[key]}</p>
                      <p className="text-xs text-muted-foreground mt-1">{ACTION_LABELS[key]}</p>
                    </div>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Class overview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Class Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {preview.classes.map((c) => (
                  <div key={c.class_id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{c.class_name}</p>
                      <p className="text-xs text-muted-foreground">{c.total_students} students</p>
                    </div>
                    <div className="text-right text-xs space-y-0.5">
                      {c.counts.promote > 0 && (
                        <p className="text-emerald-700">
                          {c.counts.promote} → {destLabel(c, decisions, classMap)}
                        </p>
                      )}
                      {c.counts.repeat > 0 && <p className="text-amber-700">{c.counts.repeat} repeat</p>}
                      {c.counts.graduate > 0 && <p className="text-sky-700">{c.counts.graduate} graduate</p>}
                      {c.counts.manual_review > 0 && <p className="text-orange-700">{c.counts.manual_review} review</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Review exceptions / students */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Review Students
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search student..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {filteredClasses.length === 0 && (
                <p className="text-sm text-muted-foreground">No students match your search.</p>
              )}
              {filteredClasses.map((c) => (
                <div key={c.class_id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold">{c.class_name}</h4>
                    <Badge variant="outline">{c.students.length} students</Badge>
                  </div>
                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Current Class</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Destination</TableHead>
                          <TableHead>Performance</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {c.students.map((s) => {
                          const d = decisions[s.student_id] ?? {
                            action: s.recommended_action,
                            to_class_id: s.destination_class_id,
                          }
                          return (
                            <TableRow key={s.student_id}>
                              <TableCell>
                                <p className="text-sm font-medium">{s.student_name}</p>
                                {s.student_number && (
                                  <p className="text-xs text-muted-foreground">{s.student_number}</p>
                                )}
                                {s.warnings.length > 0 && (
                                  <p className="text-xs text-amber-600 mt-0.5">⚠ {s.warnings[0]}</p>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">{s.current_class_name}</TableCell>
                              <TableCell>
                                <Select
                                  value={d.action}
                                  onValueChange={(v) => setDecision(s.student_id, { action: v as Decision["action"] })}
                                >
                                  <SelectTrigger className="h-8 w-[140px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(["promote", "repeat", "graduate", "withdraw", "transfer", "manual_review"] as const).map((a) => (
                                      <SelectItem key={a} value={a}>{ACTION_LABELS[a]}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-sm">
                                {d.action === "promote" || d.action === "repeat" || d.action === "transfer" ? (
                                  <Select
                                    value={d.to_class_id ? String(d.to_class_id) : ""}
                                    onValueChange={(v) => setDecision(s.student_id, { to_class_id: Number(v) })}
                                  >
                                    <SelectTrigger className="h-8 w-[130px]">
                                      <SelectValue placeholder="Select class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {classes.map((cl) => (
                                        <SelectItem key={cl.id} value={String(cl.id)}>{cl.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge variant="outline" className={ACTION_COLORS[d.action]}>
                                    {d.action === "graduate" ? "—" : "—"}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">
                                {s.final_average != null ? `${s.final_average}%` : <span className="text-muted-foreground">No data</span>}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[220px]">
                                {s.reason}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Confirm bar */}
          <Card>
            <CardContent className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-sm">
                <p className="font-medium">Ready to confirm?</p>
                <p className="text-muted-foreground">
                  {liveSummary.promote} promote · {liveSummary.repeat} repeat · {liveSummary.graduate} graduate ·{" "}
                  {liveSummary.withdraw} withdraw · {liveSummary.transfer} transfer
                  {liveSummary.manual_review > 0 && ` · ${liveSummary.manual_review} left for review (skipped)`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setPreview(null); setDecisions({}) }}>
                  Cancel
                </Button>
                <Button onClick={() => setShowConfirm(true)}>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm Promotion
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Confirmation dialog ──────────────────────────────── */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Promotion</DialogTitle>
            <DialogDescription>
              This moves {sourceYearObj?.name} students into {destYearObj?.name} in a single
              operation. It is safe to re-run: students already enrolled in the new year are
              skipped, never duplicated.
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm space-y-1 rounded-lg border p-3 bg-muted/40">
            <p>Promote: <strong>{liveSummary.promote}</strong></p>
            <p>Repeat: <strong>{liveSummary.repeat}</strong></p>
            <p>Graduate: <strong>{liveSummary.graduate}</strong></p>
            <p>Withdraw: <strong>{liveSummary.withdraw}</strong></p>
            <p>Transfer: <strong>{liveSummary.transfer}</strong></p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={confirming}>
              Go Back
            </Button>
            <Button onClick={handleConfirm} disabled={confirming}>
              {confirming && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirming ? "Processing..." : "Confirm Promotion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create academic year dialog ──────────────────────── */}
      <Dialog open={showCreateYear} onOpenChange={setShowCreateYear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Academic Year</DialogTitle>
            <DialogDescription>
              e.g. name "2026/2027". Marking a year as current completes the previous active year.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                placeholder="2026/2027"
                value={newYear.name}
                onChange={(e) => setNewYear({ ...newYear, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newYear.start_date}
                  onChange={(e) => setNewYear({ ...newYear, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={newYear.end_date}
                  onChange={(e) => setNewYear({ ...newYear, end_date: e.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newYear.is_current}
                onChange={(e) => setNewYear({ ...newYear, is_current: e.target.checked })}
              />
              Set as current academic year
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateYear(false)}>Cancel</Button>
            <Button onClick={handleCreateYear}>Create Year</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** Destination label for a class's promoted students (uses overrides if any). */
function destLabel(
  c: PreviewClass,
  decisions: Record<number, Decision>,
  classMap: Record<number, string>,
): string {
  const promoting = c.students.find(
    (s) => (decisions[s.student_id]?.action ?? s.recommended_action) === "promote",
  )
  if (!promoting) return "next class"
  const classId = decisions[promoting.student_id]?.to_class_id ?? promoting.destination_class_id
  return (classId != null && classMap[classId]) || "next class"
}
