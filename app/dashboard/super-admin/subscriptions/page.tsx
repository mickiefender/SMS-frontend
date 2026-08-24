"use client"

import { useMemo, useState } from "react"
import { BadgeDollarSign, Plus, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { billingAPI, getErrorMessage, platformAPI, superAdminAPI } from "@/lib/api"
import type { AnyObj } from "@/components/super-admin/types"
import { useFetch } from "@/components/super-admin/use-fetch"
import { PageHeader } from "@/components/super-admin/page-header"
import { StatCard, StatCardGrid } from "@/components/super-admin/stat-card"
import { DataToolbar } from "@/components/super-admin/data-toolbar"
import { StatusBadge } from "@/components/super-admin/status-badge"
import { ConfirmDialog } from "@/components/super-admin/confirm-dialog"
import { SaDonutChart } from "@/components/super-admin/charts"
import { downloadCSV } from "@/components/super-admin/export"

const PLANS = [
  { id: "1", name: "Starter" },
  { id: "2", name: "Standard" },
  { id: "3", name: "Premium" },
]

const EMPTY_COUPON = {
  code: "",
  description: "",
  discount_type: "percent",
  discount_value: "",
  max_redemptions: "0",
  applies_to_plan: "",
  valid_from: "",
  valid_until: "",
  is_active: true,
}

export default function SubscriptionsPage() {
  const overview = useFetch<AnyObj>(() => billingAPI.superAdminOverview().then((r) => r.data), [])
  const usage = useFetch<AnyObj[]>(() => superAdminAPI.usage().then((r) => r.data?.results || r.data || []), [])
  const coupons = useFetch<AnyObj[]>(() => platformAPI.coupons().then((r) => r.data?.results || r.data || []), [])

  const [actionError, setActionError] = useState("")
  const [busy, setBusy] = useState(false)
  const [planFilter, setPlanFilter] = useState("")

  // assign plan dialog
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignSchoolId, setAssignSchoolId] = useState("")
  const [assignPlanId, setAssignPlanId] = useState("")
  const [assignEndDate, setAssignEndDate] = useState("")

  // coupon dialogs
  const [couponOpen, setCouponOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<AnyObj | null>(null)
  const [couponForm, setCouponForm] = useState(EMPTY_COUPON)
  const [deleteCouponTarget, setDeleteCouponTarget] = useState<AnyObj | null>(null)

  const planCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const row of usage.data || []) {
      const key = String(row.plan ?? "none")
      counts[key] = (counts[key] ?? 0) + 1
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [usage.data])

  const subRows = useMemo(() => {
    let out = [...(usage.data || [])]
    if (planFilter) out = out.filter((r) => String(r.plan) === planFilter)
    return out
  }, [usage.data, planFilter])

  async function run(fn: () => Promise<unknown>, done?: () => void) {
    setActionError("")
    setBusy(true)
    try {
      await fn()
      done?.()
      await Promise.all([overview.reload(), usage.reload(), coupons.reload()])
    } catch (err) {
      setActionError(getErrorMessage(err, "Action failed."))
    } finally {
      setBusy(false)
    }
  }

  function openCoupon(coupon?: AnyObj) {
    if (coupon) {
      setEditingCoupon(coupon)
      setCouponForm({
        code: coupon.code ?? "",
        description: coupon.description ?? "",
        discount_type: coupon.discount_type ?? "percent",
        discount_value: String(coupon.discount_value ?? ""),
        max_redemptions: String(coupon.max_redemptions ?? 0),
        applies_to_plan: coupon.applies_to_plan ?? "",
        valid_from: toLocalInput(coupon.valid_from),
        valid_until: toLocalInput(coupon.valid_until),
        is_active: !!coupon.is_active,
      })
    } else {
      setEditingCoupon(null)
      setCouponForm(EMPTY_COUPON)
    }
    setCouponOpen(true)
  }

  function buildCouponPayload() {
    return {
      code: couponForm.code.trim().toUpperCase(),
      description: couponForm.description || undefined,
      discount_type: couponForm.discount_type,
      discount_value: Number(couponForm.discount_value || 0),
      max_redemptions: Number(couponForm.max_redemptions || 0),
      applies_to_plan: couponForm.applies_to_plan || undefined,
      valid_from: couponForm.valid_from ? new Date(couponForm.valid_from).toISOString() : undefined,
      valid_until: couponForm.valid_until ? new Date(couponForm.valid_until).toISOString() : undefined,
      is_active: couponForm.is_active,
    }
  }

  const o = overview.data

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Subscriptions & Plans"
        description="Manage subscription plans, school subscriptions, discounts and coupons."
        actions={
          <Button onClick={() => openCoupon()}><Plus className="h-4 w-4 mr-1" /> New coupon</Button>
        }
      />

      {(actionError || overview.error) && (
        <div className="glass-red rounded-xl p-3 text-sm text-red-300">{actionError || overview.error}</div>
      )}

      <StatCardGrid>
        <StatCard label="Active subscriptions" value={o?.subscriptions?.active ?? o?.active_tenants ?? 0} icon={BadgeDollarSign} tone="success" />
        <StatCard label="Cancelled subscriptions" value={o?.subscriptions?.cancelled ?? o?.inactive_tenants ?? 0} icon={BadgeDollarSign} tone="danger" />
        <StatCard label="Revenue total" value={`GH₵ ${Number(o?.revenue_total ?? o?.revenue?.total ?? 0).toLocaleString()}`} icon={BadgeDollarSign} tone="primary" />
        <StatCard label="Coupons" value={(coupons.data || []).length} icon={Ticket} />
      </StatCardGrid>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schools">School subscriptions</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-semibold mb-3">Schools per plan</p>
            {usage.loading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <SaDonutChart data={planCounts} nameKey="name" valueKey="value" height={240} />
            )}
          </div>
          <div className="rounded-xl border border-border p-4 space-y-2 text-sm">
            <p className="font-semibold mb-1">Plan summary</p>
            {PLANS.map((p) => {
              const rowsForPlan = (usage.data || []).filter((r) => String(r.plan)?.toLowerCase() === p.name.toLowerCase())
              const revenue = rowsForPlan.reduce((sum, r) => sum + Number(r.revenue ?? 0), 0)
              return (
                <div key={p.id} className="flex items-center justify-between gap-4 py-1.5 border-b border-border last:border-0">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground">{rowsForPlan.length} schools</span>
                  <span>GH₵ {revenue.toLocaleString()}</span>
                </div>
              )
            })}
            <p className="text-xs text-muted-foreground pt-2">
              Plan IDs map to backend plan records. Adjust assignments below when plans change.
            </p>
          </div>
        </TabsContent>

        {/* School subscriptions */}
        <TabsContent value="schools" className="space-y-3">
          <DataToolbar
            filters={[
              {
                value: planFilter,
                onChange: setPlanFilter,
                placeholder: "Plan",
                options: PLANS.map((p) => ({ value: p.name.toLowerCase(), label: p.name })),
              },
            ]}
          >
            <Button variant="outline" onClick={() => { setAssignSchoolId(""); setAssignPlanId(""); setAssignEndDate(""); setAssignOpen(true) }}>
              Assign plan
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                downloadCSV(
                  subRows.map((r) => ({
                    school_id: r.school_id,
                    school_name: r.school_name,
                    plan: r.plan,
                    students: r.students,
                    teachers: r.teachers,
                    storage_used_mb: r.storage_used_mb,
                    revenue: r.revenue,
                    status: r.status,
                  })),
                  "school-subscriptions",
                  [
                    { key: "school_id", label: "School ID" },
                    { key: "school_name", label: "School" },
                    { key: "plan", label: "Plan" },
                    { key: "students", label: "Students" },
                    { key: "teachers", label: "Teachers" },
                    { key: "storage_used_mb", label: "Storage MB" },
                    { key: "revenue", label: "Revenue" },
                    { key: "status", label: "Status" },
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
                  <TableHead>School</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usage.loading &&
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))}
                {!usage.loading && !subRows.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No subscription data.</TableCell>
                  </TableRow>
                )}
                {!usage.loading &&
                  subRows.map((r) => (
                    <TableRow key={r.school_id}>
                      <TableCell className="font-medium">{r.school_name}</TableCell>
                      <TableCell><span className="capitalize">{String(r.plan ?? "—")}</span></TableCell>
                      <TableCell className="text-right">{r.students ?? 0}</TableCell>
                      <TableCell className="text-right">GH₵ {Number(r.revenue ?? 0).toLocaleString()}</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Coupons */}
        <TabsContent value="coupons">
          <div className="overflow-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead className="text-right">Redemptions</TableHead>
                  <TableHead>Applies to</TableHead>
                  <TableHead>Valid until</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.loading &&
                  [...Array(4)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))}
                {!coupons.loading && !(coupons.data || []).length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No coupons created yet.</TableCell>
                  </TableRow>
                )}
                {!coupons.loading &&
                  (coupons.data || []).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <code className="font-semibold">{c.code}</code>
                        {c.description && <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>}
                      </TableCell>
                      <TableCell>
                        {c.discount_type === "fixed" ? `GH₵ ${c.discount_value}` : `${c.discount_value}%`}
                      </TableCell>
                      <TableCell className="text-right">
                        {c.redemption_count ?? 0}{c.max_redemptions ? ` / ${c.max_redemptions}` : ""}
                      </TableCell>
                      <TableCell>{c.applies_to_plan || "All plans"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.valid_until ? new Date(c.valid_until).toLocaleDateString() : "No expiry"}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={!!c.is_active}
                          disabled={busy}
                          onCheckedChange={(v) => run(() => platformAPI.updateCoupon(c.id, { is_active: v }))}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openCoupon(c)}>Edit</Button>
                          <Button size="sm" variant="ghost" className="text-red-400" onClick={() => setDeleteCouponTarget(c)}>
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Assign plan */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign subscription plan</DialogTitle>
            <DialogDescription>Attach a plan to a school with a renewal end date.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="School">
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={assignSchoolId}
                onChange={(e) => setAssignSchoolId(e.target.value)}
              >
                <option value="">Select school</option>
                {(usage.data || []).map((r) => (
                  <option key={r.school_id} value={String(r.school_id)}>{r.school_name}</option>
                ))}
              </select>
            </Field>
            <Field label="Plan">
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={assignPlanId}
                onChange={(e) => setAssignPlanId(e.target.value)}
              >
                <option value="">Select plan</option>
                {PLANS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Renewal / end date">
              <Input type="date" value={assignEndDate} onChange={(e) => setAssignEndDate(e.target.value)} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)} disabled={busy}>Cancel</Button>
            <Button
              disabled={busy || !assignSchoolId || !assignPlanId}
              onClick={() =>
                run(
                  () =>
                    billingAPI.superAdminAssignPlan({
                      school_id: Number(assignSchoolId),
                      plan_id: Number(assignPlanId),
                      end_date: assignEndDate || undefined,
                    }),
                  () => setAssignOpen(false),
                )
              }
            >
              Assign plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Coupon create/edit */}
      <Dialog open={couponOpen} onOpenChange={setCouponOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? `Edit coupon ${editingCoupon.code}` : "Create coupon"}</DialogTitle>
            <DialogDescription>Discounts apply at checkout according to these rules.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Code"><Input value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" /></Field>
            <Field label="Description"><Textarea rows={2} value={couponForm.description} onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Discount type">
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={couponForm.discount_type}
                  onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}
                >
                  <option value="percent">Percent (%)</option>
                  <option value="fixed">Fixed (GH₵)</option>
                </select>
              </Field>
              <Field label="Discount value">
                <Input type="number" min="0" value={couponForm.discount_value} onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Max redemptions (0 = unlimited)">
                <Input type="number" min="0" value={couponForm.max_redemptions} onChange={(e) => setCouponForm({ ...couponForm, max_redemptions: e.target.value })} />
              </Field>
              <Field label="Applies to plan (optional)">
                <Input value={couponForm.applies_to_plan} onChange={(e) => setCouponForm({ ...couponForm, applies_to_plan: e.target.value })} placeholder="e.g. starter" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Valid from">
                <Input type="datetime-local" value={couponForm.valid_from} onChange={(e) => setCouponForm({ ...couponForm, valid_from: e.target.value })} />
              </Field>
              <Field label="Valid until">
                <Input type="datetime-local" value={couponForm.valid_until} onChange={(e) => setCouponForm({ ...couponForm, valid_until: e.target.value })} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Switch checked={couponForm.is_active} onCheckedChange={(v) => setCouponForm({ ...couponForm, is_active: v })} />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCouponOpen(false)} disabled={busy}>Cancel</Button>
            <Button
              disabled={busy || !couponForm.code.trim() || !couponForm.discount_value}
              onClick={() =>
                run(
                  () =>
                    editingCoupon
                      ? platformAPI.updateCoupon(editingCoupon.id, buildCouponPayload())
                      : platformAPI.createCoupon(buildCouponPayload()),
                  () => setCouponOpen(false),
                )
              }
            >
              {editingCoupon ? "Save changes" : "Create coupon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete coupon */}
      <ConfirmDialog
        open={!!deleteCouponTarget}
        onOpenChange={(o) => !o && setDeleteCouponTarget(null)}
        title={`Delete coupon ${deleteCouponTarget?.code}?`}
        description="It will no longer be redeemable. Past redemptions are kept in history."
        confirmLabel="Delete coupon"
        destructive
        loading={busy}
        onConfirm={() => deleteCouponTarget && run(() => platformAPI.deleteCoupon(deleteCouponTarget.id), () => setDeleteCouponTarget(null))}
      />
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

function toLocalInput(value: string | undefined | null) {
  if (!value) return ""
  const d = new Date(value)
  if (isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
