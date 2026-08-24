"use client"

import { useMemo, useState } from "react"
import {
  Activity,
  Ban,
  Download,
  KeyRound,
  MonitorSmartphone,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { ConfirmDialog } from "@/components/super-admin/confirm-dialog"
import { downloadCSV } from "@/components/super-admin/export"

function humanize(value: unknown): string {
  return String(value ?? "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function describeDetails(details: unknown): string {
  if (!details || typeof details !== "object") return ""
  try {
    return JSON.stringify(details)
  } catch {
    return ""
  }
}

export default function SecurityCenterPage() {
  const events = useFetch<AnyObj[]>(
    () => platformAPI.securityEvents({ page_size: 500 }).then((r) => r.data?.results || r.data || []),
    [],
  )
  const sessions = useFetch<AnyObj[]>(
    () => platformAPI.sessions({ page_size: 500 }).then((r) => r.data?.results || r.data || []),
    [],
  )

  const [actionError, setActionError] = useState("")
  const [busy, setBusy] = useState(false)

  // Events tab state
  const [eventSearch, setEventSearch] = useState("")
  const [severityFilter, setSeverityFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")

  // Sessions tab state
  const [sessionSearch, setSessionSearch] = useState("")

  const [revokeTarget, setRevokeTarget] = useState<AnyObj | null>(null)

  async function run(fn: () => Promise<unknown>, done?: () => void) {
    setActionError("")
    setBusy(true)
    try {
      await fn()
      done?.()
      await Promise.all([events.reload(), sessions.reload()])
      return true
    } catch (err) {
      setActionError(getErrorMessage(err, "Action failed."))
      return false
    } finally {
      setBusy(false)
    }
  }

  const eventTypes = useMemo(
    () =>
      [...new Set((events.data || []).map((e) => String(e.event_type ?? "")))]
        .filter(Boolean)
        .sort(),
    [events.data],
  )

  const filteredEvents = useMemo(() => {
    let out = [...(events.data || [])]
    if (severityFilter) out = out.filter((e) => String(e.severity) === severityFilter)
    if (typeFilter) out = out.filter((e) => String(e.event_type) === typeFilter)
    const q = eventSearch.trim().toLowerCase()
    if (q) {
      out = out.filter(
        (e) =>
          String(e.user_name ?? "").toLowerCase().includes(q) ||
          String(e.event_type ?? "").toLowerCase().includes(q) ||
          String(e.ip_address ?? "").includes(q),
      )
    }
    return out.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
  }, [events.data, severityFilter, typeFilter, eventSearch])

  const filteredSessions = useMemo(() => {
    let out = [...(sessions.data || [])]
    const q = sessionSearch.trim().toLowerCase()
    if (q) {
      out = out.filter(
        (s) =>
          String(s.user_name ?? "").toLowerCase().includes(q) ||
          String(s.device ?? "").toLowerCase().includes(q) ||
          String(s.ip_address ?? "").includes(q) ||
          String(s.location ?? "").toLowerCase().includes(q),
      )
    }
    return out.sort(
      (a, b) => new Date(b.last_activity ?? 0).getTime() - new Date(a.last_activity ?? 0).getTime(),
    )
  }, [sessions.data, sessionSearch])

  const stats = useMemo(() => {
    const allEvents = events.data || []
    const allSessions = sessions.data || []
    return {
      events: allEvents.length,
      critical: allEvents.filter((e) => e.severity === "critical").length,
      active: allSessions.filter((s) => s.is_active).length,
      revoked: allSessions.filter((s) => !s.is_active).length,
    }
  }, [events.data, sessions.data])

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Security Center"
        description="Security events across the platform and control over active user sessions."
      />

      {(actionError || events.error || sessions.error) && (
        <div className="glass-red rounded-xl p-3 text-sm text-red-300 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          {actionError || events.error || sessions.error}
        </div>
      )}

      <StatCardGrid>
        <StatCard label="Security events" value={stats.events} icon={Activity} />
        <StatCard label="Critical" value={stats.critical} icon={ShieldAlert} tone={stats.critical ? "danger" : "muted"} />
        <StatCard label="Active sessions" value={stats.active} icon={MonitorSmartphone} tone="primary" />
        <StatCard label="Revoked sessions" value={stats.revoked} icon={Ban} tone="warning" />
      </StatCardGrid>

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">
            <ShieldCheck /> Security events
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <KeyRound /> Active sessions
          </TabsTrigger>
        </TabsList>

        {/* ------------------------- Events ------------------------- */}
        <TabsContent value="events" className="mt-4 space-y-3">
          <DataToolbar
            search={eventSearch}
            onSearch={setEventSearch}
            searchPlaceholder="Search user, type or IP..."
            filters={[
              {
                value: severityFilter,
                onChange: setSeverityFilter,
                placeholder: "Severity",
                options: [
                  { value: "info", label: "Info" },
                  { value: "warning", label: "Warning" },
                  { value: "critical", label: "Critical" },
                ],
              },
              {
                value: typeFilter,
                onChange: setTypeFilter,
                placeholder: "Event",
                options: eventTypes.map((t) => ({ value: t, label: humanize(t) })),
              },
            ]}
          >
            <Button
              variant="secondary"
              disabled={!filteredEvents.length}
              onClick={() =>
                downloadCSV(
                  filteredEvents.map((e) => ({
                    id: e.id,
                    event_type: e.event_type,
                    severity: e.severity,
                    user_name: e.user_name,
                    ip_address: e.ip_address,
                    details: describeDetails(e.details),
                    created_at: e.created_at,
                  })),
                  "security-events",
                  [
                    { key: "id", label: "ID" },
                    { key: "event_type", label: "Event" },
                    { key: "severity", label: "Severity" },
                    { key: "user_name", label: "User" },
                    { key: "ip_address", label: "IP Address" },
                    { key: "details", label: "Details" },
                    { key: "created_at", label: "Recorded At" },
                  ],
                )
              }
            >
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </DataToolbar>

          <div className="overflow-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>IP address</TableHead>
                  <TableHead>Recorded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.loading &&
                  [...Array(6)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))}
                {!events.loading && !filteredEvents.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                      No security events recorded yet.
                    </TableCell>
                  </TableRow>
                )}
                {!events.loading &&
                  filteredEvents.slice(0, 100).map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <p className="font-medium">{humanize(e.event_type)}</p>
                        {!!describeDetails(e.details) && (
                          <p className="text-xs text-muted-foreground font-mono line-clamp-1 max-w-md">
                            {describeDetails(e.details)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell><StatusBadge status={e.severity} /></TableCell>
                      <TableCell>{e.user_name || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="font-mono text-xs">{e.ip_address || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {e.created_at ? new Date(e.created_at).toLocaleString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {filteredEvents.length > 100 && (
            <p className="text-xs text-muted-foreground">
              Showing the 100 most recent of {filteredEvents.length} matching events.
            </p>
          )}
        </TabsContent>

        {/* ------------------------ Sessions ------------------------ */}
        <TabsContent value="sessions" className="mt-4 space-y-3">
          <DataToolbar
            search={sessionSearch}
            onSearch={setSessionSearch}
            searchPlaceholder="Search user, device or IP..."
          />

          <div className="overflow-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Last activity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.loading &&
                  [...Array(6)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))}
                {!sessions.loading && !filteredSessions.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      No user sessions recorded yet.
                    </TableCell>
                  </TableRow>
                )}
                {!sessions.loading &&
                  filteredSessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <p className="font-medium">{s.user_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">User #{s.user}</p>
                      </TableCell>
                      <TableCell>
                        <p>{s.device || "—"}</p>
                        {(s.browser || s.os) && (
                          <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                            {[s.browser, s.os].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="font-mono text-xs">{s.ip_address || "—"}</p>
                        {s.location && (
                          <p className="text-xs text-muted-foreground">{s.location}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {s.last_activity ? new Date(s.last_activity).toLocaleString() : "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={s.is_active ? "active" : "inactive"} />
                      </TableCell>
                      <TableCell>
                        {s.is_active && (
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-500"
                              disabled={busy}
                              onClick={() => setRevokeTarget(s)}
                              aria-label={`Revoke session of ${s.user_name}`}
                            >
                              <Ban className="h-3.5 w-3.5 mr-1" /> Revoke
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Revoke session */}
      <ConfirmDialog
        open={!!revokeTarget}
        onOpenChange={(o) => !o && setRevokeTarget(null)}
        title={`Revoke ${revokeTarget?.user_name ?? "this user"}'s session?`}
        description={
          revokeTarget?.device
            ? `The "${revokeTarget.device}" session will be signed out immediately. The action is recorded in the audit log.`
            : "This session will be signed out immediately. The action is recorded in the audit log."
        }
        confirmLabel="Revoke session"
        destructive
        loading={busy}
        onConfirm={() =>
          revokeTarget &&
          run(() => platformAPI.revokeSession(revokeTarget.id), () => setRevokeTarget(null))
        }
      />
    </div>
  )
}
