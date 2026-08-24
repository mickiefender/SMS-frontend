"use client"

import {
  CircleDollarSign,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { platformAPI, billingAPI } from "@/lib/api"
import type { AnyObj } from "@/components/super-admin/types"
import { useFetch } from "@/components/super-admin/use-fetch"
import { PageHeader } from "@/components/super-admin/page-header"
import { StatCard, StatCardGrid } from "@/components/super-admin/stat-card"
import { SaAreaChart, SaBarChart, SaDonutChart } from "@/components/super-admin/charts"

function fmtMoney(value: number) {
  return `GH₵ ${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

export default function SuperAdminAnalyticsPage() {
  const overview = useFetch<AnyObj>(() => platformAPI.overview().then((r) => r.data), [])
  const revenue = useFetch<AnyObj>(
    () => billingAPI.superAdminRevenueAnalytics().then((r) => r.data),
    [],
  )
  const billing = useFetch<AnyObj>(() => billingAPI.superAdminOverview().then((r) => r.data), [])

  const o = overview.data
  const rev = revenue.data?.last_30_days
  const loading = overview.loading

  // User composition for the donut chart
  const userMix = [
    { name: "Students", value: o?.users?.students ?? 0 },
    { name: "Teachers", value: o?.users?.teachers ?? 0 },
    { name: "Parents", value: o?.users?.parents ?? 0 },
  ].filter((d) => d.value > 0)

  // Revenue sources for the bar chart (last 30 days)
  const revenueSources = [
    { source: "Online", amount: rev?.online_payments ?? 0 },
    { source: "Manual", amount: rev?.manual_payments ?? 0 },
    { source: "Invoices", amount: rev?.invoice_payments ?? 0 },
  ]

  const paymentStatus = (billing.data?.payment_status_breakdown as AnyObj[]) || []

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Platform Analytics"
        description="Growth, engagement and revenue trends across every school on the Alara platform."
      />

      {(overview.error || revenue.error || billing.error) && (
        <div className="glass-red rounded-xl p-3 text-sm text-red-300">
          {overview.error || revenue.error || billing.error}
        </div>
      )}

      {/* Headline metrics */}
      <StatCardGrid>
        <StatCard
          label="Revenue (all time)"
          value={fmtMoney(o?.revenue?.total ?? 0)}
          icon={CircleDollarSign}
          tone="primary"
          sub={`${o?.revenue?.open_invoices ?? 0} open invoices`}
        />
        <StatCard
          label="Revenue this month"
          value={fmtMoney(o?.revenue?.this_month ?? 0)}
          icon={TrendingUp}
          sub={`${fmtMoney(rev?.total_revenue ?? 0)} collected in last 30 days`}
        />
        <StatCard
          label="Active users (30d)"
          value={o?.users?.active_30d ?? 0}
          icon={Users}
          tone="success"
          sub={`${o?.users?.active_today ?? 0} active today`}
        />
        <StatCard
          label="Total schools"
          value={o?.schools?.total ?? 0}
          icon={GraduationCap}
          sub={`${o?.schools?.active ?? 0} active · ${o?.schools?.trial ?? 0} on trial`}
        />
      </StatCardGrid>

      {/* Growth + user mix */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Growth — new schools & users (last 6 months)</CardTitle>
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
            <CardTitle className="text-base">User composition</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : userMix.length ? (
              <SaDonutChart data={userMix} nameKey="name" valueKey="value" />
            ) : (
              <p className="text-sm text-muted-foreground">No user data available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue sources + payment status */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by channel (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {revenue.loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <SaBarChart
                data={revenueSources}
                xKey="source"
                series={[{ key: "amount", label: "Amount (GH₵)" }]}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment status breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {billing.loading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : paymentStatus.length ? (
              <SaDonutChart data={paymentStatus} nameKey="status" valueKey="count" />
            ) : (
              <p className="text-sm text-muted-foreground">No payment records yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Engagement summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Engagement snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: "Daily active rate",
                  value: o?.users?.total
                    ? `${(((o.users.active_today ?? 0) / o.users.total) * 100).toFixed(1)}%`
                    : "—",
                },
                {
                  label: "Monthly active rate",
                  value: o?.users?.total
                    ? `${(((o.users.active_30d ?? 0) / o.users.total) * 100).toFixed(1)}%`
                    : "—",
                },
                {
                  label: "Avg. users per school",
                  value: o?.schools?.total
                    ? Math.round((o?.users?.total ?? 0) / o.schools.total).toLocaleString()
                    : "—",
                },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border border-border p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{m.label}</p>
                  <p className="text-xl font-bold mt-1 tabular-nums">{m.value}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
