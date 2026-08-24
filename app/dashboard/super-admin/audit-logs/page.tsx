"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, ScrollText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { platformAPI } from "@/lib/api"
import type { AnyObj } from "@/components/super-admin/types"
import { useFetch } from "@/components/super-admin/use-fetch"
import { PageHeader } from "@/components/super-admin/page-header"
import { DataToolbar } from "@/components/super-admin/data-toolbar"
import { downloadCSV } from "@/components/super-admin/export"

const PAGE_SIZE = 50

export default function AuditLogsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")

  const logs = useFetch<AnyObj[]>(
    () =>
      platformAPI
        .auditLogs({ page, page_size: PAGE_SIZE })
        .then((r) => r.data?.results || r.data || []),
    [page],
  )

  const [detail, setDetail] = useState<AnyObj | null>(null)

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return logs.data || []
    return (logs.data || []).filter(
      (l) =>
        String(l.actor_name ?? "").toLowerCase().includes(q) ||
        String(l.action ?? "").toLowerCase().includes(q) ||
        String(l.target_label ?? "").toLowerCase().includes(q) ||
        String(l.target_type ?? "").toLowerCase().includes(q),
    )
  }, [logs.data, search])

  function exportAll() {
    downloadCSV(
      rows.map((l) => ({
        created_at: l.created_at,
        actor: l.actor_name || "System",
        action: l.action,
        target_type: l.target_type,
        target_id: l.target_id,
        target_label: l.target_label,
        ip_address: l.ip_address,
      })),
      "audit-logs",
      [
        { key: "created_at", label: "Timestamp" },
        { key: "actor", label: "Actor" },
        { key: "action", label: "Action" },
        { key: "target_type", label: "Target Type" },
        { key: "target_id", label: "Target ID" },
        { key: "target_label", label: "Target" },
        { key: "ip_address", label: "IP Address" },
      ],
    )
  }

  const hasPrev = page > 1
  const hasNext = (logs.data?.length ?? 0) === PAGE_SIZE

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Immutable record of every sensitive action performed across the platform — who did what, to which target, and when."
      />

      {logs.error && (
        <div className="glass-red rounded-xl p-3 text-sm text-red-300">{logs.error}</div>
      )}

      <DataToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search actor, action or target..."
      >
        <Button variant="secondary" onClick={exportAll}>Export CSV</Button>
      </DataToolbar>

      <div className="overflow-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">Time</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>IP address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.loading &&
              [...Array(10)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))}
            {!logs.loading && !rows.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                  No audit entries found.
                </TableCell>
              </TableRow>
            )}
            {!logs.loading &&
              rows.map((log) => (
                <TableRow
                  key={log.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setDetail(log)}
                >
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.actor_name || <span className="text-muted-foreground">System</span>}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted rounded px-1.5 py-0.5">{log.action}</code>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground mr-1.5">
                      {log.target_type}
                    </span>
                    {log.target_label || log.target_id}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {log.ip_address || "—"}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ScrollText className="h-3.5 w-3.5" />
          Page {page} · newest first
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={!hasPrev || logs.loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <ChevronLeft className="h-4 w-4 mr-0.5" /> Previous
          </Button>
          <Button variant="outline" size="sm" disabled={!hasNext || logs.loading} onClick={() => setPage((p) => p + 1)}>
            Next <ChevronRight className="h-4 w-4 ml-0.5" />
          </Button>
        </div>
      </div>

      {/* Entry detail */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono text-base">{detail?.action}</DialogTitle>
            <DialogDescription>
              {detail ? new Date(detail.created_at).toLocaleString() : ""}
            </DialogDescription>
          </DialogHeader>

          {detail && (
            <div className="space-y-3 text-sm">
              <dl className="grid grid-cols-[100px_1fr] gap-x-3 gap-y-2">
                <dt className="text-muted-foreground">Actor</dt>
                <dd>{detail.actor_name || "System"}</dd>

                <dt className="text-muted-foreground">Target</dt>
                <dd>
                  <span className="capitalize">{String(detail.target_type).replace(/_/g, " ")}</span>
                  {detail.target_id ? ` #${detail.target_id}` : ""}
                  {detail.target_label ? ` — ${detail.target_label}` : ""}
                </dd>

                <dt className="text-muted-foreground">IP address</dt>
                <dd className="font-mono text-xs">{detail.ip_address || "—"}</dd>
              </dl>

              {!!Object.keys(detail.changes ?? {}).length && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Changes
                  </p>
                  <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(detail.changes, null, 2)}
                  </pre>
                </div>
              )}

              {detail.user_agent && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    User agent
                  </p>
                  <p className="text-xs text-muted-foreground break-all">{detail.user_agent}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
