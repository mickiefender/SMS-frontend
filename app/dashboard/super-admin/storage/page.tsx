"use client"

import { useMemo, useState } from "react"
import {
  CloudUpload,
  Database,
  FileText,
  HardDrive,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { ConfirmDialog } from "@/components/super-admin/confirm-dialog"

const MB_PER_GB = 1024

function fmtGB(mb?: number | null): string {
  return ((Number(mb ?? 0) || 0) / MB_PER_GB).toFixed(2)
}

/** Usage tone: how close a school is to its quota. */
function usageTone(usedMb: number, quotaMb: number): string {
  if (!quotaMb) return "bg-slate-400"
  const pct = (usedMb / quotaMb) * 100
  if (pct >= 90) return "bg-red-500"
  if (pct >= 70) return "bg-amber-500"
  return "bg-emerald-500"
}

function usagePercent(usedMb: number, quotaMb: number): number {
  if (!quotaMb) return 0
  return Math.min(100, Math.round((usedMb / quotaMb) * 100))
}

function UsageBar({ used, quota }: { used: number; quota: number }) {
  const pct = usagePercent(used, quota)
  return (
    <div className="min-w-[160px]">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-medium tabular-nums">
          {fmtGB(used)} / {fmtGB(quota)} GB
        </span>
        <span className="text-muted-foreground tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${usageTone(used, quota)}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

interface QuotaForm {
  school_id: string
  quota_gb: string
}

const EMPTY_FORM: QuotaForm = { school_id: "", quota_gb: "5" }

export default function StorageManagementPage() {
  const quotas = useFetch<AnyObj[]>(
    () => platformAPI.storageQuotas().then((r) => r.data?.results || r.data || []),
    [],
  )
  const schools = useFetch<AnyObj[]>(
    () => schoolsAPI.list().then((r) => r.data?.results || r.data || []),
    [],
  )

  const [actionError, setActionError] = useState("")
  const [busy, setBusy] = useState(false)

  const [search, setSearch] = useState("")

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<AnyObj | null>(null)
  const [form, setForm] = useState<QuotaForm>(EMPTY_FORM)

  const [deleteTarget, setDeleteTarget] = useState<AnyObj | null>(null)

  async function run(fn: () => Promise<unknown>, done?: () => void) {
    setActionError("")
    setBusy(true)
    try {
      await fn()
      done?.()
      await quotas.reload()
      return true
    } catch (err) {
      setActionError(getErrorMessage(err, "Action failed."))
      return false
    } finally {
      setBusy(false)
    }
  }

  function openEditor(quota?: AnyObj) {
    if (quota) {
      setEditing(quota)
      setForm({ school_id: String(quota.school ?? ""), quota_gb: String(((quota.quota_mb ?? 0) / MB_PER_GB).toFixed(2)) })
    } else {
      setEditing(null)
      setForm(EMPTY_FORM)
    }
    setEditorOpen(true)
  }

  function saveQuota() {
    const quotaMb = Math.round(Number(form.quota_gb) * MB_PER_GB)
    if (!editing && !form.school_id) return
    return run(
      () =>
        editing
          ? platformAPI.upsertStorageQuota({ id: editing.id, school: Number(form.school_id), quota_mb: quotaMb })
          : platformAPI.upsertStorageQuota({ school: Number(form.school_id), quota_mb: quotaMb }),
      () => setEditorOpen(false),
    )
  }

  // Schools that don't have a quota row yet — offered when creating one.
  const unassignedSchools = useMemo(() => {
    const taken = new Set((quotas.data || []).map((q) => q.school))
    return (schools.data || []).filter((s) => !taken.has(s.id))
  }, [quotas.data, schools.data])

  const rows = useMemo(() => {
    let out = [...(quotas.data || [])]
    const q = search.trim().toLowerCase()
    if (q) out = out.filter((r) => String(r.school_name ?? "").toLowerCase().includes(q))
    return out.sort(
      (a, b) =>
        (Number(b.used_mb ?? 0) / Math.max(1, Number(b.quota_mb ?? 1))) -
        (Number(a.used_mb ?? 0) / Math.max(1, Number(a.quota_mb ?? 1))),
    )
  }, [quotas.data, search])

  const stats = useMemo(() => {
    const all = quotas.data || []
    const totalUsed = all.reduce((sum, q) => sum + Number(q.used_mb ?? 0), 0)
    const totalQuota = all.reduce((sum, q) => sum + Number(q.quota_mb ?? 0), 0)
    return {
      usedGb: totalUsed / MB_PER_GB,
      quotaGb: totalQuota / MB_PER_GB,
      tracked: all.length,
      over: all.filter((q) => Number(q.quota_mb ?? 0) > 0 && Number(q.used_mb ?? 0) >= Number(q.quota_mb)).length,
    }
  }, [quotas.data])

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Storage Management"
        description="Per-school storage quotas and consumption across videos, images, documents and backups."
        actions={
          <>
            <Button variant="outline" disabled={busy} onClick={() => run(() => platformAPI.recomputeStorage())}>
              <RefreshCw className={`h-4 w-4 mr-1 ${busy ? "animate-spin" : ""}`} /> Recompute usage
            </Button>
            <Button onClick={() => openEditor()} disabled={!unassignedSchools.length}>
              <Plus className="h-4 w-4 mr-1" /> Set quota
            </Button>
          </>
        }
      />

      {(actionError || quotas.error) && (
        <div className="glass-red rounded-xl p-3 text-sm text-red-300">{actionError || quotas.error}</div>
      )}

      <StatCardGrid>
        <StatCard label="Total used" value={`${stats.usedGb.toFixed(1)} GB`} icon={HardDrive} />
        <StatCard label="Total allocated" value={`${stats.quotaGb.toFixed(1)} GB`} icon={Database} tone="primary" />
        <StatCard label="Schools tracked" value={stats.tracked} icon={CloudUpload} />
        <StatCard label="At / over quota" value={stats.over} icon={Trash2} tone={stats.over ? "danger" : "muted"} />
      </StatCardGrid>

      <DataToolbar search={search} onSearch={setSearch} searchPlaceholder="Search schools..." />

      {!unassignedSchools.length && !quotas.loading && (
        <p className="text-xs text-muted-foreground">
          Every school already has a quota. Use “Recompute usage” to refresh consumption figures.
        </p>
      )}

      <div className="overflow-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>School</TableHead>
              <TableHead className="w-56">Usage</TableHead>
              <TableHead>Videos</TableHead>
              <TableHead>Images</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Backups</TableHead>
              <TableHead>Last computed</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotas.loading &&
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))}
            {!quotas.loading && !rows.length && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                  No storage quotas yet. Assign one to start tracking school usage.
                </TableCell>
              </TableRow>
            )}
            {!quotas.loading &&
              rows.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">{q.school_name ?? `School #${q.school}`}</TableCell>
                  <TableCell><UsageBar used={Number(q.used_mb ?? 0)} quota={Number(q.quota_mb ?? 0)} /></TableCell>
                  <TableCell className="text-xs tabular-nums">{fmtGB(q.videos_mb)} GB</TableCell>
                  <TableCell className="text-xs tabular-nums">{fmtGB(q.images_mb)} GB</TableCell>
                  <TableCell className="text-xs tabular-nums">{fmtGB(q.documents_mb)} GB</TableCell>
                  <TableCell className="text-xs tabular-nums">{fmtGB(q.backups_mb)} GB</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {q.computed_at ? new Date(q.computed_at).toLocaleString() : "Never"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEditor(q)} aria-label="Edit quota">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-500"
                        disabled={busy}
                        onClick={() => setDeleteTarget(q)}
                        aria-label="Remove quota tracking"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Breakdown legend */}
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <FileText className="h-3.5 w-3.5" />
        Figures come from uploaded file records. Run “Recompute usage” after bulk imports or deletions to refresh them.
      </p>

      {/* Create / edit quota */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit quota: ${editing.school_name}` : "Set storage quota"}</DialogTitle>
            <DialogDescription>
              Monthly allocation applied to this school's uploaded content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!editing && (
              <Field label="School">
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.school_id}
                  onChange={(e) => setForm({ ...form, school_id: e.target.value })}
                >
                  <option value="">Select a school…</option>
                  {unassignedSchools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {!unassignedSchools.length && (
                  <p className="text-xs text-muted-foreground">All schools already have quotas.</p>
                )}
              </Field>
            )}

            <Field label="Quota (GB)">
              <Input
                type="number"
                min={0.5}
                step={0.5}
                value={form.quota_gb}
                onChange={(e) => setForm({ ...form, quota_gb: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground">Default allocation is 5 GB per school.</p>
            </Field>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)} disabled={busy}>Cancel</Button>
            <Button
              disabled={busy || (!editing && !form.school_id) || !(Number(form.quota_gb) > 0)}
              onClick={saveQuota}
            >
              {editing ? "Save changes" : "Set quota"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove quota */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Stop tracking storage for "${deleteTarget?.school_name}"?`}
        description="Uploaded files are not deleted — only quota enforcement and usage reporting for this school are removed."
        confirmLabel="Stop tracking"
        destructive
        loading={busy}
        onConfirm={() =>
          deleteTarget &&
          run(() => platformAPI.deleteStorageQuota(deleteTarget.id), () => setDeleteTarget(null))
        }
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
