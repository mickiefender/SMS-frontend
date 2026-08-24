"use client"

import { useMemo, useState } from "react"
import {
  Bell,
  CheckCircle2,
  Clock,
  Mail,
  Megaphone,
  MessageSquare,
  Pencil,
  Plus,
  Send,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { ConfirmDialog } from "@/components/super-admin/confirm-dialog"
import { downloadCSV } from "@/components/super-admin/export"

const CHANNELS = [
  { value: "push", label: "Push", icon: Bell },
  { value: "email", label: "Email", icon: Mail },
  { value: "sms", label: "SMS", icon: MessageSquare },
] as const

type Channel = (typeof CHANNELS)[number]["value"]

const AUDIENCE_TYPES = [
  { value: "all", label: "All users" },
  { value: "school", label: "Specific schools" },
  { value: "role", label: "Specific roles" },
  { value: "users", label: "Specific users" },
  { value: "plan", label: "Subscription plan" },
]

const ROLES = ["student", "teacher", "parent", "school_admin", "super_admin"]

interface CampaignForm {
  name: string
  title: string
  body: string
  channels: Channel[]
  audience_type: string
  audience_schools: number[]
  audience_roles: string[]
  audience_users: string
  audience_plan: string
  scheduled_at: string
}

const EMPTY_FORM: CampaignForm = {
  name: "",
  title: "",
  body: "",
  channels: ["push"],
  audience_type: "all",
  audience_schools: [],
  audience_roles: [],
  audience_users: "",
  audience_plan: "",
  scheduled_at: "",
}

function toLocalInput(value?: string | null) {
  if (!value) return ""
  const d = new Date(value)
  if (isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function buildAudienceFilter(form: CampaignForm): Record<string, unknown> {
  switch (form.audience_type) {
    case "school":
      return { school_ids: form.audience_schools }
    case "role":
      return { roles: form.audience_roles }
    case "users":
      return {
        user_ids: form.audience_users
          .split(/[,\s]+/)
          .map((v) => Number(v.trim()))
          .filter((v) => Number.isFinite(v) && v > 0),
      }
    case "plan":
      return { plan: form.audience_plan.trim() }
    default:
      return {}
  }
}

function ChannelIcons({ channels }: { channels: unknown }) {
  const list = Array.isArray(channels) ? (channels as string[]) : []
  if (!list.length) return <span className="text-muted-foreground">—</span>
  return (
    <div className="flex items-center gap-1">
      {list.map((ch) => {
        const def = CHANNELS.find((c) => c.value === ch)
        const Icon = def?.icon ?? Bell
        return (
          <Badge key={ch} variant="outline" className="gap-1 capitalize font-normal">
            <Icon className="h-3 w-3" />
            {def?.label ?? ch}
          </Badge>
        )
      })}
    </div>
  )
}

function AudienceLabel({ campaign }: { campaign: AnyObj }) {
  const type = String(campaign.audience_type ?? "all")
  const filter = (campaign.audience_filter ?? {}) as AnyObj
  let detail = ""
  if (type === "school") {
    const names = (filter.school_names as string[]) || []
    detail = names.length ? names.join(", ") : `${(filter.school_ids as number[])?.length ?? 0} school(s)`
  } else if (type === "role") {
    detail = ((filter.roles as string[]) || []).join(", ")
  } else if (type === "users") {
    detail = `${(filter.user_ids as number[])?.length ?? 0} user(s)`
  } else if (type === "plan") {
    detail = String(filter.plan ?? "")
  }
  const label = AUDIENCE_TYPES.find((a) => a.value === type)?.label ?? type
  return (
    <div>
      <p>{label}</p>
      {detail && <p className="text-xs text-muted-foreground line-clamp-1">{detail}</p>}
    </div>
  )
}

export default function NotificationsPage() {
  const campaigns = useFetch<AnyObj[]>(() => platformAPI.campaigns({ page_size: 200 }).then((r) => r.data?.results || r.data || []), [])
  const schools = useFetch<AnyObj[]>(() => schoolsAPI.list().then((r) => r.data?.results || r.data || []), [])

  const [actionError, setActionError] = useState("")
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<AnyObj | null>(null)
  const [form, setForm] = useState<CampaignForm>(EMPTY_FORM)

  const [sendTarget, setSendTarget] = useState<AnyObj | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AnyObj | null>(null)

  const rows = useMemo(() => {
    let out = [...(campaigns.data || [])]
    const q = search.trim().toLowerCase()
    if (q) {
      out = out.filter(
        (c) =>
          String(c.name ?? "").toLowerCase().includes(q) ||
          String(c.title ?? "").toLowerCase().includes(q),
      )
    }
    if (statusFilter) out = out.filter((c) => String(c.status) === statusFilter)
    return out
  }, [campaigns.data, search, statusFilter])

  const stats = useMemo(() => {
    const all = campaigns.data || []
    const sent = all.filter((c) => c.status === "sent")
    const delivered = sent.reduce((sum, c) => sum + Number(c.delivered_count ?? 0), 0)
    const failed = sent.reduce((sum, c) => sum + Number(c.failed_count ?? 0), 0)
    const attempts = delivered + failed
    return {
      total: all.length,
      sent: sent.length,
      pending: all.filter((c) => ["draft", "scheduled"].includes(String(c.status))).length,
      deliveryRate: attempts ? Math.round((delivered / attempts) * 100) : 0,
    }
  }, [campaigns.data])

  async function run(fn: () => Promise<unknown>, done?: () => void) {
    setActionError("")
    setBusy(true)
    try {
      await fn()
      done?.()
      await campaigns.reload()
    } catch (err) {
      setActionError(getErrorMessage(err, "Action failed."))
    } finally {
      setBusy(false)
    }
  }

  function openEditor(campaign?: AnyObj) {
    if (campaign) {
      const filter = (campaign.audience_filter ?? {}) as AnyObj
      setEditing(campaign)
      setForm({
        name: campaign.name ?? "",
        title: campaign.title ?? "",
        body: campaign.body ?? "",
        channels: (Array.isArray(campaign.channels) ? campaign.channels : ["push"]) as Channel[],
        audience_type: campaign.audience_type ?? "all",
        audience_schools: (filter.school_ids as number[]) || [],
        audience_roles: (filter.roles as string[]) || [],
        audience_users: ((filter.user_ids as number[]) || []).join(", "),
        audience_plan: String(filter.plan ?? ""),
        scheduled_at: toLocalInput(campaign.scheduled_at),
      })
    } else {
      setEditing(null)
      setForm(EMPTY_FORM)
    }
    setEditorOpen(true)
  }

  function toggleChannel(channel: Channel) {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(channel)
        ? f.channels.filter((c) => c !== channel)
        : [...f.channels, channel],
    }))
  }

  function toggleSchool(id: number) {
    setForm((f) => ({
      ...f,
      audience_schools: f.audience_schools.includes(id)
        ? f.audience_schools.filter((s) => s !== id)
        : [...f.audience_schools, id],
    }))
  }

  function toggleRole(role: string) {
    setForm((f) => ({
      ...f,
      audience_roles: f.audience_roles.includes(role)
        ? f.audience_roles.filter((r) => r !== role)
        : [...f.audience_roles, role],
    }))
  }

  function buildPayload() {
    return {
      name: form.name.trim(),
      title: form.title.trim(),
      body: form.body.trim(),
      channels: form.channels,
      audience_type: form.audience_type,
      audience_filter: buildAudienceFilter(form),
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
    }
  }

  const canSave =
    !!form.name.trim() && !!form.title.trim() && form.channels.length > 0 &&
    (form.audience_type !== "school" || form.audience_schools.length > 0) &&
    (form.audience_type !== "role" || form.audience_roles.length > 0) &&
    (form.audience_type !== "users" || !!form.audience_users.trim()) &&
    (form.audience_type !== "plan" || !!form.audience_plan.trim())

  const canSend = (c: AnyObj) => ["draft", "scheduled", "failed"].includes(String(c.status))

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Notifications"
        description="Create, schedule and broadcast notification campaigns to users across the platform via push, email and SMS."
        actions={
          <Button onClick={() => openEditor()}>
            <Plus className="h-4 w-4 mr-1" /> New campaign
          </Button>
        }
      />

      {(actionError || campaigns.error) && (
        <div className="glass-red rounded-xl p-3 text-sm text-red-300">{actionError || campaigns.error}</div>
      )}

      <StatCardGrid>
        <StatCard label="Total campaigns" value={stats.total} icon={Megaphone} />
        <StatCard label="Sent" value={stats.sent} icon={CheckCircle2} tone="success" />
        <StatCard label="Drafts & scheduled" value={stats.pending} icon={Clock} tone="warning" />
        <StatCard label="Delivery rate" value={`${stats.deliveryRate}%`} icon={Send} tone="primary" />
      </StatCardGrid>

      <DataToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search campaigns..."
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            placeholder: "Status",
            options: [
              { value: "draft", label: "Draft" },
              { value: "scheduled", label: "Scheduled" },
              { value: "sending", label: "Sending" },
              { value: "sent", label: "Sent" },
              { value: "failed", label: "Failed" },
            ],
          },
        ]}
      >
        <Button
          variant="secondary"
          onClick={() =>
            downloadCSV(
              rows.map((c) => ({
                id: c.id,
                name: c.name,
                title: c.title,
                channels: (Array.isArray(c.channels) ? c.channels : []).join("|"),
                audience_type: c.audience_type,
                status: c.status,
                recipient_count: c.recipient_count,
                delivered_count: c.delivered_count,
                failed_count: c.failed_count,
                scheduled_at: c.scheduled_at,
                sent_at: c.sent_at,
                created_at: c.created_at,
              })),
              "notification-campaigns",
              [
                { key: "id", label: "ID" },
                { key: "name", label: "Name" },
                { key: "title", label: "Title" },
                { key: "channels", label: "Channels" },
                { key: "audience_type", label: "Audience" },
                { key: "status", label: "Status" },
                { key: "recipient_count", label: "Recipients" },
                { key: "delivered_count", label: "Delivered" },
                { key: "failed_count", label: "Failed" },
                { key: "scheduled_at", label: "Scheduled At" },
                { key: "sent_at", label: "Sent At" },
                { key: "created_at", label: "Created At" },
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
              <TableHead>Campaign</TableHead>
              <TableHead>Channels</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Delivered</TableHead>
              <TableHead>Schedule / Sent</TableHead>
              <TableHead className="w-40" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.loading &&
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))}
            {!campaigns.loading && !rows.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  No campaigns yet. Create one to start broadcasting notifications.
                </TableCell>
              </TableRow>
            )}
            {!campaigns.loading &&
              rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{c.title}</p>
                  </TableCell>
                  <TableCell><ChannelIcons channels={c.channels} /></TableCell>
                  <TableCell><AudienceLabel campaign={c} /></TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell className="text-right">
                    <span className="text-emerald-600 font-medium">{c.delivered_count ?? 0}</span>
                    {!!Number(c.failed_count) && (
                      <span className="text-red-500 text-xs ml-1">({c.failed_count} failed)</span>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      of {c.recipient_count ?? 0} recipients
                    </p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.status === "sent" && c.sent_at
                      ? new Date(c.sent_at).toLocaleString()
                      : c.scheduled_at
                        ? new Date(c.scheduled_at).toLocaleString()
                        : "Not scheduled"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {canSend(c) && (
                        <Button size="sm" variant="ghost" disabled={busy} onClick={() => setSendTarget(c)}>
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => openEditor(c)} aria-label="Edit campaign">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400"
                        disabled={busy}
                        onClick={() => setDeleteTarget(c)}
                        aria-label="Delete campaign"
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

      {/* Create / edit campaign */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit campaign: ${editing.name}` : "New notification campaign"}</DialogTitle>
            <DialogDescription>
              Compose the message, pick delivery channels and choose who receives it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Field label="Campaign name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Term 2 opening announcement"
              />
            </Field>

            <Field label="Title">
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Notification headline users will see"
              />
            </Field>

            <Field label="Message body">
              <Textarea
                rows={4}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Full message content..."
              />
            </Field>

            <Field label="Delivery channels">
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((ch) => {
                  const active = form.channels.includes(ch.value)
                  return (
                    <button
                      key={ch.value}
                      type="button"
                      onClick={() => toggleChannel(ch.value)}
                      className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                        active
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <ch.icon className="h-3.5 w-3.5" />
                      {ch.label}
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label="Audience">
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.audience_type}
                onChange={(e) => setForm({ ...form, audience_type: e.target.value })}
              >
                {AUDIENCE_TYPES.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </Field>

            {form.audience_type === "school" && (
              <Field label={`Schools (${form.audience_schools.length} selected)`}>
                <div className="max-h-40 overflow-y-auto rounded-md border border-input p-2 space-y-1">
                  {(schools.data || []).map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer py-0.5">
                      <input
                        type="checkbox"
                        checked={form.audience_schools.includes(s.id)}
                        onChange={() => toggleSchool(s.id)}
                        className="accent-primary"
                      />
                      {s.name}
                    </label>
                  ))}
                  {!schools.loading && !(schools.data || []).length && (
                    <p className="text-xs text-muted-foreground p-1">No schools available.</p>
                  )}
                </div>
              </Field>
            )}

            {form.audience_type === "role" && (
              <Field label="Roles">
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((role) => {
                    const active = form.audience_roles.includes(role)
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        className={`rounded-md border px-3 py-1.5 text-sm capitalize transition-colors ${
                          active
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {role.replace(/_/g, " ")}
                      </button>
                    )
                  })}
                </div>
              </Field>
            )}

            {form.audience_type === "users" && (
              <Field label="User IDs (comma separated)">
                <Input
                  value={form.audience_users}
                  onChange={(e) => setForm({ ...form, audience_users: e.target.value })}
                  placeholder="12, 48, 103"
                />
              </Field>
            )}

            {form.audience_type === "plan" && (
              <Field label="Subscription plan">
                <Input
                  value={form.audience_plan}
                  onChange={(e) => setForm({ ...form, audience_plan: e.target.value })}
                  placeholder="e.g. premium"
                />
              </Field>
            )}

            <Field label="Schedule for later (optional)">
              <Input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              />
            </Field>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)} disabled={busy}>Cancel</Button>
            <Button
              disabled={busy || !canSave}
              onClick={() =>
                run(
                  () =>
                    editing
                      ? platformAPI.updateCampaign(editing.id, buildPayload())
                      : platformAPI.createCampaign(buildPayload()),
                  () => setEditorOpen(false),
                )
              }
            >
              {editing ? "Save changes" : "Create campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send campaign */}
      <ConfirmDialog
        open={!!sendTarget}
        onOpenChange={(o) => !o && setSendTarget(null)}
        title={`Send "${sendTarget?.name}"?`}
        description={
          sendTarget?.status === "scheduled"
            ? "This cancels the schedule and delivers the campaign immediately to its audience."
            : "The campaign will be delivered immediately to everyone in its audience. This cannot be undone."
        }
        confirmLabel="Send now"
        loading={busy}
        onConfirm={() =>
          sendTarget &&
          run(() => platformAPI.sendCampaign(sendTarget.id), () => setSendTarget(null))
        }
      />

      {/* Delete campaign */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete campaign "${deleteTarget?.name}"?`}
        description="This permanently removes the campaign. Delivery history is kept in audit logs."
        confirmLabel="Delete campaign"
        destructive
        loading={busy}
        onConfirm={() =>
          deleteTarget &&
          run(() => platformAPI.deleteCampaign(deleteTarget.id), () => setDeleteTarget(null))
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
