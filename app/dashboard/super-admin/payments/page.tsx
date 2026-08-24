"use client"

import { useMemo, useState } from "react"
import { Plus, Receipt, RotateCcw, Wallet } from "lucide-react"
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
import { getErrorMessage, platformAPI, schoolsAPI } from "@/lib/api"
import type { AnyObj } from "@/components/super-admin/types"
import { useFetch } from "@/components/super-admin/use-fetch"
import { PageHeader } from "@/components/super-admin/page-header"
import { StatCard, StatCardGrid } from "@/components/super-admin/stat-card"
import { DataToolbar } from "@/components/super-admin/data-toolbar"
import { StatusBadge } from "@/components/super-admin/status-badge"
import { SaAreaChart, SaDonutChart } from "@/components/super-admin/charts"
import { downloadCSV } from "@/components/super-admin/export"

const INVOICE_STATUSES = [
  { value: "open", label: "Open" },
  { value: "paid", label: "Paid" },
  { value: "void", label: "Void" },
  { value: "refunded", label: "Refunded" },
]

const EMPTY_INVOICE = {
  school_id: "",
  amount_due: "",
  period_start: "",
  period_end: "",
  due_date: "",
}

const EMPTY_REFUND = {
  school_id: "",
  invoice_id: "",
  transaction_ref: "",
  amount: "",
  reason: "",
}

function fmtMoney(value: unknown) {
  return `GH₵ ${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

export default function PaymentsFinancePage() {
  const overview = useFetch<AnyObj>(() => platformAPI.overview().then((r) => r.data), [])
  const invoices = useFetch<AnyObj[]>(() => platformAPI.invoices({ page_size: 200 }).then((r) => r.data?.results || r.data || []), [])
  const refunds = useFetch<AnyObj[]>(() => platformAPI.refunds().then((r) => r.data?.results || r.data || []), [])
  const schools = useFetch<AnyObj[]>(() => schoolsAPI.list().then((r) => r.data?.results || r.data || []), [])

  const [actionError, setActionError] = useState("")
  const [busy, setBusy] = useState(false)
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("")

  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState(EMPTY_INVOICE)

  const [refundOpen, setRefundOpen] = useState(false)
  const [refundForm, setRefundForm] = useState(EMPTY_REFUND)

  const o = overview.data

  const invoiceRows = useMemo(() => {
    let out = [...(invoices.data || [])]
    if (invoiceStatusFilter) out = out.filter((r) => String(r.status) === invoiceStatusFilter)
    return out
  }, [invoices.data, invoiceStatusFilter])

  const monthlyRevenue = useMemo(() => {
    const byMonth: Record<string, number> = {}
    for (const inv of invoices.data || []) {
      if (String(inv.status) !== "paid") continue
      const d = new Date(inv.created_at)
      if (isNaN(d.getTime())) continue
      const key = d.toLocaleDateString(undefined, { month: "short", year: "numeric" })
      byMonth[key] = (byMonth[key] ?? 0) + Number(inv.amount_paid ?? 0)
    }
    return Object.entries(byMonth).map(([month, revenue]) => ({ month, revenue }))
  }, [invoices.data])

  const invoiceStatusMix = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const inv of invoices.data || []) {
      const key = String(inv.status ?? "open")
      counts[key] = (counts[key] ?? 0) + 1
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [invoices.data])

  const pendingRefunds = useMemo(
    () => (refunds.data || []).filter((r) => String(r.status) === "pending"),
    [refunds.data],
  )

  async function run(fn: () => Promise<unknown>, done?: () => void) {
    setActionError("")
    setBusy(true)
    try {
      await fn()
      done?.()
      await Promise.all([overview.reload(), invoices.reload(), refunds.reload()])
    } catch (err) {
      setActionError(getErrorMessage(err, "Action failed."))
    } finally {
      setBusy(false)
    }
  }

  function buildInvoicePayload() {
    return {
      school: Number(invoiceForm.school_id),
      amount_due: Number(invoiceForm.amount_due || 0),
      period_start: invoiceForm.period_start || undefined,
      period_end: invoiceForm.period_end || undefined,
      due_date: invoiceForm.due_date || undefined,
    }
  }

  function buildRefundPayload() {
    return {
      school: Number(refundForm.school_id),
      invoice: refundForm.invoice_id ? Number(refundForm.invoice_id) : undefined,
      transaction_ref: refundForm.transaction_ref.trim() || undefined,
      amount: Number(refundForm.amount || 0),
      reason: refundForm.reason.trim(),
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Payments & Finance"
        description="Track platform revenue, manage subscription invoices and process refunds."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setRefundForm(EMPTY_REFUND); setRefundOpen(true) }}>
              <RotateCcw className="h-4 w-4 mr-1" /> New refund
            </Button>
            <Button onClick={() => { setInvoiceForm(EMPTY_INVOICE); setInvoiceOpen(true) }}>
              <Plus className="h-4 w-4 mr-1" /> New invoice
            </Button>
          </div>
        }
      />

      {(actionError || overview.error) && (
        <div className="glass-red rounded-xl p-3 text-sm text-red-300">{actionError || overview.error}</div>
      )}

      <StatCardGrid>
        <StatCard label="Revenue (all time)" value={fmtMoney(o?.revenue?.total ?? 0)} icon={Wallet} tone="primary" />
        <StatCard label="Revenue this month" value={fmtMoney(o?.revenue?.this_month ?? 0)} icon={Wallet} tone="success" />
        <StatCard label="Open invoices" value={o?.revenue?.open_invoices ?? 0} icon={Receipt} tone="warning" />
        <StatCard label="Pending refunds" value={pendingRefunds.length} icon={RotateCcw} tone="danger" />
      </StatCardGrid>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="overview">Revenue overview</TabsTrigger>
        </TabsList>

        {/* Invoices */}
        <TabsContent value="invoices" className="space-y-3">
          <DataToolbar
            filters={[
              {
                value: invoiceStatusFilter,
                onChange: setInvoiceStatusFilter,
                placeholder: "Status",
                options: INVOICE_STATUSES,
              },
            ]}
          >
            <Button
              variant="secondary"
              onClick={() =>
                downloadCSV(
                  invoiceRows.map((inv) => ({
                    number: inv.number,
                    school_name: inv.school_name,
                    amount_due: inv.amount_due,
                    amount_paid: inv.amount_paid,
                    currency: inv.currency,
                    status: inv.status,
                    due_date: inv.due_date,
                    created_at: inv.created_at,
                  })),
                  "platform-invoices",
                  [
                    { key: "number", label: "Invoice #" },
                    { key: "school_name", label: "School" },
                    { key: "amount_due", label: "Amount due" },
                    { key: "amount_paid", label: "Amount paid" },
                    { key: "currency", label: "Currency" },
                    { key: "status", label: "Status" },
                    { key: "due_date", label: "Due date" },
                    { key: "created_at", label: "Created" },
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
                  <TableHead>Invoice</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.loading &&
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))}
                {!invoices.loading && !invoiceRows.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                )}
                {!invoices.loading &&
                  invoiceRows.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <code className="font-semibold">{inv.number}</code>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(inv.created_at).toLocaleDateString()}
                        </p>
                      </TableCell>
                      <TableCell className="font-medium">{inv.school_name}</TableCell>
                      <TableCell className="text-right">{fmtMoney(inv.amount_due)}</TableCell>
                      <TableCell className="text-right">{fmtMoney(inv.amount_paid)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {inv.period_start && inv.period_end
                          ? `${new Date(inv.period_start).toLocaleDateString()} → ${new Date(inv.period_end).toLocaleDateString()}`
                          : "—"}
                        {inv.due_date ? (
                          <span className="block">Due {new Date(inv.due_date).toLocaleDateString()}</span>
                        ) : null}
                      </TableCell>
                      <TableCell><StatusBadge status={inv.status} /></TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          {String(inv.status) === "open" && (
                            <Button size="sm" disabled={busy} onClick={() => run(() => platformAPI.markInvoicePaid(inv.id))}>
                              Mark paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Refunds */}
        <TabsContent value="refunds" className="space-y-3">
          <div className="overflow-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ref</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Processed</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.loading &&
                  [...Array(4)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))}
                {!refunds.loading && !(refunds.data || []).length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No refunds recorded.
                    </TableCell>
                  </TableRow>
                )}
                {!refunds.loading &&
                  (refunds.data || []).map((rf) => (
                    <TableRow key={rf.id}>
                      <TableCell>
                        <code className="font-semibold">{rf.transaction_ref || `#${rf.id}`}</code>
                        {rf.invoice_number && (
                          <p className="text-xs text-muted-foreground">Invoice {rf.invoice_number}</p>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{rf.school_name || "—"}</TableCell>
                      <TableCell className="text-right">{fmtMoney(rf.amount)}</TableCell>
                      <TableCell className="max-w-[220px] truncate text-muted-foreground" title={rf.reason}>
                        {rf.reason || "—"}
                      </TableCell>
                      <TableCell><StatusBadge status={rf.status} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {rf.processed_at ? new Date(rf.processed_at).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          {String(rf.status) === "pending" && (
                            <Button size="sm" disabled={busy} onClick={() => run(() => platformAPI.processRefund(rf.id))}>
                              Process
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Revenue overview */}
        <TabsContent value="overview" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border border-border p-4">
            <p className="text-sm font-semibold mb-3">Collected revenue per month (paid invoices)</p>
            {invoices.loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : !monthlyRevenue.length ? (
              <p className="text-sm text-muted-foreground py-16 text-center">No paid invoices yet.</p>
            ) : (
              <SaAreaChart
                data={monthlyRevenue}
                xKey="month"
                series={[{ key: "revenue", label: "Revenue" }]}
              />
            )}
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-semibold mb-3">Invoices by status</p>
            {invoices.loading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : !invoiceStatusMix.length ? (
              <p className="text-sm text-muted-foreground py-16 text-center">No invoices yet.</p>
            ) : (
              <SaDonutChart data={invoiceStatusMix} nameKey="name" valueKey="value" height={240} />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create invoice */}
      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create invoice</DialogTitle>
            <DialogDescription>Bills a school for its subscription period.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="School">
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={invoiceForm.school_id}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, school_id: e.target.value })}
              >
                <option value="">Select school</option>
                {(schools.data || []).map((s) => (
                  <option key={s.id} value={String(s.id)}>{s.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Amount due (GH₵)">
              <Input type="number" min="0" step="0.01" value={invoiceForm.amount_due}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, amount_due: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Period start">
                <Input type="date" value={invoiceForm.period_start}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, period_start: e.target.value })} />
              </Field>
              <Field label="Period end">
                <Input type="date" value={invoiceForm.period_end}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, period_end: e.target.value })} />
              </Field>
            </div>
            <Field label="Due date">
              <Input type="date" value={invoiceForm.due_date}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceOpen(false)} disabled={busy}>Cancel</Button>
            <Button
              disabled={busy || !invoiceForm.school_id || !invoiceForm.amount_due}
              onClick={() =>
                run(() => platformAPI.createInvoice(buildInvoicePayload()), () => setInvoiceOpen(false))
              }
            >
              Create invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create refund */}
      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New refund</DialogTitle>
            <DialogDescription>
              Creates a pending refund. Process it after the money has been returned.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="School">
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={refundForm.school_id}
                onChange={(e) => setRefundForm({ ...refundForm, school_id: e.target.value })}
              >
                <option value="">Select school</option>
                {(schools.data || []).map((s) => (
                  <option key={s.id} value={String(s.id)}>{s.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Related invoice (optional)">
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={refundForm.invoice_id}
                onChange={(e) => setRefundForm({ ...refundForm, invoice_id: e.target.value })}
              >
                <option value="">None</option>
                {(invoices.data || [])
                  .filter((inv) => !refundForm.school_id || String(inv.school) === refundForm.school_id)
                  .map((inv) => (
                    <option key={inv.id} value={String(inv.id)}>
                      {inv.number} · {inv.school_name} · {fmtMoney(inv.amount_due)}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Transaction reference (optional)">
              <Input value={refundForm.transaction_ref}
                onChange={(e) => setRefundForm({ ...refundForm, transaction_ref: e.target.value })}
                placeholder="e.g. Paystack ref" />
            </Field>
            <Field label="Amount (GH₵)">
              <Input type="number" min="0" step="0.01" value={refundForm.amount}
                onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })} />
            </Field>
            <Field label="Reason">
              <Textarea rows={2} value={refundForm.reason}
                onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundOpen(false)} disabled={busy}>Cancel</Button>
            <Button
              disabled={busy || !refundForm.school_id || !refundForm.amount}
              onClick={() =>
                run(() => platformAPI.createRefund(buildRefundPayload()), () => setRefundOpen(false))
              }
            >
              Create refund
            </Button>
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
