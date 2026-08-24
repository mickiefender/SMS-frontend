"use client"

import { useMemo, useState } from "react"
import {
  Flag,
  Globe2,
  Pencil,
  Plus,
  School,
  Trash2,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
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
import { StatusBadge } from "@/components/super-admin/status-badge"
import { ConfirmDialog } from "@/components/super-admin/confirm-dialog"

const SCOPES = [
  { value: "global", label: "Global", icon: Globe2 },
  { value: "school", label: "School", icon: School },
  { value: "plan", label: "Plan", icon: Users },
] as const

type Scope = (typeof SCOPES)[number]["value"]

function scopeMeta(scope: string) {
  return SCOPES.find((s) => s.value === scope)
}

interface FlagForm {
  key: string
  name: string
  description: string
  scope: Scope
  school_id: string
  plan_name: string
  enabled: boolean
  rollout_percent: number
}

const EMPTY_FORM: FlagForm = {
  key: "",
  name: "",
  description: "",
  scope: "global",
  school_id: "",
  plan_name: "",
  enabled: true,
  rollout_percent: 100,
}

function ScopeTarget({ flag }: { flag: AnyObj }) {
  const meta = scopeMeta(String(flag.scope ?? "global"))
  if (!meta) return <span className="text-muted-foreground">—</span>
  const Icon = meta.icon
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p>{meta.label}</p>
        {flag.scope === "school" && flag.school_name && (
          <p className="text-xs text-muted-foreground truncate max-w-[180px]">{flag.school_name}</p>
        )}
        {flag.scope === "plan" && flag.plan_name && (
          <p className="text-xs text-muted-foreground capitalize">{flag.plan_name} plan</p>
        )}
      </div>
    </div>
  )
}

export default function FeatureFlagsPage() {
  const flags = useFetch<AnyObj[]>(
    () => platformAPI.featureFlags({ page_size: 500 }).then((r) => r.data?.results || r.data || []),
    [],
  )
  const schools = useFetch<AnyObj[]>(
    () => schoolsAPI.list().then((r) => r.data?.results || r.data || []),
    [],
  )

  const [actionError, setActionError] = useState("")
  const [busy, setBusy] = useState(false)

  const [search, setSearch] = useState("")
  const [scopeFilter, setScopeFilter] = useState("")

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<AnyObj | null>(null)
  const [form, setForm] = useState<FlagForm>(EMPTY_FORM)
  const [formError, setFormError] = useState("")

  const [deleteTarget, setDeleteTarget] = useState<AnyObj | null>(null)

  async function run(fn: () => Promise<unknown>, done?: () => void) {
    setActionError("")
    setBusy(true)
    try {
      await fn()
      done?.()
      await flags.reload()
      return true
    } catch (err) {
      setActionError(getErrorMessage(err, "Action failed."))
      return false
    } finally {
      setBusy(false)
    }
  }

  function openEditor(flag?: AnyObj) {
    setFormError("")
    if (flag) {
      setEditing(flag)
      setForm({
        key: flag.key ?? "",
        name: flag.name ?? "",
        description: flag.description ?? "",
        scope: (flag.scope ?? "global") as Scope,
        school_id: flag.school ? String(flag.school) : "",
        plan_name: String(flag.plan_name ?? ""),
        enabled: Boolean(flag.enabled),
        rollout_percent: Number(flag.rollout_percent ?? 100),
      })
    } else {
      setEditing(null)
      setForm(EMPTY_FORM)
    }
    setEditorOpen(true)
  }

  // Toggle straight from the table row.
  function toggleEnabled(flag: AnyObj, enabled: boolean) {
    return run(() =>
      platformAPI.updateFeatureFlag(flag.id, {
        key: flag.key,
        name: flag.name,
        description: flag.description,
        scope: flag.scope,
        school: flag.school || null,
        plan_name: flag.plan_name || null,
        enabled,
        rollout_percent: flag.rollout_percent ?? 100,
      }),
    )
  }

  function buildPayload() {
    return {
      key: form.key.trim().toLowerCase(),
      name: form.name.trim(),
      description: form.description.trim(),
      scope: form.scope,
      school:
        form.scope === "school" && form.school_id
          ? Number(form.school_id)
          : null,
      plan_name: form.scope === "plan" ? form.plan_name.trim() : null,
      enabled: form.enabled,
      rollout_percent: Math.max(0, Math.min(100, Math.round(form.rollout_percent))),
    }
  }

  const canSave =
    !!form.key.trim() &&
    /^[a-z][a-z0-9_.-]*$/.test(form.key.trim().toLowerCase()) &&
    !!form.name.trim() &&
    (form.scope !== "school" || !!form.school_id) &&
    (form.scope !== "plan" || !!form.plan_name.trim())

  const rows = useMemo(() => {
    let out = [...(flags.data || [])]
    const q = search.trim().toLowerCase()
    if (q) {
      out = out.filter(
        (f) =>
          String(f.key ?? "").toLowerCase().includes(q) ||
          String(f.name ?? "").toLowerCase().includes(q) ||
          String(f.description ?? "").toLowerCase().includes(q),
      )
    }
    if (scopeFilter) out = out.filter((f) => String(f.scope) === scopeFilter)
    return out.sort(
      (a, b) => String(a.key).localeCompare(String(b.key)) || String(a.scope).localeCompare(String(b.scope)),
    )
  }, [flags.data, search, scopeFilter])

  const stats = useMemo(() => {
    const all = flags.data || []
    return {
      total: all.length,
      enabled: all.filter((f) => f.enabled).length,
      scoped: all.filter((f) => f.scope === "school").length,
      partial: all.filter((f) => Number(f.rollout_percent ?? 100) > 0 && Number(f.rollout_percent ?? 100) < 100).length,
    }
  }, [flags.data])

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Feature Flags"
        description="Turn features on and off globally, per school or per subscription plan, with percentage rollouts for safe gradual releases."
        actions={
          <Button onClick={() => openEditor()}>
            <Plus className="h-4 w-4 mr-1" /> New flag
          </Button>
        }
      />

      {(actionError || flags.error) && (
        <div className="glass-red rounded-xl p-3 text-sm text-red-300">{actionError || flags.error}</div>
      )}

      <StatCardGrid>
        <StatCard label="Total flags" value={stats.total} icon={Flag} />
        <StatCard label="Enabled" value={stats.enabled} icon={Globe2} tone="success" />
        <StatCard label="School-scoped" value={stats.scoped} icon={School} tone="primary" />
        <StatCard label="Partial rollouts" value={stats.partial} icon={Users} tone="warning" />
      </StatCardGrid>

      <DataToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search flags..."
        filters={[
          {
            value: scopeFilter,
            onChange: setScopeFilter,
            placeholder: "Scope",
            options: SCOPES.map((s) => ({ value: s.value, label: s.label })),
          },
        ]}
      />

      <div className="overflow-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Flag</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-44">Rollout</TableHead>
              <TableHead>Last updated</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {flags.loading &&
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))}
            {!flags.loading && !rows.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  No feature flags yet. Create one to start gating features.
                </TableCell>
              </TableRow>
            )}
            {!flags.loading &&
              rows.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <p className="font-medium">{f.name}</p>
                    <p className="text-xs font-mono text-muted-foreground">{f.key}</p>
                    {f.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-sm mt-0.5">
                        {f.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell><ScopeTarget flag={f} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={Boolean(f.enabled)}
                        disabled={busy}
                        onCheckedChange={(checked) => toggleEnabled(f, checked)}
                      />
                      <StatusBadge status={f.enabled ? "active" : "inactive"} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={Number(f.rollout_percent ?? 0)}
                        className="h-2 w-20"
                        aria-label={`${f.rollout_percent}% rollout`}
                      />
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {f.rollout_percent ?? 0}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {f.updated_at ? new Date(f.updated_at).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEditor(f)} aria-label="Edit flag">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-500"
                        disabled={busy}
                        onClick={() => setDeleteTarget(f)}
                        aria-label="Delete flag"
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

      {/* Create / edit flag */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit flag: ${editing.name}` : "New feature flag"}</DialogTitle>
            <DialogDescription>
              Choose who this flag applies to and how gradually it rolls out.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {formError && (
              <div className="glass-red rounded-lg p-2.5 text-sm text-red-300">{formError}</div>
            )}

            <Field label="Key">
              <Input
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                placeholder="e.g. ai.lesson_generator"
                className="font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Lowercase letters, digits, dots, dashes or underscores. Must be unique per scope.
              </p>
            </Field>

            <Field label="Name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Human-readable flag name"
              />
            </Field>

            <Field label="Description (optional)">
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What does this flag gate?"
              />
            </Field>

            <Field label="Scope">
              <div className="flex flex-wrap gap-2">
                {SCOPES.map((s) => {
                  const active = form.scope === s.value
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setForm({ ...form, scope: s.value })}
                      className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                        active
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <s.icon className="h-3.5 w-3.5" />
                      {s.label}
                    </button>
                  )
                })}
              </div>
            </Field>

            {form.scope === "school" && (
              <Field label="School">
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.school_id}
                  onChange={(e) => setForm({ ...form, school_id: e.target.value })}
                >
                  <option value="">Select a school…</option>
                  {(schools.data || []).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </Field>
            )}

            {form.scope === "plan" && (
              <Field label="Subscription plan name">
                <Input
                  value={form.plan_name}
                  onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
                  placeholder="e.g. premium"
                />
              </Field>
            )}

            <Field label={`Rollout — ${form.rollout_percent}% of users`}>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={form.rollout_percent}
                onChange={(e) => setForm({ ...form, rollout_percent: Number(e.target.value) })}
                className="w-full accent-primary cursor-pointer"
              />
              <p className="text-[11px] text-muted-foreground">
                100% serves everyone; lower values release to a fraction of users first.
              </p>
            </Field>

            <div className="flex items-center justify-between rounded-lg border border-input px-3 py-2.5">
              <div>
                <Label className="text-sm">Enabled</Label>
                <p className="text-xs text-muted-foreground">Master switch for this flag.</p>
              </div>
              <Switch
                checked={form.enabled}
                onCheckedChange={(checked) => setForm({ ...form, enabled: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)} disabled={busy}>Cancel</Button>
            <Button
              disabled={busy || !canSave}
              onClick={() =>
                run(
                  () =>
                    editing
                      ? platformAPI.updateFeatureFlag(editing.id, buildPayload())
                      : platformAPI.createFeatureFlag(buildPayload()),
                  () => setEditorOpen(false),
                ).then((ok) => {
                  if (!ok && busy === false) {
                    // Surface server-side validation inside the dialog.
                    setFormError(actionError)
                  }
                })
              }
            >
              {editing ? "Save changes" : "Create flag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete flag */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete flag "${deleteTarget?.name}"?`}
        description={
          deleteTarget?.enabled
            ? "This flag is currently ENABLED — deleting it will turn the gated feature off for everyone it reached. This is recorded in the audit log."
            : "This permanently removes the flag. The deletion is recorded in the audit log."
        }
        confirmLabel="Delete flag"
        destructive
        loading={busy}
        onConfirm={() =>
          deleteTarget &&
          run(() => platformAPI.deleteFeatureFlag(deleteTarget.id), () => setDeleteTarget(null))
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
