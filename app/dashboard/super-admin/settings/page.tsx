"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  BellRing,
  Check,
  CreditCard,
  Eye,
  EyeOff,
  HardDrive,
  LayoutGrid,
  Lock,
  Mail,
  MessageSquare,
  Palette,
  Plus,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getErrorMessage, platformAPI } from "@/lib/api"
import type { AnyObj } from "@/components/super-admin/types"
import { useFetch } from "@/components/super-admin/use-fetch"
import { PageHeader } from "@/components/super-admin/page-header"
import { StatCard, StatCardGrid } from "@/components/super-admin/stat-card"
import { ConfirmDialog } from "@/components/super-admin/confirm-dialog"

// ---------------------------------------------------------------------------
// Category metadata (mirrors SystemSetting.CATEGORY_CHOICES on the backend)
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { value: "general", label: "General", icon: Settings2, description: "Platform name, defaults and locale" },
  { value: "branding", label: "Branding", icon: Palette, description: "Logos, colours and public identity" },
  { value: "email", label: "Email", icon: Mail, description: "SMTP provider and sending configuration" },
  { value: "sms", label: "SMS", icon: MessageSquare, description: "SMS gateway provider and credentials" },
  { value: "push", label: "Push", icon: BellRing, description: "Push notification service credentials" },
  { value: "payments", label: "Payments", icon: CreditCard, description: "Payment gateway API keys" },
  { value: "storage", label: "Storage", icon: HardDrive, description: "File storage buckets and retention" },
  { value: "ai", label: "AI", icon: Sparkles, description: "AI providers, models and rate limits" },
  { value: "security", label: "Security", icon: ShieldCheck, description: "Security policies and thresholds" },
] as const

type CategoryValue = (typeof CATEGORIES)[number]["value"]

function categoryMeta(value: string) {
  return CATEGORIES.find((c) => c.value === value)
}

const SECRET_MASK = "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"

// ---------------------------------------------------------------------------
// Value editing helpers
// ---------------------------------------------------------------------------

type EditorKind = "boolean" | "number" | "text" | "json"

type Draft = {
  kind: EditorKind
  /** String representation for number / text / json editors. */
  text: string
  /** Value for the boolean switch editor. */
  checked: boolean
}

function editorKindOf(setting: AnyObj): EditorKind {
  const v = setting.value
  if (typeof v === "boolean") return "boolean"
  if (!setting.is_secret && typeof v === "number") return "number"
  if (!setting.is_secret && v !== null && typeof v === "object") return "json"
  return "text"
}

function serializeOriginal(kind: EditorKind, setting: AnyObj): string {
  const v = setting.value
  if (kind === "json") return JSON.stringify(v ?? null, null, 2)
  if (kind === "number") return String(v ?? "")
  return String(v ?? "")
}

function draftFor(setting: AnyObj): Draft {
  const kind = editorKindOf(setting)
  return {
    kind,
    text: serializeOriginal(kind, setting),
    checked: Boolean(setting.value),
  }
}

/** Parse a draft into the JSON value sent to the API. Throws on invalid input. */
function parseDraft(draft: Draft): unknown {
  if (draft.kind === "boolean") return draft.checked
  if (draft.kind === "number") {
    const n = Number(draft.text.trim())
    if (!Number.isFinite(n)) throw new Error("Enter a valid number")
    return n
  }
  if (draft.kind === "json") {
    try {
      return JSON.parse(draft.text)
    } catch {
      throw new Error("Invalid JSON")
    }
  }
  return draft.text
}

function isDirty(setting: AnyObj, draft: Draft): boolean {
  if (draft.kind === "boolean") return draft.checked !== Boolean(setting.value)
  return draft.text !== serializeOriginal(draft.kind, setting)
}

function humanizeKey(key: string) {
  return key
    .replace(/[-_.]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

// ---------------------------------------------------------------------------
// New-setting dialog form
// ---------------------------------------------------------------------------

type ValueTypeChoice = "text" | "number" | "boolean" | "json"

interface NewForm {
  key: string
  category: CategoryValue
  description: string
  is_secret: boolean
  valueType: ValueTypeChoice
  value_text: string
  value_number: string
  value_bool: boolean
  value_json: string
}

const EMPTY_NEW_FORM: NewForm = {
  key: "",
  category: "general",
  description: "",
  is_secret: false,
  valueType: "text",
  value_text: "",
  value_number: "",
  value_bool: false,
  value_json: "{}",
}

function buildNewSettingPayload(form: NewForm) {
  let value: unknown
  if (form.valueType === "boolean") value = form.value_bool
  else if (form.valueType === "number") {
    const n = Number(form.value_number.trim())
    if (!Number.isFinite(n)) throw new Error("Initial value must be a number")
    value = n
  } else if (form.valueType === "json") {
    value = JSON.parse(form.value_json || "null")
  } else {
    value = form.value_text
  }

  const key = form.key.trim().toLowerCase()
  if (!/^[a-z][a-z0-9_.-]*$/.test(key)) {
    throw new Error("Key must be lowercase letters, digits, dots, dashes or underscores")
  }

  return {
    key,
    category: form.category,
    description: form.description.trim(),
    is_secret: form.is_secret,
    value,
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SystemSettingsPage() {
  const settings = useFetch<AnyObj[]>(
    () => platformAPI.settings({ page_size: 500 }).then((r) => r.data?.results || r.data || []),
    [],
  )

  const [actionError, setActionError] = useState("")
  const [busy, setBusy] = useState(false)

  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")

  const [drafts, setDrafts] = useState<Record<number, Draft>>({})

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<NewForm>(EMPTY_NEW_FORM)
  const [createError, setCreateError] = useState("")

  const [deleteTarget, setDeleteTarget] = useState<AnyObj | null>(null)

  const [revealedSecrets, setRevealedSecrets] = useState<Record<number, boolean>>({})

  // Re-seed local drafts whenever fresh data arrives (after load or save).
  useEffect(() => {
    if (!settings.data) return
    const next: Record<number, Draft> = {}
    for (const s of settings.data) next[s.id] = draftFor(s)
    setDrafts(next)
    setRevealedSecrets({})
  }, [settings.data])

  const byId = useMemo(() => {
    const map: Record<number, AnyObj> = {}
    for (const s of settings.data || []) map[s.id] = s
    return map
  }, [settings.data])

  const countsByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of settings.data || []) map[s.category] = (map[s.category] || 0) + 1
    return map
  }, [settings.data])

  const filtered = useMemo(() => {
    let out = [...(settings.data || [])]
    if (activeCategory !== "all") out = out.filter((s) => s.category === activeCategory)
    const q = search.trim().toLowerCase()
    if (q) {
      out = out.filter(
        (s) =>
          String(s.key ?? "").toLowerCase().includes(q) ||
          String(s.description ?? "").toLowerCase().includes(q),
      )
    }
    return out.sort((a, b) => String(a.category).localeCompare(String(b.category)) || String(a.key).localeCompare(String(b.key)))
  }, [settings.data, activeCategory, search])

  // Group the visible rows into category sections (in canonical order).
  const sections = useMemo(() => {
    return CATEGORIES.map((c) => ({ ...c, items: filtered.filter((s) => s.category === c.value) })).filter(
      (sec) => sec.items.length > 0,
    )
  }, [filtered])

  const stats = useMemo(() => {
    const all = settings.data || []
    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000
    return {
      total: all.length,
      categories: Object.keys(countsByCategory).length,
      secrets: all.filter((s) => s.is_secret).length,
      recent: all.filter((s) => s.updated_at && new Date(s.updated_at).getTime() >= weekAgo).length,
    }
  }, [settings.data, countsByCategory])

  const dirtyEntries = useMemo(
    () =>
      Object.entries(drafts)
        .map(([id, d]) => ({ id: Number(id), draft: d }))
        .filter(({ id, draft }) => byId[id] && isDirty(byId[id], draft)),
    [drafts, byId],
  )

  const validationErrors = useMemo(() => {
    const errs: Record<number, string> = {}
    for (const { id, draft } of dirtyEntries) {
      try {
        parseDraft(draft)
      } catch (e) {
        errs[id] = e instanceof Error ? e.message : "Invalid value"
      }
    }
    return errs
  }, [dirtyEntries])

  const hasValidationErrors = Object.keys(validationErrors).length > 0

  function updateDraft(id: number, patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  function revertDraft(id: number) {
    const s = byId[id]
    if (!s) return
    setDrafts((prev) => ({ ...prev, [id]: draftFor(s) }))
  }

  function discardAll() {
    const next: Record<number, Draft> = {}
    for (const s of settings.data || []) next[s.id] = draftFor(s)
    setDrafts(next)
  }

  async function saveAll() {
    if (!dirtyEntries.length || hasValidationErrors) return
    setActionError("")
    setBusy(true)
    try {
      for (const { id, draft } of dirtyEntries) {
        await platformAPI.updateSetting(id, { value: parseDraft(draft) })
      }
      await settings.reload()
    } catch (err) {
      setActionError(getErrorMessage(err, "Could not save some settings."))
    } finally {
      setBusy(false)
    }
  }

  async function runAction(fn: () => Promise<unknown>, done?: () => void) {
    setActionError("")
    setBusy(true)
    try {
      await fn()
      done?.()
      await settings.reload()
    } catch (err) {
      setActionError(getErrorMessage(err, "Action failed."))
    } finally {
      setBusy(false)
    }
  }

  function openCreate() {
    setCreateForm(EMPTY_NEW_FORM)
    setCreateError("")
    setCreateOpen(true)
  }

  const canSubmitCreate =
    !!createForm.key.trim() &&
    (createForm.valueType !== "number" || Number.isFinite(Number(createForm.value_number)))

  const totalInScope =
    activeCategory === "all" ? stats.total : countsByCategory[activeCategory] || 0

  return (
    <div className="p-4 md:p-6 space-y-6 pb-28">
      <PageHeader
        title="System Settings"
        description="Central configuration for the whole Alara platform. Every change here applies globally and is recorded in the audit log."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> Add setting
          </Button>
        }
      />

      {(actionError || settings.error) && (
        <div className="glass-red rounded-xl p-3 text-sm text-red-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {actionError || settings.error}
        </div>
      )}

      <StatCardGrid>
        <StatCard label="Total settings" value={stats.total} icon={Settings2} />
        <StatCard label="Categories in use" value={stats.categories} icon={LayoutGrid} tone="primary" />
        <StatCard label="Secret settings" value={stats.secrets} icon={Lock} tone="warning" />
        <StatCard label="Updated this week" value={stats.recent} icon={Check} tone="success" />
      </StatCardGrid>

      <div className="grid lg:grid-cols-[230px_1fr] gap-6 items-start">
        {/* Category rail */}
        <nav aria-label="Setting categories" className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible lg:sticky lg:top-20 glass-card p-2">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`sa-cat-link shrink-0 ${activeCategory === "all" ? "is-active" : ""}`}
            data-active={activeCategory === "all"}
          >
            <LayoutGrid className="h-4 w-4 shrink-0" />
            <span className="truncate">All categories</span>
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">{stats.total}</span>
          </button>
          <Separator className="hidden lg:block my-1" />
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setActiveCategory(c.value)}
              className="sa-cat-link shrink-0"
              data-active={activeCategory === c.value}
            >
              <c.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{c.label}</span>
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                {countsByCategory[c.value] || 0}
              </span>
            </button>
          ))}
        </nav>

        {/* Settings list */}
        <div className="min-w-0 space-y-8">
          {/* Scope header + search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight">
                {activeCategory === "all" ? "All categories" : categoryMeta(activeCategory)?.label}
              </h2>
              <p className="text-sm text-muted-foreground truncate">
                {activeCategory === "all"
                  ? `${totalInScope} setting${totalInScope === 1 ? "" : "s"} configured platform-wide`
                  : categoryMeta(activeCategory)?.description}
              </p>
            </div>
            <div className="relative sm:ml-auto sm:w-72 shrink-0">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search settings…"
                className="pl-8"
              />
              <SearchIcon />
            </div>
          </div>

          {settings.loading &&
            [...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}

          {!settings.loading && !sections.length && (
            <div className="glass-card p-10 text-center">
              <Settings2 className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">No settings found</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {search
                  ? "Nothing matches your search. Try a different keyword."
                  : "This category is empty. Add a setting to configure it."}
              </p>
              {!search && (
                <Button variant="outline" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-1" /> Add setting
                </Button>
              )}
            </div>
          )}

          {!settings.loading &&
            sections.map((section) => (
              <section key={section.value} className="space-y-3">
                <div className="flex items-baseline gap-2 px-1">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.label}
                  </h3>
                  <span className="text-xs text-muted-foreground">{section.items.length}</span>
                </div>

                {section.items.map((setting) => {
                  const draft = drafts[setting.id]
                  if (!draft) return null
                  const dirty = isDirty(setting, draft)
                  const invalid = validationErrors[setting.id]

                  return (
                    <div
                      key={setting.id}
                      className={`glass-card p-4 transition-colors ${
                        dirty ? "ring-1 ring-primary/40" : ""
                      }`}
                    >
                      {/* Row header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-mono text-sm font-medium truncate">{setting.key}</p>
                            <span className="text-sm text-muted-foreground">
                              {humanizeKey(setting.key)}
                            </span>
                            {setting.is_secret && (
                              <Badge variant="outline" className="gap-1 text-[10px] border-amber-200 bg-amber-50 text-amber-700">
                                <Lock className="h-2.5 w-2.5" /> Secret
                              </Badge>
                            )}
                            {activeCategory === "all" && (
                              <Badge variant="secondary" className="text-[10px] capitalize">
                                {String(setting.category)}
                              </Badge>
                            )}
                          </div>
                          {setting.description ? (
                            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">{setting.description}</p>
                          ) : null}
                          <p className="text-[11px] text-muted-foreground/70 mt-1">
                            Last updated{" "}
                            {setting.updated_at ? new Date(setting.updated_at).toLocaleString() : "—"}
                          </p>
                        </div>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="shrink-0 text-red-400 hover:text-red-500"
                          disabled={busy}
                          onClick={() => setDeleteTarget(setting)}
                          aria-label={`Delete ${setting.key}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Editor */}
                      <div className="mt-3">
                        {draft.kind === "boolean" && (
                          <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2">
                            <Label className="text-sm cursor-pointer">Enabled</Label>
                            <Switch
                              checked={draft.checked}
                              onCheckedChange={(checked) => updateDraft(setting.id, { checked })}
                              disabled={busy}
                            />
                          </div>
                        )}

                        {draft.kind === "number" && (
                          <Input
                            type="number"
                            value={draft.text}
                            onChange={(e) => updateDraft(setting.id, { text: e.target.value })}
                            disabled={busy}
                            className={invalid ? "border-destructive focus-visible:ring-destructive" : ""}
                          />
                        )}

                        {draft.kind === "text" && !setting.is_secret && (
                          <Input
                            value={draft.text}
                            onChange={(e) => updateDraft(setting.id, { text: e.target.value })}
                            disabled={busy}
                            placeholder="No value set"
                          />
                        )}

                        {draft.kind === "text" && setting.is_secret && (
                          <div className="relative">
                            <Input
                              type={revealedSecrets[setting.id] ? "text" : "password"}
                              value={draft.text}
                              onChange={(e) => updateDraft(setting.id, { text: e.target.value })}
                              disabled={busy}
                              autoComplete="off"
                              className="pr-10 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setRevealedSecrets((prev) => ({
                                  ...prev,
                                  [setting.id]: !prev[setting.id],
                                }))
                              }
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              aria-label={revealedSecrets[setting.id] ? "Hide value" : "Show value"}
                            >
                              {revealedSecrets[setting.id] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                            <p className="text-[11px] text-muted-foreground mt-1.5">
                              Secrets are write-only. Leaving this as “{SECRET_MASK}” keeps the stored value.
                            </p>
                          </div>
                        )}

                        {draft.kind === "json" && (
                          <div>
                            <Textarea
                              rows={Math.min(10, Math.max(4, draft.text.split("\n").length))}
                              value={draft.text}
                              onChange={(e) => updateDraft(setting.id, { text: e.target.value })}
                              disabled={busy}
                              spellCheck={false}
                              className={`font-mono text-xs leading-relaxed ${
                                invalid ? "border-destructive focus-visible:ring-destructive" : ""
                              }`}
                            />
                            {invalid && (
                              <p className="text-xs text-destructive mt-1.5">{invalid}</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Dirty footer */}
                      {dirty && (
                        <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                          <span className="text-xs text-muted-foreground">Unsaved change</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="ml-auto h-7 text-xs"
                            disabled={busy}
                            onClick={() => revertDraft(setting.id)}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" /> Revert
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </section>
            ))}
        </div>
      </div>

      {/* Sticky unsaved-changes bar */}
      {dirtyEntries.length > 0 && (
        <div className="fixed bottom-4 inset-x-0 z-30 px-4 pointer-events-none">
          <div className="glass-card mx-auto max-w-xl px-4 py-3 flex items-center gap-3 pointer-events-auto shadow-lg">
            <AlertTriangle className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm font-medium">
              {dirtyEntries.length} unsaved change{dirtyEntries.length === 1 ? "" : "s"}
              {hasValidationErrors && (
                <span className="text-destructive font-normal"> · fix invalid values first</span>
              )}
            </p>
            <Button variant="ghost" size="sm" className="ml-auto" disabled={busy} onClick={discardAll}>
              Discard
            </Button>
            <Button size="sm" disabled={busy || hasValidationErrors} onClick={saveAll}>
              <Check className="h-4 w-4 mr-1" /> Save all
            </Button>
          </div>
        </div>
      )}

      {/* Create setting */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add system setting</DialogTitle>
            <DialogDescription>
              Define a new global configuration entry. It appears under its chosen category immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {createError && (
              <div className="glass-red rounded-lg p-2.5 text-sm text-red-300">{createError}</div>
            )}

            <Field label="Key">
              <Input
                value={createForm.key}
                onChange={(e) => setCreateForm({ ...createForm, key: e.target.value })}
                placeholder="e.g. email.from_address"
                className="font-mono"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                Lowercase letters, digits, dots, dashes or underscores. Must be unique.
              </p>
            </Field>

            <Field label="Category">
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={createForm.category}
                onChange={(e) => setCreateForm({ ...createForm, category: e.target.value as CategoryValue })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Description (optional)">
              <Input
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="What does this setting control?"
              />
            </Field>

            <Field label="Value type">
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={createForm.valueType}
                onChange={(e) =>
                  setCreateForm({ ...createForm, valueType: e.target.value as ValueTypeChoice })
                }
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="boolean">Toggle (on/off)</option>
                <option value="json">JSON</option>
              </select>
            </Field>

            {createForm.valueType === "text" && (
              <Field label="Initial value">
                <Input
                  value={createForm.value_text}
                  onChange={(e) => setCreateForm({ ...createForm, value_text: e.target.value })}
                  placeholder="Leave empty for no value"
                />
              </Field>
            )}

            {createForm.valueType === "number" && (
              <Field label="Initial value">
                <Input
                  type="number"
                  value={createForm.value_number}
                  onChange={(e) => setCreateForm({ ...createForm, value_number: e.target.value })}
                  placeholder="0"
                />
              </Field>
            )}

            {createForm.valueType === "boolean" && (
              <div className="flex items-center justify-between rounded-lg border border-input px-3 py-2">
                <Label className="text-sm">Enabled</Label>
                <Switch
                  checked={createForm.value_bool}
                  onCheckedChange={(checked) => setCreateForm({ ...createForm, value_bool: checked })}
                />
              </div>
            )}

            {createForm.valueType === "json" && (
              <Field label="Initial value (JSON)">
                <Textarea
                  rows={4}
                  value={createForm.value_json}
                  onChange={(e) => setCreateForm({ ...createForm, value_json: e.target.value })}
                  spellCheck={false}
                  className="font-mono text-xs"
                />
              </Field>
            )}

            <label className="flex items-center gap-2 text-sm cursor-pointer py-1">
              <input
                type="checkbox"
                checked={createForm.is_secret}
                onChange={(e) => setCreateForm({ ...createForm, is_secret: e.target.checked })}
                className="accent-primary"
              />
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              Mark as secret (masked on read, write-only)
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              disabled={busy || !canSubmitCreate}
              onClick={() =>
                runAction(async () => {
                  try {
                    await platformAPI.createSetting(buildNewSettingPayload(createForm))
                    setActiveCategory(createForm.category)
                    setCreateOpen(false)
                  } catch (err) {
                    // Validation errors stay inside the dialog; network errors bubble up.
                    const msg = err instanceof Error ? err.message : ""
                    if (/Key must|number|JSON/i.test(msg) && !(err as any)?.response) {
                      setCreateError(msg)
                      throw err
                    }
                    if ((err as any)?.response) {
                      setCreateError(getErrorMessage(err, "Could not create the setting."))
                      throw new Error("__handled__")
                    }
                    setCreateError(getErrorMessage(err, "Could not create the setting."))
                    throw err
                  }
                }).catch(() => undefined)
              }
            >
              Create setting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete setting */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.key}"?`}
        description="This permanently removes the setting. Anything reading it will fall back to built-in defaults. The deletion is recorded in the audit log."
        confirmLabel="Delete setting"
        destructive
        loading={busy}
        onConfirm={() =>
          deleteTarget &&
          runAction(() => platformAPI.deleteSetting(deleteTarget.id), () => setDeleteTarget(null))
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

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
