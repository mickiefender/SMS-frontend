"use client"

import { useMemo, useState } from "react"
import {
  Bug,
  CheckCircle2,
  Clock,
  LifeBuoy,
  MessageSquarePlus,
  Send,
  Ticket as TicketIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getErrorMessage, platformAPI } from "@/lib/api"
import type { AnyObj } from "@/components/super-admin/types"
import { useFetch } from "@/components/super-admin/use-fetch"
import { PageHeader } from "@/components/super-admin/page-header"
import { StatCard, StatCardGrid } from "@/components/super-admin/stat-card"
import { DataToolbar } from "@/components/super-admin/data-toolbar"
import { StatusBadge } from "@/components/super-admin/status-badge"
import { downloadCSV } from "@/components/super-admin/export"

const STATUSES = ["open", "in_progress", "waiting", "resolved", "closed"]
const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
]
const KINDS = [
  { value: "bug", label: "Bug report", icon: Bug },
  { value: "feature_request", label: "Feature request", icon: LifeBuoy },
  { value: "question", label: "Question", icon: MessageSquarePlus },
  { value: "feedback", label: "Feedback", icon: Send },
]

const PRIORITY_TONE: Record<string, string> = {
  low: "bg-slate-500/10 text-slate-600 border-slate-500/25",
  medium: "bg-blue-500/10 text-blue-700 border-blue-600/25",
  high: "bg-amber-500/10 text-amber-700 border-amber-600/25",
  urgent: "bg-red-500/10 text-red-700 border-red-600/25",
}

function KindBadge({ kind }: { kind?: string }) {
  const def = KINDS.find((k) => k.value === kind)
  const Icon = def?.icon ?? LifeBuoy
  return (
    <Badge variant="outline" className="gap-1 font-normal">
      <Icon className="h-3 w-3" />
      {def?.label ?? kind ?? "—"}
    </Badge>
  )
}

function PriorityBadge({ priority }: { priority?: string }) {
  const key = (priority || "").toLowerCase()
  return (
    <Badge variant="outline" className={`capitalize font-medium ${PRIORITY_TONE[key] ?? ""}`}>
      {priority || "—"}
    </Badge>
  )
}

export default function SupportCenterPage() {
  const tickets = useFetch<AnyObj[]>(
    () => platformAPI.tickets({ page_size: 200 }).then((r) => r.data?.results || r.data || []),
    [],
  )

  const [actionError, setActionError] = useState("")
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [kindFilter, setKindFilter] = useState("")

  const [detailId, setDetailId] = useState<number | null>(null)
  const detail = useFetch<AnyObj | null>(
    () => (detailId ? platformAPI.ticketDetail(detailId).then((r) => r.data) : Promise.resolve(null)),
    [detailId],
  )
  const comments = useFetch<AnyObj[]>(
    () =>
      detailId
        ? platformAPI.ticketComments(detailId).then((r) => r.data?.results || r.data || [])
        : Promise.resolve([]),
    [detailId],
  )

  const [commentBody, setCommentBody] = useState("")
  const [isInternal, setIsInternal] = useState(false)

  async function run(fn: () => Promise<unknown>, done?: () => void) {
    setActionError("")
    setBusy(true)
    try {
      await fn()
      done?.()
      await Promise.all([tickets.reload(), detail.reload(), comments.reload()])
    } catch (err) {
      setActionError(getErrorMessage(err, "Action failed."))
    } finally {
      setBusy(false)
    }
  }

  const rows = useMemo(() => {
    let out = [...(tickets.data || [])]
    const q = search.trim().toLowerCase()
    if (q) {
      out = out.filter(
        (t) =>
          String(t.reference ?? "").toLowerCase().includes(q) ||
          String(t.subject ?? "").toLowerCase().includes(q) ||
          String(t.requester_name ?? "").toLowerCase().includes(q),
      )
    }
    if (statusFilter) out = out.filter((t) => String(t.status) === statusFilter)
    if (priorityFilter) out = out.filter((t) => String(t.priority) === priorityFilter)
    if (kindFilter) out = out.filter((t) => String(t.kind) === kindFilter)
    return out
  }, [tickets.data, search, statusFilter, priorityFilter, kindFilter])

  const stats = useMemo(() => {
    const all = tickets.data || []
    return {
      open: all.filter((t) => t.status === "open").length,
      active: all.filter((t) => ["in_progress", "waiting"].includes(String(t.status))).length,
      urgent: all.filter((t) => t.priority === "urgent" && !["resolved", "closed"].includes(String(t.status))).length,
      resolved: all.filter((t) => ["resolved", "closed"].includes(String(t.status))).length,
    }
  }, [tickets.data])

  const current = detail.data
  const canReply = !!commentBody.trim()

  function closeDetail() {
    setDetailId(null)
    setCommentBody("")
    setIsInternal(false)
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Support Center"
        description="Review, prioritise and resolve support tickets submitted by schools and users across the platform."
      />

      {(actionError || tickets.error) && (
        <div className="glass-red rounded-xl p-3 text-sm text-red-300">{actionError || tickets.error}</div>
      )}

      <StatCardGrid>
        <StatCard label="Open tickets" value={stats.open} icon={TicketIcon} tone="warning" />
        <StatCard label="In progress / waiting" value={stats.active} icon={Clock} />
        <StatCard label="Urgent unresolved" value={stats.urgent} icon={Bug} tone="danger" />
        <StatCard label="Resolved & closed" value={stats.resolved} icon={CheckCircle2} tone="success" />
      </StatCardGrid>

      <DataToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search reference, subject or requester..."
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            placeholder: "Status",
            options: STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") })),
          },
          {
            value: priorityFilter,
            onChange: setPriorityFilter,
            placeholder: "Priority",
            options: PRIORITIES,
          },
          {
            value: kindFilter,
            onChange: setKindFilter,
            placeholder: "Type",
            options: KINDS.map((k) => ({ value: k.value, label: k.label })),
          },
        ]}
      >
        <Button
          variant="secondary"
          onClick={() =>
            downloadCSV(
              rows.map((t) => ({
                reference: t.reference,
                subject: t.subject,
                requester: t.requester_name,
                school: t.school_name ?? t.school,
                kind: t.kind,
                status: t.status,
                priority: t.priority,
                assignee: t.assignee_name ?? "",
                created_at: t.created_at,
                resolved_at: t.resolved_at,
              })),
              "support-tickets",
              [
                { key: "reference", label: "Reference" },
                { key: "subject", label: "Subject" },
                { key: "requester", label: "Requester" },
                { key: "school", label: "School" },
                { key: "kind", label: "Type" },
                { key: "status", label: "Status" },
                { key: "priority", label: "Priority" },
                { key: "assignee", label: "Assignee" },
                { key: "created_at", label: "Created At" },
                { key: "resolved_at", label: "Resolved At" },
              ],
            )
          }
        >
          Export CSV
        </Button>
      </DataToolbar>

      <div className="overflow-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.loading &&
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))}
            {!tickets.loading && !rows.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  No tickets match your filters.
                </TableCell>
              </TableRow>
            )}
            {!tickets.loading &&
              rows.map((t) => (
                <TableRow
                  key={t.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setDetailId(t.id)}
                >
                  <TableCell>
                    <code className="text-xs bg-muted rounded px-1.5 py-0.5">{t.reference}</code>
                    <p className="font-medium mt-1 line-clamp-1 max-w-xs">{t.subject}</p>
                  </TableCell>
                  <TableCell>
                    <p>{t.requester_name || "Unknown"}</p>
                    {t.school_name && <p className="text-xs text-muted-foreground">{t.school_name}</p>}
                  </TableCell>
                  <TableCell><KindBadge kind={t.kind} /></TableCell>
                  <TableCell><PriorityBadge priority={t.priority} /></TableCell>
                  <TableCell><StatusBadge status={t.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Ticket detail */}
      <Dialog open={detailId !== null} onOpenChange={(o) => !o && closeDetail()}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              <code className="text-xs bg-muted rounded px-1.5 py-0.5">{current?.reference ?? "…"}</code>
              {current?.subject ?? "Loading ticket…"}
            </DialogTitle>
            <DialogDescription>
              {current
                ? `${current.requester_name || "Unknown requester"}${current.school_name ? ` · ${current.school_name}` : ""} · opened ${new Date(current.created_at).toLocaleString()}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {detail.loading && <Skeleton className="h-24 w-full" />}

          {!detail.loading && current && (
            <div className="space-y-4">
              {/* Body */}
              <div className="rounded-lg border border-border p-3 text-sm whitespace-pre-wrap">
                {current.body || "No description provided."}
              </div>

              {/* Controls */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Field label="Status">
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm capitalize"
                    value={String(current.status)}
                    disabled={busy}
                    onChange={(e) =>
                      run(() => platformAPI.updateTicket(current.id, { status: e.target.value }))
                    }
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Priority">
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm capitalize"
                    value={String(current.priority)}
                    disabled={busy}
                    onChange={(e) =>
                      run(() => platformAPI.updateTicket(current.id, { priority: e.target.value }))
                    }
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Assign to me">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => run(() => platformAPI.updateTicket(current.id, { assign_me: true }))}
                  >
                    Assign myself
                  </Button>
                </Field>
              </div>

              {/* Internal notes */}
              {current.internal_notes && (
                <div className="rounded-lg border border-amber-600/30 bg-amber-500/5 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 mb-1">Internal notes</p>
                  <p className="text-sm whitespace-pre-wrap">{current.internal_notes}</p>
                </div>
              )}

              {/* Comments */}
              <div>
                <p className="text-sm font-semibold mb-2">Conversation</p>
                {comments.loading ? (
                  <Skeleton className="h-16 w-full" />
                ) : !(comments.data || []).length ? (
                  <p className="text-sm text-muted-foreground">No replies yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {(comments.data || []).map((c) => (
                      <li
                        key={c.id}
                        className={`rounded-lg border p-3 ${
                          c.is_internal ? "border-amber-600/30 bg-amber-500/5" : "border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-medium">{c.author_name || "Staff"}</span>
                          <span className="flex items-center gap-2">
                            {c.is_internal && (
                              <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-600/30">
                                internal
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(c.created_at).toLocaleString()}
                            </span>
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Reply box */}
              <div className="space-y-2">
                <Textarea
                  rows={3}
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Write a reply..."
                />
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <Switch checked={isInternal} onCheckedChange={setIsInternal} />
                    Internal note (not visible to requester)
                  </label>
                  <Button
                    size="sm"
                    disabled={busy || !canReply}
                    onClick={() =>
                      run(
                        () =>
                          platformAPI.addTicketComment(detailId!, {
                            body: commentBody.trim(),
                            is_internal: isInternal,
                          }),
                        () => {
                          setCommentBody("")
                          setIsInternal(false)
                        },
                      )
                    }
                  >
                    Post reply
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDetail}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  )
}
