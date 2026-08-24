"use client"

import { useMemo, useState } from "react"
import { Building2, MoreHorizontal, Plus, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { getErrorMessage, platformAPI, schoolsAPI, superAdminAPI } from "@/lib/api"
import type { AnyObj } from "@/components/super-admin/types"
import { useFetch } from "@/components/super-admin/use-fetch"
import { PageHeader } from "@/components/super-admin/page-header"
import { StatCard, StatCardGrid } from "@/components/super-admin/stat-card"
import { DataToolbar } from "@/components/super-admin/data-toolbar"
import { StatusBadge } from "@/components/super-admin/status-badge"
import { ConfirmDialog } from "@/components/super-admin/confirm-dialog"
import { downloadCSV } from "@/components/super-admin/export"

const EMPTY_FORM = { name: "", email: "", phone: "", address: "", status: "active" }

export default function SchoolsPage() {
  const list = useFetch<AnyObj[]>(() => schoolsAPI.list().then((r) => r.data?.results || r.data || []), [])
  const usage = useFetch<AnyObj[]>(() => superAdminAPI.usage().then((r) => r.data?.results || r.data || []), [])

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [actionError, setActionError] = useState("")
  const [busy, setBusy] = useState(false)

  // dialogs
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [detailSchool, setDetailSchool] = useState<AnyObj | null>(null)
  const [editSchool, setEditSchool] = useState<AnyObj | null>(null)
  const [suspendTarget, setSuspendTarget] = useState<AnyObj | null>(null)
  const [impersonateSchool, setImpersonateSchool] = useState<AnyObj | null>(null)
  const [impersonateUserId, setImpersonateUserId] = useState("")
  const [impersonateReason, setImpersonateReason] = useState("")

  const usageBySchool = useMemo(() => {
    const map: Record<string, AnyObj> = {}
    for (const row of usage.data || []) map[String(row.school_id)] = row
    return map
  }, [usage.data])

  const rows = useMemo(() => {
    let out = [...(list.data || [])]
    const q = search.trim().toLowerCase()
    if (q) out = out.filter((s) => `${s.name} ${s.email}`.toLowerCase().includes(q))
    if (statusFilter) out = out.filter((s) => String(s.status) === statusFilter)
    if (sortBy === "name") out.sort((a, b) => String(a.name).localeCompare(String(b.name)))
    if (sortBy === "newest") out.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    if (sortBy === "students") out.sort((a, b) => (usageBySchool[b.id]?.students ?? 0) - (usageBySchool[a.id]?.students ?? 0))
    return out
  }, [list.data, search, statusFilter, sortBy, usageBySchool])

  const counts = useMemo(() => {
    const all = list.data || []
    return {
      total: all.length,
      active: all.filter((s) => s.status === "active").length,
      suspended: all.filter((s) => s.status === "suspended").length,
      trial: all.filter((s) => s.status === "trial").length,
    }
  }, [list.data])

  async function run(fn: () => Promise<unknown>, done?: () => void) {
    setActionError("")
    setBusy(true)
    try {
      await fn()
      done?.()
      await Promise.all([list.reload(), usage.reload()])
    } catch (err) {
      setActionError(getErrorMessage(err, "Action failed."))
    } finally {
      setBusy(false)
    }
  }

  function exportCsv() {
    downloadCSV(
      rows.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone ?? "",
        status: s.status,
        plan: usageBySchool[s.id]?.plan ?? "",
        students: usageBySchool[s.id]?.students ?? 0,
        teachers: usageBySchool[s.id]?.teachers ?? 0,
        storage_mb: usageBySchool[s.id]?.storage_used_mb ?? 0,
        revenue: usageBySchool[s.id]?.revenue ?? 0,
        created_at: s.created_at,
      })),
      "schools",
      [
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "status", label: "Status" },
        { key: "plan", label: "Plan" },
        { key: "students", label: "Students" },
        { key: "teachers", label: "Teachers" },
        { key: "storage_mb", label: "Storage MB" },
        { key: "revenue", label: "Revenue" },
        { key: "created_at", label: "Created" },
      ],
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="School Management"
        description="Create, review and manage every school on the platform."
        actions={
          <>
            <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
            <Button onClick={() => { setForm(EMPTY_FORM); setCreateOpen(true) }}>
              <Plus className="h-4 w-4 mr-1" /> Create school
            </Button>
          </>
        }
      />

      {(actionError || list.error) && (
        <div className="glass-red rounded-xl p-3 text-sm text-red-300">{actionError || list.error}</div>
      )}

      <StatCardGrid>
        <StatCard label="Total Schools" value={counts.total} icon={Building2} />
        <StatCard label="Active" value={counts.active} icon={Building2} tone="success" />
        <StatCard label="Trial" value={counts.trial} icon={Building2} tone="warning" />
        <StatCard label="Suspended" value={counts.suspended} icon={ShieldAlert} tone="danger" />
      </StatCardGrid>

      <DataToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search schools..."
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            placeholder: "Status",
            options: [
              { value: "active", label: "Active" },
              { value: "trial", label: "Trial" },
              { value: "suspended", label: "Suspended" },
              { value: "inactive", label: "Inactive" },
            ],
          },
          {
            value: sortBy,
            onChange: setSortBy,
            placeholder: "Sort",
            allLabel: "Default order",
            options: [
              { value: "name", label: "Name A-Z" },
              { value: "newest", label: "Newest first" },
              { value: "students", label: "Most students" },
            ],
          },
        ]}
      />

      <div className="overflow-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>School</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="text-right">Students</TableHead>
              <TableHead className="text-right">Teachers</TableHead>
              <TableHead className="text-right">Storage MB</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.loading &&
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))}
            {!list.loading && !rows.length && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No schools match your filters.
                </TableCell>
              </TableRow>
            )}
            {!list.loading &&
              rows.map((s) => {
                const u = usageBySchool[s.id] || {}
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </TableCell>
                    <TableCell>{u.plan ? <span className="capitalize">{String(u.plan)}</span> : "—"}</TableCell>
                    <TableCell className="text-right">{u.students ?? 0}</TableCell>
                    <TableCell className="text-right">{u.teachers ?? 0}</TableCell>
                    <TableCell className="text-right">{u.storage_used_mb ?? 0}</TableCell>
                    <TableCell className="text-right">GH₵ {Number(u.revenue ?? 0).toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={s.status} /></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetailSchool(s)}>View details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditSchool(s)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              run(s.status === "suspended" ? () => schoolsAPI.activate(s.id) : () => schoolsAPI.suspend(s.id))
                            }
                          >
                            {s.status === "suspended" ? "Activate" : "Suspend"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => { setImpersonateUserId(""); setImpersonateReason(""); setImpersonateSchool(s) }}
                          >
                            Impersonate admin
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>
      </div>

      {/* Create */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create school</DialogTitle>
            <DialogDescription>Register a new school tenant on the platform.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Address"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={busy}>Cancel</Button>
            <Button
              disabled={busy || !form.name}
              onClick={() =>
                run(
                  () =>
                    schoolsAPI.create({
                      ...form,
                      address: form.address || undefined,
                      phone: form.phone || undefined,
                    }),
                  () => setCreateOpen(false),
                )
              }
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details */}
      <Dialog open={!!detailSchool} onOpenChange={(o) => !o && setDetailSchool(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailSchool?.name}</DialogTitle>
            <DialogDescription>School details and statistics.</DialogDescription>
          </DialogHeader>
          {detailSchool && (
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
                <TabsTrigger value="sub">Subscription</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-1.5 text-sm pt-3">
                <Row k="Email" v={detailSchool.email} />
                <Row k="Phone" v={detailSchool.phone} />
                <Row k="Address" v={detailSchool.address} />
                <Row k="Status" v={<StatusBadge status={detailSchool.status} />} />
                <Row k="Created" v={new Date(detailSchool.created_at).toLocaleString()} />
              </TabsContent>
              <TabsContent value="stats" className="pt-3">
                {(() => {
                  const u = usageBySchool[detailSchool.id] || {}
                  return (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <MiniStat label="Students" value={u.students ?? 0} />
                      <MiniStat label="Teachers" value={u.teachers ?? 0} />
                      <MiniStat label="Storage MB" value={u.storage_used_mb ?? 0} />
                      <MiniStat label="Revenue" value={`GH₵ ${Number(u.revenue ?? 0).toLocaleString()}`} />
                    </div>
                  )
                })()}
              </TabsContent>
              <TabsContent value="sub" className="pt-3 space-y-1.5 text-sm">
                <Row k="Plan" v={(usageBySchool[detailSchool.id]?.plan as string) || "—"} />
                <Row k="Status" v={<StatusBadge status={usageBySchool[detailSchool.id]?.status ?? detailSchool.status} />} />
                <Row k="Lifetime revenue" v={`GH₵ ${Number(usageBySchool[detailSchool.id]?.revenue ?? 0).toLocaleString()}`} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editSchool} onOpenChange={(o) => !o && setEditSchool(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit school</DialogTitle></DialogHeader>
          {editSchool && (
            <div className="space-y-3">
              <Field label="Name"><Input value={editSchool.name} onChange={(e) => setEditSchool({ ...editSchool, name: e.target.value })} /></Field>
              <Field label="Email"><Input value={editSchool.email ?? ""} onChange={(e) => setEditSchool({ ...editSchool, email: e.target.value })} /></Field>
              <Field label="Phone"><Input value={editSchool.phone ?? ""} onChange={(e) => setEditSchool({ ...editSchool, phone: e.target.value })} /></Field>
              <Field label="Address"><Input value={editSchool.address ?? ""} onChange={(e) => setEditSchool({ ...editSchool, address: e.target.value })} /></Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSchool(null)} disabled={busy}>Cancel</Button>
            <Button
              disabled={busy}
              onClick={() =>
                editSchool &&
                run(
                  () =>
                    schoolsAPI.update(editSchool.id, {
                      name: editSchool.name,
                      email: editSchool.email,
                      phone: editSchool.phone,
                      address: editSchool.address,
                    }),
                  () => setEditSchool(null),
                )
              }
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Impersonation */}
      <Dialog open={!!impersonateSchool} onOpenChange={(o) => !o && setImpersonateSchool(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Impersonate school admin</DialogTitle>
            <DialogDescription>
              Start a support session as an admin of {impersonateSchool?.name}. Every action you take is recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Admin user ID">
              <Input
                type="number"
                value={impersonateUserId}
                onChange={(e) => setImpersonateUserId(e.target.value)}
                placeholder="e.g. 42"
              />
            </Field>
            <Field label="Reason (required)">
              <Textarea
                value={impersonateReason}
                onChange={(e) => setImpersonateReason(e.target.value)}
                placeholder="Support ticket #123 — investigating login issue"
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImpersonateSchool(null)} disabled={busy}>Close</Button>
            <Button
              variant="destructive"
              disabled={busy || !impersonateUserId || !impersonateReason.trim()}
              onClick={() =>
                run(
                  () => platformAPI.startImpersonation(Number(impersonateUserId), impersonateReason.trim()),
                  () => setImpersonateSchool(null),
                )
              }
            >
              Start impersonation
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => run(() => platformAPI.stopImpersonation())}>
              Stop impersonation
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

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-right truncate">{v || "—"}</span>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold mt-0.5">{value}</p>
    </div>
  )
}
