"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Save, ShieldCheck } from "lucide-react"
import { getErrorMessage, feedSupervisorAPI } from "@/lib/api"
import { useFetch } from "@/components/super-admin/use-fetch"
import type { FeedSettings } from "./types"

const WHO_CAN_POST_OPTIONS = ["teachers", "students", "everyone"]
const FILE_TYPE_OPTIONS = ["video", "pdf", "image", "audio"]

const MODERATION_MODES = [
  {
    value: "automatic_publishing",
    label: "Automatic publishing",
    description: "Posts go live immediately.",
  },
  {
    value: "report_based_moderation",
    label: "Report-based moderation",
    description: "Posts go live immediately and are moderated when reported.",
  },
  {
    value: "manual_approval",
    label: "Manual approval",
    description: "Every post waits for moderator approval before going live.",
  },
] as const

export function SettingsTab() {
  const settings = useFetch<FeedSettings>(
    () => feedSupervisorAPI.settings().then((r) => r.data),
    [],
  )

  const [form, setForm] = useState<FeedSettings | null>(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState("")

  useEffect(() => {
    if (settings.data) setForm(settings.data)
  }, [settings.data])

  if (!form) {
    return (
      <div className="space-y-4">
        {settings.error && (
          <div className="glass-red rounded-xl p-3 text-sm text-red-300">{settings.error}</div>
        )}
        <div className="glass-card p-6 space-y-4">
          <div className="h-8 w-1/3 bg-muted rounded animate-pulse" />
          <div className="h-8 w-2/3 bg-muted rounded animate-pulse" />
          <div className="h-8 w-1/2 bg-muted rounded animate-pulse" />
        </div>
      </div>
    )
  }

  function patch<K extends keyof FeedSettings>(key: K, value: FeedSettings[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
    setSaved(false)
  }

  async function save() {
    if (!form) return
    setBusy(true)
    setSaveError("")
    setSaved(false)
    try {
      await feedSupervisorAPI.updateSettings({ ...form })
      setSaved(true)
      await settings.reload()
    } catch (err) {
      setSaveError(getErrorMessage(err, "Could not save feed policies."))
    } finally {
      setBusy(false)
    }
  }

  const whoCanPostOptions = Array.from(
    new Set([...WHO_CAN_POST_OPTIONS, form.who_can_post]),
  )

  return (
    <div className="space-y-4 max-w-3xl">
      {saveError && (
        <div className="glass-red rounded-xl p-3 text-sm text-red-300">{saveError}</div>
      )}
      {saved && (
        <div className="glass-green rounded-xl p-3 text-sm text-emerald-300">
          Feed moderation policies saved.
        </div>
      )}

      <div className="glass-card p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2 mb-1">
            <ShieldCheck className="h-4 w-4 text-primary" /> Publishing policy
          </h2>
          <p className="text-xs text-muted-foreground">
            Controls how content reaches the Feed and who is allowed to post.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Who can post</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm capitalize"
            value={form.who_can_post}
            onChange={(e) => patch("who_can_post", e.target.value)}
          >
            {whoCanPostOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Moderation mode</Label>
          <div className="grid grid-cols-1 gap-2">
            {MODERATION_MODES.map((mode) => (
              <label
                key={mode.value}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  form.moderation_mode === mode.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <input
                  type="radio"
                  name="moderation_mode"
                  className="mt-1 h-4 w-4 accent-primary"
                  checked={form.moderation_mode === mode.value}
                  onChange={() => patch("moderation_mode", mode.value as FeedSettings["moderation_mode"])}
                />
                <span>
                  <span className="block text-sm font-medium">{mode.label}</span>
                  <span className="block text-xs text-muted-foreground">{mode.description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2 mb-1">
            <ShieldCheck className="h-4 w-4 text-primary" /> Media & engagement
          </h2>
          <p className="text-xs text-muted-foreground">
            Which media types are allowed and whether comments/reporting stay enabled.
          </p>
        </div>

        <div className="space-y-3">
          <ToggleRow
            label="Allow video uploads"
            checked={form.allow_videos}
            onChange={(v) => patch("allow_videos", v)}
          />
          <ToggleRow
            label="Allow document uploads"
            checked={form.allow_documents}
            onChange={(v) => patch("allow_documents", v)}
          />
          <ToggleRow
            label="Allow comments"
            checked={form.allow_comments}
            onChange={(v) => patch("allow_comments", v)}
          />
          <ToggleRow
            label="Allow reporting"
            checked={form.allow_reporting}
            onChange={(v) => patch("allow_reporting", v)}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Allowed file types</Label>
          <div className="flex flex-wrap gap-3">
            {FILE_TYPE_OPTIONS.map((ft) => {
              const checked = form.allowed_file_types.includes(ft)
              return (
                <label key={ft} className="flex items-center gap-2 text-sm capitalize">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) => {
                      const next = c
                        ? [...form.allowed_file_types, ft]
                        : form.allowed_file_types.filter((x) => x !== ft)
                      patch("allowed_file_types", next)
                    }}
                  />
                  {ft}
                </label>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Max video size (MB)</Label>
            <Input
              type="number"
              min={0}
              value={form.max_video_size_mb}
              onChange={(e) => patch("max_video_size_mb", Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Max video duration (minutes)</Label>
            <Input
              type="number"
              min={0}
              value={form.max_video_duration_minutes}
              onChange={(e) => patch("max_video_duration_minutes", Number(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          <Save className="h-4 w-4 mr-1" /> Save policies
        </Button>
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-sm">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
