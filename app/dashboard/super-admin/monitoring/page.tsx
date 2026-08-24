"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Server,
  Timer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
import { StatusBadge } from "@/components/super-admin/status-badge"

const STATUS_DOT: Record<string, string> = {
  healthy: "bg-emerald-500",
  degraded: "bg-amber-500",
  down: "bg-red-500",
}

/** Human label per known backend check component. */
function componentLabel(component: string): string {
  const map: Record<string, string> = {
    database: "Database",
    celery: "Celery / background jobs",
    api: "API error rate",
    cache: "Cache",
    storage: "Object storage",
  }
  return map[component] ?? component.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function ComponentIcon({ component }: { component: string }) {
  if (/database|db/i.test(component)) return <Server className="h-4 w-4 text-primary" />
  if (/celery|worker|queue|job/i.test(component)) return <Timer className="h-4 w-4 text-primary" />
  if (/api|error/i.test(component)) return <Activity className="h-4 w-4 text-primary" />
  return <Cpu className="h-4 w-4 text-primary" />
}

export default function MonitoringPage() {
  const snapshots = useFetch<AnyObj[]>(
    () => platformAPI.monitoring({ page_size: 100 }).then((r) => r.data?.results || r.data || []),
    [],
  )
  const health = useFetch<AnyObj | null>(
    () => platformAPI.health().then((r) => r.data ?? null),
    [],
  )

  const [refreshError, setRefreshError] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  // Poll live health every 60 seconds so the console stays current.
  useEffect(() => {
    const id = window.setInterval(() => {
      health.reload()
      snapshots.reload()
    }, 60_000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function refreshAll() {
    setRefreshError("")
    setRefreshing(true)
    try {
      await Promise.all([health.reload(), snapshots.reload()])
    } catch (err) {
      setRefreshError(getErrorMessage(err, "Could not refresh monitoring data."))
    } finally {
      setRefreshing(false)
    }
  }

  const checks: AnyObj[] = useMemo(
    () => (Array.isArray(health.data?.checks) ? health.data.checks : []),
    [health.data],
  )

  const overall = useMemo(() => {
    if (!checks.length) return null
    if (checks.some((c) => c.status === "down")) return "down"
    if (checks.some((c) => c.status === "degraded")) return "degraded"
    return "healthy"
  }, [checks])

  const stats = useMemo(() => {
    const latestByComponent = new Map<string, AnyObj>()
    for (const s of [...(snapshots.data || [])].sort(
      (a, b) => new Date(b.recorded_at ?? 0).getTime() - new Date(a.recorded_at ?? 0).getTime(),
    )) {
      if (!latestByComponent.has(String(s.component))) {
        latestByComponent.set(String(s.component), s)
      }
    }
    const latest = [...latestByComponent.values()]
    const apiCheck = checks.find((c) => c.component === "api")
    return {
      healthy: latest.filter((s) => s.status === "healthy").length || (overall === "healthy" ? checks.length : 0),
      degraded: latest.filter((s) => s.status === "degraded").length ||
        (checks.some((c) => c.status === "degraded") ? 1 : 0),
      down: latest.filter((s) => s.status === "down").length ||
        (checks.some((c) => c.status === "down") ? 1 : 0),
      errorRate: Number(apiCheck?.error_rate ?? 0),
      requests: Number(apiCheck?.requests_last_hour ?? 0),
      trackedComponents: latest.length || checks.length,
    }
  }, [snapshots.data, checks, overall])

  const overallTone =
    overall === "healthy"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : overall === "degraded"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : overall === "down"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-border bg-muted text-muted-foreground"

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="System Monitoring"
        description="Live health of core infrastructure components and historical monitoring snapshots."
        actions={
          <Button variant="outline" disabled={refreshing} onClick={refreshAll}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
        }
      />

      {(refreshError || health.error || snapshots.error) && (
        <div className="glass-red rounded-xl p-3 text-sm text-red-300">
          {refreshError || health.error || snapshots.error}
        </div>
      )}

      {/* Overall status banner */}
      <div className={`glass-card p-5 flex flex-col sm:flex-row sm:items-center gap-4 border ${overallTone}`}>
        <span className="relative flex h-3 w-3 shrink-0">
          {overall === "healthy" && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-40" />
          )}
          <span
            className={`relative inline-flex h-3 w-3 rounded-full ${
              STATUS_DOT[overall ?? ""] ?? "bg-slate-400"
            }`}
          />
        </span>
        <div className="min-w-0">
          <p className="text-lg font-bold tracking-tight capitalize">
            {overall ? `Platform ${overall === "healthy" ? "operational" : overall}` : "Status unknown"}
          </p>
          <p className="text-sm opacity-80">
            Last checked{" "}
            {health.data?.checked_at ? new Date(health.data.checked_at).toLocaleString() : "—"}
          </p>
        </div>
      </div>

      <StatCardGrid>
        <StatCard label="Components tracked" value={stats.trackedComponents} icon={Cpu} />
        <StatCard label="Healthy" value={stats.healthy} icon={CheckCircle2} tone="success" />
        <StatCard
          label="Degraded / down"
          value={stats.degraded + stats.down}
          icon={Activity}
          tone={stats.degraded + stats.down ? "warning" : "muted"}
        />
        <StatCard
          label="API error rate (1h)"
          value={`${stats.errorRate}%`}
          sub={`${stats.requests.toLocaleString()} requests last hour`}
          icon={Timer}
          tone={stats.errorRate >= 5 ? "danger" : "primary"}
        />
      </StatCardGrid>

      {/* Live component checks */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1">
          Live health checks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
          {health.loading &&
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          {!health.loading && !checks.length && (
            <div className="glass-card p-8 col-span-full text-center text-sm text-muted-foreground">
              No health data available yet.
            </div>
          )}
          {!health.loading &&
            checks.map((check) => (
              <div key={check.component} className="glass-card glass-hover p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <ComponentIcon component={String(check.component)} />
                    <p className="font-medium truncate">{componentLabel(String(check.component))}</p>
                  </div>
                  <StatusBadge status={check.status} />
                </div>
                <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {check.latency_ms != null && (
                    <div className="flex justify-between gap-2">
                      <dt>Latency</dt>
                      <dd className="tabular-nums font-medium text-foreground">{check.latency_ms} ms</dd>
                    </div>
                  )}
                  {check.error_rate != null && (
                    <div className="flex justify-between gap-2">
                      <dt>Error rate</dt>
                      <dd className="tabular-nums font-medium text-foreground">{check.error_rate}%</dd>
                    </div>
                  )}
                  {check.requests_last_hour != null && (
                    <div className="flex justify-between gap-2">
                      <dt>Requests (1h)</dt>
                      <dd className="tabular-nums font-medium text-foreground">
                        {Number(check.requests_last_hour).toLocaleString()}
                      </dd>
                    </div>
                  )}
                  {!!check.details && (
                    <p className="pt-1 line-clamp-2 break-all font-mono text-[11px]">{String(check.details)}</p>
                  )}
                </dl>
              </div>
            ))}
        </div>
      </section>

      {/* Snapshot history */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1">
          Snapshot history
        </h2>
        <div className="overflow-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Latency</TableHead>
                <TableHead className="text-right">Error rate</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Recorded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshots.loading &&
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))}
              {!snapshots.loading && !(snapshots.data || []).length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    No monitoring snapshots recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {!snapshots.loading &&
                (snapshots.data || []).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium capitalize">
                      {componentLabel(String(s.component))}
                    </TableCell>
                    <TableCell><StatusBadge status={s.status} /></TableCell>
                    <TableCell className="text-right tabular-nums">{s.latency_ms ?? 0} ms</TableCell>
                    <TableCell className="text-right tabular-nums">{s.error_rate ?? 0}%</TableCell>
                    <TableCell>
                      {s.details ? (
                        <p className="font-mono text-xs text-muted-foreground line-clamp-1 max-w-xs">
                          {JSON.stringify(s.details)}
                        </p>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {s.recorded_at ? new Date(s.recorded_at).toLocaleString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  )
}
