"use client"

import { useMemo, useState } from "react"
import { KeyRound, MoreHorizontal, ShieldBan, Users } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getErrorMessage, platformAPI, usersAPI } from "@/lib/api"
import type { AnyObj } from "@/components/super-admin/types"
import { useFetch } from "@/components/super-admin/use-fetch"
import { PageHeader } from "@/components/super-admin/page-header"
import { StatCard, StatCardGrid } from "@/components/super-admin/stat-card"
import { DataToolbar } from "@/components/super-admin/data-toolbar"
import { StatusBadge } from "@/components/super-admin/status-badge"
import { ConfirmDialog } from "@/components/super-admin/confirm-dialog"
import { downloadCSV } from "@/components/super-admin/export"

const ROLES = ["school_admin", "teacher", "student", "parent"]

export default function UsersPage() {
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [actionError, setActionError] = useState("")
  const [busy, setBusy] = useState(false)

  const list = useFetch<AnyObj[]>(
    () =>
      usersAPI
        .listGlobal({ role: roleFilter || undefined, search: search || undefined, page_size: 200 })
        .then((r) => r.data?.results || r.data || []),
    [search, roleFilter],
  )

  const [banTarget, setBanTarget] = useState<AnyObj | null>(null)
  const [pwTarget, setPwTarget] = useState<AnyObj | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [roleTarget, setRoleTarget] = useState<AnyObj | null>(null)
  const [assignRole, setAssignRole] = useState("")
  const [sessionsTarget, setSessionsTarget] = useState<AnyObj | null>(null)

  const rows = useMemo(() => {
    let out = [...(list.data || [])]
    if (statusFilter === "active") out = out.filter((u) => u.is_active)
    if (statusFilter === "inactive") out = out.filter((u) => !u.is_active)
    return out
  }, [list.data, statusFilter])

  const counts = useMemo(() => {
    const all = list.data || []
    const byRole: Record<string, number> = { school_admin: 0, teacher: 0, student: 0, parent: 0, other: 0 }
    for (const u of all) {
      const r = String(u.role ?? "")
      if (byRole[r] !== undefined) byRole[r] += 1
      else byRole.other += 1
    }
    return { total: all.length, school_admin: byRole.school_admin, teacher: byRole.teacher, student: byRole.student, parent: byRole.parent }
  }, [list.data])

  async function run(fn: () => Promise<unknown>, done?: () => void) {
    setActionError("")
    setBusy(true)
    try {
      await fn()
      done?.()
      await list.reload()
    } catch (err) {
      setActionError(getErrorMessage(err, "Action failed."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="User Management"
        description="Manage every user across all schools — admins, teachers, students and parents."
        actions={
          <Button
            variant="outline"
            onClick={() =>
              downloadCSV(
                rows.map((u) => ({
                  id: u.id,
                  name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
                  username: u.username,
                  email: u.email,
                  role: u.role,
                  school: u.school_name ?? u.school ?? "",
                  is_active: u.is_active,
                  last_login: u.last_login ?? "",
                })),
                "users",
                [
                  { key: "id", label: "ID" },
                  { key: "name", label: "Name" },
                  { key: "username", label: "Username" },
                  { key: "email", label: "Email" },
                  { key: "role", label: "Role" },
                  { key: "school", label: "School" },
                  { key: "is_active", label: "Active" },
                  { key: "last_login", label: "Last login" },
                ],
              )
            }
          >
            Export CSV
          </Button>
        }
      />

      {(actionError || list.error) && (
        <div className="glass-red rounded-xl p-3 text-sm text-red-300">{actionError || list.error}</div>
      )}

      <StatCardGrid>
        <StatCard label="Total Users" value={counts.total} icon={Users} />
        <StatCard label="School Admins" value={counts.school_admin} icon={Users} tone="primary" />
        <StatCard label="Teachers" value={counts.teacher} icon={Users} />
        <StatCard label="Students" value={counts.student} icon={Users} tone="success" />
        <StatCard label="Parents" value={counts.parent} icon={Users} tone="muted" />
      </StatCardGrid>

      <DataToolbar
        search={searchInput}
        onSearch={(v) => {
          setSearchInput(v)
          if (!v) setSearch("")
        }}
        searchPlaceholder="Search by name, email or username (press Enter)..."
        filters={[
          {
            value: roleFilter,
            onChange: setRoleFilter,
            placeholder: "Role",
            options: ROLES.map((r) => ({ value: r, label: r.replace("_", " ") })),
          },
          {
            value: statusFilter,
            onChange: setStatusFilter,
            placeholder: "Status",
            options: [
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive / banned" },
            ],
          },
        ]}
      >
        <Button
          variant="secondary"
          onClick={() => setSearch(searchInput.trim())}
          disabled={searchInput.trim() === search}
        >
          Search
        </Button>
      </DataToolbar>

      <div className="overflow-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.loading &&
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))}
            {!list.loading && !rows.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No users found.
                </TableCell>
              </TableRow>
            )}
            {!list.loading &&
              rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <p className="font-medium">{`${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.username}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </TableCell>
                  <TableCell><span className="capitalize">{String(u.role ?? "—").replace("_", " ")}</span></TableCell>
                  <TableCell className="max-w-40 truncate">{u.school_name ?? u.school ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {u.last_login ? new Date(u.last_login).toLocaleString() : "Never"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={u.is_active ? "active" : "banned"} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSessionsTarget(u)}>Logins & sessions</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setRoleTarget(u); setAssignRole(String(u.role ?? "")) }}>
                          Assign global role
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setPwTarget(u); setNewPassword("") }}>
                          <KeyRound className="h-3.5 w-3.5 mr-1" /> Reset password
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-400"
                          onClick={() => setBanTarget(u)}
                          disabled={!u.is_active}
                        >
                          <ShieldBan className="h-3.5 w-3.5 mr-1" /> Ban account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Ban */}
      <ConfirmDialog
        open={!!banTarget}
        onOpenChange={(o) => !o && setBanTarget(null)}
        title={`Ban ${banTarget?.username ?? "user"}?`}
        description="The account will be deactivated immediately and the user will no longer be able to sign in."
        confirmLabel="Ban account"
        destructive
        loading={busy}
        onConfirm={() => banTarget && run(() => usersAPI.banUser(banTarget.id), () => setBanTarget(null))}
      />

      {/* Reset password */}
      <Dialog open={!!pwTarget} onOpenChange={(o) => !o && setPwTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>Set a new password for {pwTarget?.username}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs">New password</Label>
            <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwTarget(null)} disabled={busy}>Cancel</Button>
            <Button
              disabled={busy || newPassword.length < 8}
              onClick={() => pwTarget && run(() => usersAPI.resetPassword(pwTarget.id, newPassword), () => setPwTarget(null))}
            >
              Reset password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign role */}
      <Dialog open={!!roleTarget} onOpenChange={(o) => !o && setRoleTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign global role</DialogTitle>
            <DialogDescription>Change the platform-wide role of {roleTarget?.username}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs">Role</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={assignRole}
              onChange={(e) => setAssignRole(e.target.value)}
            >
              <option value="">Select role</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleTarget(null)} disabled={busy}>Cancel</Button>
            <Button
              disabled={busy || !assignRole}
              onClick={() => roleTarget && run(() => usersAPI.assignGlobalRole(roleTarget.id, assignRole), () => setRoleTarget(null))}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sessions */}
      {sessionsTarget && (
        <SessionsDialog
          user={sessionsTarget}
          onClose={() => setSessionsTarget(null)}
          onRevoked={() => setActionError("")}
          onError={(msg) => setActionError(msg)}
        />
      )}
    </div>
  )
}

function SessionsDialog({
  user,
  onClose,
  onError,
}: {
  user: AnyObj
  onClose: () => void
  onRevoked: () => void
  onError: (msg: string) => void
}) {
  const events = useFetch<AnyObj[]>(() => platformAPI.securityEvents({ user: user.id }).then((r) => r.data?.results || r.data || []), [])
  const sessions = useFetch<AnyObj[]>(() => platformAPI.sessions().then((r) => r.data?.results || r.data || []), [])
  const [busy, setBusy] = useState(false)

  const userSessions = (sessions.data || []).filter((s) => String(s.user ?? s.user_id) === String(user.id))

  async function revoke(id: number) {
    setBusy(true)
    try {
      await platformAPI.revokeSession(id)
      await sessions.reload()
    } catch (err) {
      onError(getErrorMessage(err, "Failed to revoke session."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Logins & sessions — {user.username}</DialogTitle>
          <DialogDescription>Recent security events and active sessions for this user.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Login history</p>
          {events.loading && <Skeleton className="h-20 w-full" />}
          {!events.loading && !(events.data || []).length && (
            <p className="text-sm text-muted-foreground">No recorded security events.</p>
          )}
          {(events.data || []).slice(0, 15).map((e) => (
            <div key={e.id} className="flex flex-wrap items-center gap-2 text-sm rounded-lg border border-border px-3 py-2">
              <StatusBadge status={e.severity} />
              <code className="text-xs">{e.event_type}</code>
              <span className="text-muted-foreground text-xs">{e.ip_address}</span>
              <span className="ml-auto text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Devices / sessions</p>
          {sessions.loading && <Skeleton className="h-20 w-full" />}
          {!sessions.loading && !userSessions.length && (
            <p className="text-sm text-muted-foreground">No sessions found for this user.</p>
          )}
          {userSessions.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-2 text-sm rounded-lg border border-border px-3 py-2">
              <div className="min-w-0">
                <p className="truncate">{[s.device, s.browser, s.os].filter(Boolean).join(" · ") || "Unknown device"}</p>
                <p className="text-xs text-muted-foreground">
                  {s.ip_address} {s.location ? `· ${s.location}` : ""} · {s.last_activity ? new Date(s.last_activity).toLocaleString() : "—"}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <StatusBadge status={s.is_active ? "active" : "revoked"} />
                {s.is_active && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => revoke(s.id)}>
                    Revoke
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
