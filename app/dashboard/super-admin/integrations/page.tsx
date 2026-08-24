"use client"

import { useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  Check,
  Copy,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Webhook as WebhookIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { getErrorMessage, platformAPI } from "@/lib/api"
import type { AnyObj } from "@/components/super-admin/types"
import { useFetch } from "@/components/super-admin/use-fetch"
import { PageHeader } from "@/components/super-admin/page-header"
import { StatCard, StatCardGrid } from "@/components/super-admin/stat-card"
import { StatusBadge } from "@/components/super-admin/status-badge"
import { ConfirmDialog } from "@/components/super-admin/confirm-dialog"

const API_SCOPES = [
  "read",
  "write",
  "read:schools",
  "write:schools",
  "read:users",
  "write:users",
  "read:billing",
  "write:billing",
  "admin",
]

const WEBHOOK_EVENTS = [
  "invoice.paid",
  "invoice.created",
  "subscription.renewed",
  "subscription.cancelled",
  "school.created",
  "school.suspended",
  "user.registered",
  "moderation.flagged",
]

function toLocalDateInput(value?: string | null) {
  if (!value) return ""
  const d = new Date(value)
  if (isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// API Key form + one-time secret
// ---------------------------------------------------------------------------

interface ApiKeyForm {
  name: string
  scopes: string[]
  rate_limit_per_min: string
  expires_at: string
}

const EMPTY_API_KEY_FORM: ApiKeyForm = {
  name: "",
  scopes: ["read"],
  rate_limit_per_min: "60",
  expires_at: "",
}

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export default function IntegrationsPage() {
  const apiKeys = useFetch<AnyObj[]>(
    () => platformAPI.apiKeys().then((r) => r.data?.results || r.data || []),
    [],
  )
  const webhooks = useFetch<AnyObj[]>(
    () => platformAPI.webhooks().then((r) => r.data?.results || r.data || []),
    [],
  )

  const [actionError, setActionError] = useState("")
  const [busy, setBusy] = useState(false)

  // ---- API keys ----
  const [apiKeyOpen, setApiKeyOpen] = useState(false)
  const [apiKeyForm, setApiKeyForm] = useState<ApiKeyForm>(EMPTY_API_KEY_FORM)
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<AnyObj | null>(null)
  const [usageKey, setUsageKey] = useState<AnyObj | null>(null)
  const [usage, setUsage] = useState<AnyObj | null>(null)
  const [usageLoading, setUsageLoading] = useState(false)

  // ---- Webhooks ----
  const [webhookOpen, setWebhookOpen] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<AnyObj | null>(null)
  const [webhookForm, setWebhookForm] = useState({
    name: "",
    url: "",
    events: [] as string[],
    is_active: true,
  })
  const [customEvent, setCustomEvent] = useState("")
  const [webhookDeleteTarget, setWebhookDeleteTarget] = useState<AnyObj | null>(null)

  async function run(fn: () => Promise<unknown>, done?: () => void) {
    setActionError("")
    setBusy(true)
    try {
      await fn()
      done?.()
      await Promise.all([apiKeys.reload(), webhooks.reload()])
      return true
    } catch (err) {
      setActionError(getErrorMessage(err, "Action failed."))
      return false
    } finally {
      setBusy(false)
    }
  }

  function openApiKeyDialog() {
    setApiKeyForm(EMPTY_API_KEY_FORM)
    setApiKeyOpen(true)
  }

  function buildApiKeyPayload() {
    return {
      name: apiKeyForm.name.trim(),
      scopes: apiKeyForm.scopes,
      rate_limit_per_min: Math.max(1, Number(apiKeyForm.rate_limit_per_min) || 60),
      expires_at: apiKeyForm.expires_at ? new Date(`${apiKeyForm.expires_at}T23:59:59`).toISOString() : null,
    }
  }

  async function copyKey(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard may be unavailable in insecure contexts; ignore.
    }
  }

  async function fetchUsage(key: AnyObj) {
    setUsageKey(key)
    setUsage(null)
    setUsageLoading(true)
    try {
      const res = await platformAPI.apiKeyUsage(key.id)
      setUsage(res.data ?? null)
    } catch (err) {
      setActionError(getErrorMessage(err, "Could not load usage."))
      setUsageKey(null)
    } finally {
      setUsageLoading(false)
    }
  }

  // Webhooks
  function openWebhookDialog(webhook?: AnyObj) {
    setEdit(webhook)
    if (webhook) {
      setWebhookForm({
        name: webhook.name ?? "",
        url: webhook.url ?? "",
        events: (Array.isArray(webhook.events) ? webhook.events : []) as string[],
        is_active: Boolean(webhook.is_active),
      })
    } else {
      setWebhookForm({ name: "", url: "", events: [], is_active: true })
    }
    setCustomEvent("")
    setWebhookOpen(true)
  }

  const [edit, setEdit] = useState<AnyObj | null>(null)

  function toggleWebhookEvent(event: string) {
    setWebhookForm((f) => ({ ...f, events: toggleValue(f.events, event) }))
  }

  function addCustomEvent() {
    const e = customEvent.trim().toLowerCase().replace(/\s+/g, ".")
    if (!e) return
    if (!webhookForm.events.includes(e)) {
      setWebhookForm((f) => ({ ...f, events: [...f.events, e] }))
    }
    setCustomEvent("")
  }

  function buildWebhookPayload() {
    return {
      name: webhookForm.name.trim(),
      url: webhookForm.url.trim(),
      events: webhookForm.events,
      is_active: webhookForm.is_active,
    }
  }

  const canSaveWebhook = !!webhookForm.name.trim() && /^https?:\/\//i.test(webhookForm.url.trim())

  // Stats
  const stats = useMemo(() => {
    const keys = apiKeys.data || []
    const hooks = webhooks.data || []
    return {
      keys: keys.length,
      activeKeys: keys.filter((k) => k.is_active).length,
      hooks: hooks.length,
      activeHooks: hooks.filter((h) => h.is_active).length,
      hookFailures: hooks.filter((h) => h.is_active).reduce((sum, h) => sum + Number(h.failure_count ?? 0), 0),
    }
  }, [apiKeys.data, webhooks.data])

  const last7Days = useMemo(() => {
    const raw = usage?.last_7_days ?? {}
    if (!Object.keys(raw).length) return []
    const days = Object.keys(raw).sort()
    const max = Math.max(1, ...days.map((d) => Number(raw[d]?.requests ?? 0)))
    return days.map((d) => ({ day: d, ...(raw[d] as AnyObj) ?? {}, max }))
  }, [usage])

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="API & Integrations"
        description="Manage platform API keys for external integrations and outgoing webhooks."
      />

      {(actionError || apiKeys.error || webhooks.error) && (
        <div className="glass-red rounded-xl p-3 text-sm text-red-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {actionError || apiKeys.error || webhooks.error}
        </div>
      )}

      <StatCardGrid>
        <StatCard label="API keys" value={stats.keys} icon={KeyRound} />
        <StatCard label="Active keys" value={stats.activeKeys} icon={Activity} tone="success" />
        <StatCard label="Webhooks" value={stats.hooks} icon={WebhookIcon} tone="primary" />
        <StatCard
          label="Active webhook failures"
          value={stats.hookFailures}
          icon={AlertTriangle}
          tone={stats.hookFailures ? "danger" : "muted"}
        />
      </StatCardGrid>

      <Tabs defaultValue="api-keys">
        <TabsList>
          <TabsTrigger value="api-keys"><KeyRound /> API keys</TabsTrigger>
          <TabsTrigger value="webhooks"><WebhookIcon /> Webhooks</TabsTrigger>
        </TabsList>

        {/* ============================ API KEYS ============================ */}
        <TabsContent value="api-keys" className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Keys authenticate server-to-server requests. The full secret is shown once at creation.
            </p>
            <Button onClick={openApiKeyDialog}><Plus className="h-4 w-4 mr-1" /> New API key</Button>
          </div>

          <div className="overflow-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>Rate limit</TableHead>
                  <TableHead>Last used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.loading &&
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                  ))}
                {!apiKeys.loading && !(apiKeys.data || []).length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      No API keys yet. Create one to authorise external integrations.
                    </TableCell>
                  </TableRow>
                )}
                {!apiKeys.loading &&
                  (apiKeys.data || []).map((k) => (
                    <TableRow key={k.id}>
                      <TableCell>
                        <p className="font-medium">{k.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{k.prefix}••••</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[260px]">
                          {(Array.isArray(k.scopes) ? k.scopes : []).slice(0, 4).map((s: string) => (
                            <Badge key={s} variant="secondary" className="text-[10px] font-mono">{s}</Badge>
                          ))}
                          {(Array.isArray(k.scopes) ? k.scopes : []).length > 4 && (
                            <Badge variant="outline" className="text-[10px]">+{k.scopes.length - 4}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs tabular-nums">{k.rate_limit_per_min ?? "—"}/min</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "Never"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={k.is_active ? "active" : "inactive"} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => fetchUsage(k)} aria-label="View usage">
                            <Activity className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-500"
                            disabled={busy}
                            onClick={() => setRevokeTarget(k)}
                            aria-label={`Revoke ${k.name}`}
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
        </TabsContent>

        {/* ============================ WEBHOOKS ============================ */}
        <TabsContent value="webhooks" className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Webhooks push platform events to your endpoints. Failed deliveries are retried automatically.
            </p>
            <Button onClick={() => openWebhookDialog()}><Plus className="h-4 w-4 mr-1" /> New webhook</Button>
          </div>

          <div className="overflow-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Webhook</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Last delivery</TableHead>
                  <TableHead>Failures</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.loading &&
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                  ))}
                {!webhooks.loading && !(webhooks.data || []).length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      No webhooks configured yet. Add one to receive platform events.
                    </TableCell>
                  </TableRow>
                )}
                {!webhooks.loading &&
                  (webhooks.data || []).map((w) => (
                    <TableRow key={w.id}>
                      <TableCell>
                        <p className="font-medium">{w.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[260px]">{w.url}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[260px]">
                          {(Array.isArray(w.events) ? w.events : []).slice(0, 3).map((e: string) => (
                            <Badge key={e} variant="outline" className="text-[10px] font-mono">{e}</Badge>
                          ))}
                          {(Array.isArray(w.events) ? w.events : []).length > 3 && (
                            <Badge variant="secondary" className="text-[10px]">+{w.events.length - 3}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {w.last_delivery_at ? (
                          <>
                            <span className={Number(w.last_status) >= 400 ? "text-red-500" : "text-emerald-600"}>
                              {w.last_status ?? "—"}
                            </span>
                            <p className="text-muted-foreground">{new Date(w.last_delivery_at).toLocaleString()}</p>
                          </>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs tabular-nums">
                        {Number(w.failure_count ?? 0) > 0 ? (
                          <span className="text-red-500">{w.failure_count}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell><StatusBadge status={w.is_active ? "active" : "inactive"} /></TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openWebhookDialog(w)} aria-label="Edit webhook">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-500"
                            disabled={busy}
                            onClick={() => setWebhookDeleteTarget(w)}
                            aria-label="Delete webhook"
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
        </TabsContent>
      </Tabs>

      {/* -------------------- Create API key -------------------- */}
      <Dialog open={apiKeyOpen} onOpenChange={setApiKeyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New API key</DialogTitle>
            <DialogDescription>
              Grant scoped access for an external integration. Store the generated key securely — it's shown only once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Field label="Name">
              <Input
                value={apiKeyForm.name}
                onChange={(e) => setApiKeyForm({ ...apiKeyForm, name: e.target.value })}
                placeholder="e.g. Analytics export service"
                autoFocus
              />
            </Field>

            <Field label="Scopes">
              <div className="flex flex-wrap gap-2">
                {API_SCOPES.map((scope) => {
                  const active = apiKeyForm.scopes.includes(scope)
                  return (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => setApiKeyForm((f) => ({ ...f, scopes: toggleValue(f.scopes, scope) }))}
                      className={`rounded-md border px-2.5 py-1 text-xs font-mono transition-colors ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {scope}
                    </button>
                  )
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">Select the permissions this key can exercise.</p>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Rate limit (req/min)">
                <Input
                  type="number"
                  min={1}
                  value={apiKeyForm.rate_limit_per_min}
                  onChange={(e) => setApiKeyForm({ ...apiKeyForm, rate_limit_per_min: e.target.value })}
                />
              </Field>
              <Field label="Expires (optional)">
                <Input
                  type="date"
                  value={apiKeyForm.expires_at}
                  onChange={(e) => setApiKeyForm({ ...apiKeyForm, expires_at: e.target.value })}
                />
              </Field>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApiKeyOpen(false)} disabled={busy}>Cancel</Button>
            <Button
              disabled={busy || !apiKeyForm.name.trim() || !apiKeyForm.scopes.length}
              onClick={() =>
                run(async () => {
                  const res = await platformAPI.createApiKey(buildApiKeyPayload())
                  // Surface the one-time secret.
                  setRevealedKey((res.data as AnyObj)?.key ?? "")
                  setApiKeyOpen(false)
                })
              }
            >
              Create key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------- One-time secret -------------------- */}
      <Dialog open={!!revealedKey} onOpenChange={(o) => !o && setRevealedKey(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>API key created</DialogTitle>
            <DialogDescription>
              Copy this key now. For security it will not be shown again — store it in your integration's secrets vault.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <code className="font-mono text-sm break-all flex-1">{revealedKey}</code>
              <Button size="icon" variant="outline" onClick={() => copyKey(revealedKey!)} aria-label="Copy key">
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" /> Copy this key before closing the dialog.
            </p>
          </div>

          <DialogFooter>
            <Button onClick={() => setRevealedKey(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------- Revoke API key -------------------- */}
      <ConfirmDialog
        open={!!revokeTarget}
        onOpenChange={(o) => !o && setRevokeTarget(null)}
        title={`Revoke API key "${revokeTarget?.name}"?`}
        description="Any integration using this key will immediately stop working. This cannot be undone."
        confirmLabel="Revoke key"
        destructive
        loading={busy}
        onConfirm={() =>
          revokeTarget &&
          run(() => platformAPI.revokeApiKey(revokeTarget.id), () => setRevokeTarget(null))
        }
      />

      {/* -------------------- Key usage -------------------- */}
      <Dialog open={!!usageKey} onOpenChange={(o) => !o && setUsageKey(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Usage — {usageKey?.name}</DialogTitle>
            <DialogDescription>Requests and errors over the last 7 days.</DialogDescription>
          </DialogHeader>

          {usageLoading && (
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}

          {!usageLoading && usage && (
            <div className="space-y-3">
              <div className="flex items-baseline gap-3">
                <p className="text-2xl font-bold tabular-nums">{Number(usage.total ?? 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">total requests (7 days)</p>
              </div>

              {last7Days.length ? (
                <div className="space-y-1.5">
                  {last7Days.map((d) => (
                    <div key={d.day} className="flex items-center gap-2">
                      <span className="w-24 shrink-0 text-[11px] text-muted-foreground">{d.day}</span>
                      <div className="h-3 flex-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.round((Number(d.requests ?? 0) / d.max) * 100)}%` }}
                        />
                      </div>
                      <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                        {Number(d.requests ?? 0)}
                      </span>
                      <span className={`w-12 shrink-0 text-right text-[11px] tabular-nums ${Number(d.errors ?? 0) > 0 ? "text-red-500" : "text-muted-foreground"}`}>
                        {Number(d.errors ?? 0)} err
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No usage recorded in the last 7 days.</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUsageKey(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------- Create / edit webhook -------------------- */}
      <Dialog open={webhookOpen} onOpenChange={setWebhookOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{edit ? `Edit webhook: ${edit.name}` : "New webhook"}</DialogTitle>
            <DialogDescription>
              Choose the events to deliver to your endpoint.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Field label="Name">
              <Input
                value={webhookForm.name}
                onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
                placeholder="e.g. Billing notifications"
              />
            </Field>

            <Field label="Endpoint URL">
              <Input
                value={webhookForm.url}
                onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
                placeholder="https://example.com/webhooks/alara"
                className="font-mono"
              />
            </Field>

            <Field label="Events">
              <div className="flex flex-wrap gap-2">
                {WEBHOOK_EVENTS.map((event) => {
                  const active = webhookForm.events.includes(event)
                  return (
                    <button
                      key={event}
                      type="button"
                      onClick={() => toggleWebhookEvent(event)}
                      className={`rounded-md border px-2.5 py-1 text-xs font-mono transition-colors ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {event}
                    </button>
                  )
                })}
                {webhookForm.events
                  .filter((e) => !WEBHOOK_EVENTS.includes(e))
                  .map((event) => (
                    <button
                      key={event}
                      type="button"
                      onClick={() => toggleWebhookEvent(event)}
                      className="rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-mono text-primary"
                    >
                      {event}
                    </button>
                  ))}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={customEvent}
                  onChange={(e) => setCustomEvent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addCustomEvent()
                    }
                  }}
                  placeholder="Custom event, e.g. report.generated"
                  className="h-8 font-mono text-xs flex-1"
                />
                <Button size="sm" variant="outline" onClick={addCustomEvent} className="h-8">Add</Button>
              </div>
            </Field>

            <div className="flex items-center justify-between rounded-lg border border-input px-3 py-2.5">
              <div>
                <Label className="text-sm">Active</Label>
                <p className="text-xs text-muted-foreground">Deliver events when enabled.</p>
              </div>
              <Switch
                checked={webhookForm.is_active}
                onCheckedChange={(checked) => setWebhookForm((f) => ({ ...f, is_active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWebhookOpen(false)} disabled={busy}>Cancel</Button>
            <Button
              disabled={busy || !canSaveWebhook}
              onClick={() =>
                run(
                  () =>
                    edit
                      ? platformAPI.updateWebhook(edit.id, buildWebhookPayload())
                      : platformAPI.createWebhook(buildWebhookPayload()),
                  () => setWebhookOpen(false),
                )
              }
            >
              {edit ? "Save changes" : "Create webhook"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------- Delete webhook -------------------- */}
      <ConfirmDialog
        open={!!webhookDeleteTarget}
        onOpenChange={(o) => !o && setWebhookDeleteTarget(null)}
        title={`Delete webhook "${webhookDeleteTarget?.name}"?`}
        description="The endpoint will stop receiving events immediately. This cannot be undone."
        confirmLabel="Delete webhook"
        destructive
        loading={busy}
        onConfirm={() =>
          webhookDeleteTarget &&
          run(() => platformAPI.deleteWebhook(webhookDeleteTarget.id), () => setWebhookDeleteTarget(null))
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
