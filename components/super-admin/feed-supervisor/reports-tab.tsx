"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
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
import { getErrorMessage, feedSupervisorAPI } from "@/lib/api"
import { useFetch } from "@/components/super-admin/use-fetch"
import { DataToolbar } from "@/components/super-admin/data-toolbar"
import { StatusBadge } from "@/components/super-admin/status-badge"
import type { PagedResponse, ReportRow } from "./types"
import { TablePagination } from "./pagination"
import { ModerationActionDialog } from "./action-dialog"

const PAGE_SIZE = 25

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "reviewing", label: "Reviewing" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
]

const TARGET_TYPE_OPTIONS = [
  { value: "lesson", label: "Lesson / post" },
  { value: "comment", label: "Comment" },
  { value: "teacher", label: "Teacher" },
]

const HANDLE_ACTIONS = [
  { value: "dismiss", label: "Dismiss report", destructive: false },
  { value: "hide_post", label: "Hide the reported post", destructive: true },
  { value: "remove_post", label: "Remove the reported post", destructive: true },
  { value: "warn_creator", label: "Warn the creator", destructive: false },
  { value: "restrict_creator", label: "Restrict creator from the Feed", destructive: true },
  { value: "suspend_creator", label: "Suspend creator account", destructive: true },
] as const

type HandleAction = (typeof HANDLE_ACTIONS)[number]["value"]

export function ReportsTab() {
  const [statusFilter, setStatusFilter] = useState("pending")
  const [targetFilter, setTargetFilter] = useState("")
  const [page, setPage] = useState(1)

  const reports = useFetch<PagedResponse<ReportRow>>(
    () =>
      feedSupervisorAPI
        .reports({
          page_size: PAGE_SIZE,
          page,
          status: statusFilter || undefined,
          target_type: targetFilter || undefined,
        })
        .then((r) => r.data),
    [statusFilter, targetFilter, page],
  )

  const [actionError, setActionError] = useState("")
  const [busy, setBusy] = useState(false)
  const [activeReport, setActiveReport] = useState<ReportRow | null>(null)
  const [handleAction, setHandleAction] = useState<HandleAction>("dismiss")
  const [notes, setNotes] = useState("")

  const rows = reports.data?.results || []
  const count = reports.data?.count || 0

  function openHandle(report: ReportRow) {
    setActiveReport(report)
    setHandleAction("dismiss")
    setNotes("")
    setActionError("")
  }

  async function confirmHandle() {
    if (!activeReport) return
    setBusy(true)
    setActionError("")
    try {
      await feedSupervisorAPI.handleReport(activeReport.id, {
        action: handleAction,
        notes: notes.trim() || undefined,
      })
      setActiveReport(null)
      await reports.reload()
    } catch (err) {
      setActionError(getErrorMessage(err, "Could not handle this report."))
    } finally {
      setBusy(false)
    }
  }

  const meta = HANDLE_ACTIONS.find((a) => a.value === handleAction)

  return (
    <div className="space-y-4">
      {(actionError || reports.error) && (
        <div className="glass-red rounded-xl p-3 text-sm text-red-300">{actionError || reports.error}</div>
      )}

      <DataToolbar
        filters={[
          {
            value: statusFilter,
            onChange: (v) => {
              setStatusFilter(v)
              setPage(1)
            },
            placeholder: "Status",
            options: STATUS_OPTIONS,
          },
          {
            value: targetFilter,
            onChange: (v) => {
              setTargetFilter(v)
              setPage(1)
            },
            placeholder: "Target",
            options: TARGET_TYPE_OPTIONS,
          },
        ]}
      />

      <div className="overflow-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Target</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Resolution</TableHead>
              <TableHead>Reported</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.loading &&
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!reports.loading && !rows.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No reports in this queue. 🎉
                </TableCell>
              </TableRow>
            )}
            {!reports.loading &&
              rows.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="max-w-[240px]">
                    <p className="truncate font-medium capitalize">
                      {report.target_type.replace(/_/g, " ")}
                      {report.lesson ? `: ${report.lesson.title}` : report.comment_id ? ` #${report.comment_id}` : ""}
                    </p>
                    {report.lesson && (
                      <p className="truncate text-xs text-muted-foreground">
                        by {report.lesson.teacher_name}
                        {report.lesson.school_name ? ` · ${report.lesson.school_name}` : ""}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[180px]">
                    <p className="truncate text-sm capitalize">{report.reason.replace(/_/g, " ")}</p>
                    {report.description && (
                      <p className="truncate text-xs text-muted-foreground" title={report.description}>
                        {report.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{report.reporter_name}</TableCell>
                  <TableCell>
                    <StatusBadge status={report.status} />
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    {report.resolution ? (
                      <p className="truncate text-xs text-muted-foreground" title={report.resolution}>
                        {report.resolution}
                        {report.resolved_by_name ? ` — ${report.resolved_by_name}` : ""}
                      </p>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(report.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {["pending", "reviewing"].includes(String(report.status)) ? (
                      <Button size="sm" variant="outline" onClick={() => openHandle(report)}>
                        Handle
                      </Button>
                    ) : (
                      <span className="block text-center text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <TablePagination page={page} pageSize={PAGE_SIZE} count={count} onPage={setPage} />

      {/* Handle-report dialog */}
      <ModerationActionDialog
        open={!!activeReport}
        onOpenChange={(open) => !open && setActiveReport(null)}
        title="Handle report"
        description={
          activeReport
            ? `${activeReport.reporter_name} reported ${activeReport.target_type.replace(/_/g, " ")}${
                activeReport.lesson ? ` “${activeReport.lesson.title}”` : ""
              }. Choose how to resolve it.`
            : undefined
        }
        confirmLabel={meta?.label || "Confirm"}
        destructive={meta?.destructive}
        loading={busy}
        notes={notes}
        onNotesChange={setNotes}
        onConfirm={confirmHandle}
      >
        <div className="space-y-1.5">
          <Label className="text-xs">Resolution</Label>
          <Select value={handleAction} onValueChange={(v) => setHandleAction(v as HandleAction)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HANDLE_ACTIONS.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </ModerationActionDialog>
    </div>
  )
}
