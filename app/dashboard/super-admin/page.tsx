"use client"

import Link from "next/link"
import {
  Activity,
  Building2,
  CircleDollarSign,
  Database,
  GraduationCap,
  ShieldAlert,
  Ticket,
  Users,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { platformAPI } from "@/lib/api"
import type { AnyObj } from "@/components/super-admin/types"
import { useFetch } from "@/components/super-admin/use-fetch"
import { PageHeader } from "@/components/super-admin/page-header"
import { StatCard, StatCardGrid } from "@/components/super-admin/stat-card"
import { SaAreaChart } from "@/components/super-admin/charts"
import { StatusBadge } from "@/components/super-admin/status-badge"

function fmtMoney(value: number) {
  return `GH₵ ${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

export default function SuperAdminDashboardPage() {
  const overview = useFetch<AnyObj>(() => platformAPI.overview().then((r) => r.data), [])
  const health = useFetch<AnyObj>(() => platformAPI.health().then((r) => r.data), [])
  const logs = useFetch<AnyObj[]>(() => platformAPI.auditLogs({ page_size: 8 }).then((r) => r.data?.results || []), [])

  const o = overview.data
  const loading = overview.loading

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Platform Dashboard"
        description="High-level view of schools, users, revenue and system health across the entire Alara platform."
      />

      {overview.error && (
        <div className="glass-red rounded-xl p-3 text-sm text-red-300">{overview.error}</div>
      )}

      {/* Schools */}
      <StatCardGrid>
        <StatCard label="Total Schools" value={o?.schools?.total ?? 0} icon={Building2} sub={`${o?.schools?.active ?? 0} active`} />
        <StatCard label="Active Schools" value={o?.schools?.active ?? 0} icon={Building2} tone="success" />
        <StatCard label="Trial Schools" value={o?.schools?.trial ?? 0} icon={Building2} tone="warning" />
        <StatCard label="Suspended Schools" value={o?.schools?.suspended ?? 0} icon={ShieldAlert} tone="danger" />
      </StatCardGrid>

      {/* Users */}
      <StatCardGrid>
        <StatCard label="Total Students" value={o?.users?.students ?? 0} icon={GraduationCap} />
        <StatCard label="Total Teachers" value={o?.users?.teachers ?? 0} icon={Users} />
        <StatCard label="Total Parents" value={o?.users?.parents ?? 0} icon={Users} />
        <StatCard
          label="Total Users"
          value={o?.users?.total ?? 0}
          icon={Activity}
          sub={`${o?.users?.active_today ?? 0} active today · ${o?.users?.active_30d ?? 0} in last 30d`}
        />
      </StatCardGrid>

      {/* Revenue + subscriptions + storage + ops */}
      <StatCardGrid>
        <StatCard label="Revenue (all time)" value={fmtMoney(o?.revenue?.total ?? 0)} icon={CircleDollarSign} tone="primary" />
        <StatCard label="Revenue this month" value={fmtMoney(o?.revenue?.this_month ?? 0)} icon={CircleDollarSign} />
        <StatCard
          label="Subscriptions"
          value={`${o?.subscriptions?.active ?? 0} / ${o?.subscriptions?.cancelled ?? 0}`}
          icon={CircleDollarSign}
          sub="active / cancelled"
        />
        <StatCard
          label="Storage used"
          value={`${((o?.storage?.used_mb ?? 0) / 1024).toFixed(1)} GB`}
          icon={Database}
          sub={`${o?.storage?.used_mb ?? 0} MB total`}
        />
      </StatCardGrid>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Growth — schools & users (last 6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <SaAreaChart
                data={(o?.growth as AnyObj[]) || []}
                xKey="month"
                series={[
                  { key: "schools", label: "New schools" },
                  { key: "users", label: "New users" },
                ]}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {health.loading && <Skeleton className="h-24 w-full" />}
            {!health.loading &&
              ((health.data?.checks as AnyObj[]) || []).map((c) => (
                <div key={c.component} className="flex items-center justify-between gap-2 text-sm">
                  <span className="capitalize">{String(c.component).replace(/_/g, " ")}</span>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            {!health.loading && !health.data?.checks?.length && (
              <p className="text-sm text-muted-foreground">No health data available.</p>
            )}
            <div className="pt-2 border-t border-border flex items-center justify-between gap-2 text-sm">
              <span>Open support tickets</span>
              <Link href="/dashboard/super-admin/support" className="flex items-center gap-1.5 font-medium text-primary hover:underline">
                <Ticket className="h-4 w-4" /> {o?.support?.open_tickets ?? 0}
              </Link>
            </div>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span>Pending moderation</span>
              <Link href="/dashboard/super-admin/moderation" className="font-medium text-primary hover:underline">
                {o?.moderation?.pending ?? 0}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent platform activity</CardTitle>
          <Link href="/dashboard/super-admin/audit-logs" className="text-xs text-primary hover:underline">
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          {logs.loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !logs.data?.length ? (
            <p className="text-sm text-muted-foreground">No recent activity recorded.</p>
          ) : (
            <ul className="divide-y divide-border">
              {logs.data.map((log) => (
                <li key={log.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm">
                  <span className="font-medium w-44 shrink-0 truncate">{log.actor_name || "System"}</span>
                  <code className="text-xs bg-muted rounded px-1.5 py-0.5 w-fit">{log.action}</code>
                  <span className="text-muted-foreground truncate">{log.target_label || log.target_type}</span>
                  <span className="sm:ml-auto text-xs text-muted-foreground shrink-0">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
