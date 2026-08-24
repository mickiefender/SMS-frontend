"use client"

import { useMemo, useState } from "react"
import { Plus, ShieldCheck, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { getErrorMessage, platformAPI } from "@/lib/api"
import type { AnyObj } from "@/components/super-admin/types"
import { useFetch } from "@/components/super-admin/use-fetch"
import { PageHeader } from "@/components/super-admin/page-header"
import { StatCard, StatCardGrid } from "@/components/super-admin/stat-card"
import { StatusBadge } from "@/components/super-admin/status-badge"
import { ConfirmDialog } from "@/components/super-admin/confirm-dialog"

const PERMISSION_CATALOG: Record<string, string[]> = {
  Schools: ["schools.view", "schools.create", "schools.edit", "schools.suspend", "schools.delete", "schools.impersonate"],
  Users: ["users.view", "users.edit", "users.ban", "users.reset_password"],
  Finance: ["finance.view", "finance.refund", "finance.invoices", "finance.coupons"],
  Content: ["content.moderate", "content.delete"],
  Platform: ["platform.settings", "platform.flags", "platform.roles", "platform.audit", "platform.apikeys", "platform.monitoring"],
}

const ALL_PERMISSIONS = Object.values(PERMISSION_CATALOG).flat()

const EMPTY_ROLE = { display_name: "", name: "", description: "", permissions: [] as string[] }

export default function RolesPage() {
  const roles = useFetch<AnyObj[]>(() => platformAPI.roles().then((r) => r.data?.results || r.data || []), [])
  const assignments = useFetch<AnyObj[]>(() => platformAPI.roleAssignments().then((r) => r.data?.results || r.data || []), [])

  const [actionError, setActionError] = useState("")
  const [busy, setBusy] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AnyObj | null>(null)
  const [form, setForm] = useState(EMPTY_ROLE)
  const [deleteTarget, setDeleteTarget] = useState<AnyObj | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignUserId, setAssignUserId] = useState("")
  const [assignRoleId, setAssignRoleId] = useState("")
  const [unassignTarget, setUnassignTarget] = useState<AnyObj | null>(null)

  async function run(fn: () => Promise<unknown>, done?: () => void) {
    setActionError("")
    setBusy(true)
    try {
      await fn()
      done?.()
      await Promise.all([roles.reload(), assignments.reload()])
    } catch (err) {
      setActionError(getErrorMessage(err, "Action failed."))
    } finally {
      setBusy(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_ROLE)
    setDialogOpen(true)
  }

  function openEdit(role: AnyObj) {
    setEditing(role)
    setForm({
      display_name: role.display_name ?? "",
      name: role.name ?? "",
      description: role.description ?? "",
      permissions: Array.isArray(role.permissions) ? [...role.permissions] : [],
    })
    setDialogOpen(true)
  }

  function togglePermission(p: string) {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(p) ? f.permissions.filter((x) => x !== p) : [...f.permissions, p],
    }))
  }

  function slugify(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Configure internal platform roles and their granular permissions."
        actions={
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New role</Button>
        }
      />

      {(actionError || roles.error) && (
        <div className="glass-red rounded-xl p-3 text-sm text-red-300">{actionError || roles.error}</div>
      )}

      <StatCardGrid>
        <StatCard label="Roles" value={(roles.data || []).length} icon={ShieldCheck} />
        <StatCard label="System roles" value={(roles.data || []).filter((r) => r.is_system).length} icon={ShieldCheck} tone="primary" />
        <StatCard label="Custom roles" value={(roles.data || []).filter((r) => !r.is_system).length} icon={ShieldCheck} tone="muted" />
        <StatCard label="Active assignments" value={(assignments.data || []).length} icon={ShieldCheck} tone="success" />
      </StatCardGrid>

      <Tabs defaultValue="roles">
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        {/* Roles */}
        <TabsContent value="roles">
          <div className="overflow-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead className="text-right">Permissions</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.loading &&
                  [...Array(4)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))}
                {!roles.loading && !(roles.data || []).length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No roles defined.</TableCell>
                  </TableRow>
                )}
                {!roles.loading &&
                  (roles.data || []).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <p className="font-medium">{r.display_name}</p>
                        {r.description && <p className="text-xs text-muted-foreground line-clamp-1">{r.description}</p>}
                      </TableCell>
                      <TableCell><code className="text-xs">{r.name}</code></TableCell>
                      <TableCell className="text-right">{(r.permissions || []).length}</TableCell>
                      <TableCell><StatusBadge status={r.is_system ? "system" : "custom"} /></TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>Edit</Button>
                          {!r.is_system && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400"
                              onClick={() => setDeleteTarget(r)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

        {/* Assignments */}
        <TabsContent value="assignments" className="space-y-3">
          <Button variant="outline" onClick={() => { setAssignUserId(""); setAssignRoleId(""); setAssignOpen(true) }}>
            <Plus className="h-4 w-4 mr-1" /> Assign role to user
          </Button>
          <div className="overflow-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned at</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.loading &&
                  [...Array(4)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))}
                {!assignments.loading && !(assignments.data || []).length && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No active assignments.</TableCell>
                  </TableRow>
                )}
                {!assignments.loading &&
                  (assignments.data || []).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.user_name ?? a.user_id}</TableCell>
                      <TableCell>{a.role_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(a.assigned_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="text-red-400" onClick={() => setUnassignTarget(a)}>
                          Unassign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create / edit role */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.display_name}` : "Create role"}</DialogTitle>
            <DialogDescription>Pick the exact permissions this role grants.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Display name">
              <Input
                value={form.display_name}
                onChange={(e) =>
                  setForm({ ...form, display_name: e.target.value, ...(editing ? {} : { name: slugify(e.target.value) }) })
                }
              />
            </Field>
            <Field label="Key name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Description">
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <div className="space-y-3 pt-1">
              {Object.entries(PERMISSION_CATALOG).map(([group, perms]) => (
                <div key={group}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">{group}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {perms.map((p) => (
                      <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={form.permissions.includes(p)} onCheckedChange={() => togglePermission(p)} />
                        <code className="text-xs">{p}</code>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={busy}>Cancel</Button>
            <Button
              disabled={busy || !form.display_name || !form.name}
              onClick={() =>
                run(
                  () =>
                    editing
                      ? platformAPI.updateRole(editing.id, form)
                      : platformAPI.createRole(form),
                  () => setDialogOpen(false),
                )
              }
            >
              {editing ? "Save changes" : "Create role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete role */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete role "${deleteTarget?.display_name}"?`}
        description="Users assigned to this role will lose its permissions immediately."
        confirmLabel="Delete role"
        destructive
        loading={busy}
        onConfirm={() => deleteTarget && run(() => platformAPI.deleteRole(deleteTarget.id), () => setDeleteTarget(null))}
      />

      {/* Assign */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign role</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Field label="User ID">
              <Input type="number" value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} placeholder="e.g. 12" />
            </Field>
            <Field label="Role">
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={assignRoleId}
                onChange={(e) => setAssignRoleId(e.target.value)}
              >
                <option value="">Select role</option>
                {(roles.data || []).map((r) => (
                  <option key={r.id} value={String(r.id)}>{r.display_name}</option>
                ))}
              </select>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)} disabled={busy}>Cancel</Button>
            <Button
              disabled={busy || !assignUserId || !assignRoleId}
              onClick={() =>
                run(() => platformAPI.assignRole(Number(assignRoleId), Number(assignUserId)), () => setAssignOpen(false))
              }
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unassign */}
      <ConfirmDialog
        open={!!unassignTarget}
        onOpenChange={(o) => !o && setUnassignTarget(null)}
        title={`Remove role "${unassignTarget?.role_name}" from ${unassignTarget?.user_name}?`}
        confirmLabel="Unassign"
        destructive
        loading={busy}
        onConfirm={() =>
          unassignTarget &&
          run(
            () => platformAPI.unassignRole(unassignTarget.role_id ?? unassignTarget.role, unassignTarget.user_id ?? unassignTarget.user),
            () => setUnassignTarget(null),
          )
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
