"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { promotionAPI, getErrorMessage } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Save, Settings2 } from "lucide-react"

type Policy = {
  id: number
  mode: "promote_all" | "average_threshold" | "grading_scale" | "manual_review"
  pass_mark: number
  is_active: boolean
}

const MODES: Array<{ value: Policy["mode"]; label: string; description: string }> = [
  {
    value: "promote_all",
    label: "Promote Everyone",
    description: "Every student is recommended for promotion to the next class.",
  },
  {
    value: "average_threshold",
    label: "Based On Final Average",
    description:
      "Promote students whose final average meets the pass mark; the rest repeat the year.",
  },
  {
    value: "grading_scale",
    label: "Based On Grading Scale",
    description:
      "Use your school's active grading scale — students with a non-promotion-eligible final grade repeat.",
  },
  {
    value: "manual_review",
    label: "Require Administrator Decision",
    description:
      "No automatic recommendations. Every student must be reviewed and decided manually before promoting.",
  },
]

export function PromotionPolicy() {
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await promotionAPI.promotionPolicy()
      const list = res.data.results || res.data
      setPolicy(list && list.length > 0 ? list[0] : null)
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load promotion policy"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    if (!policy) return
    if (policy.mode === "average_threshold") {
      const mark = Number(policy.pass_mark)
      if (Number.isNaN(mark) || mark < 0 || mark > 100) {
        toast.error("Pass mark must be between 0 and 100")
        return
      }
    }
    setSaving(true)
    try {
      const payload = {
        mode: policy.mode,
        pass_mark: Number(policy.pass_mark) || 0,
        is_active: policy.is_active,
      }
      if (policy.id) {
        await promotionAPI.updatePromotionPolicy(policy.id, payload)
      } else {
        await promotionAPI.savePromotionPolicy(payload)
      }
      toast.success("Promotion policy saved")
      load()
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save promotion policy"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading policy...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Promotion Policy
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Controls how recommended actions are computed when you preview a promotion.
          You can always override any recommendation per student before confirming.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <Label>Decision Mode</Label>
          <Select
            value={policy?.mode ?? "promote_all"}
            onValueChange={(v) =>
              setPolicy((prev) =>
                prev ? { ...prev, mode: v as Policy["mode"] } : prev,
              )
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MODES.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {MODES.find((m) => m.value === (policy?.mode ?? "promote_all"))?.description}
          </p>
        </div>

        {(policy?.mode ?? "promote_all") === "average_threshold" && (
          <div className="space-y-1.5">
            <Label>Pass Mark (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={policy?.pass_mark ?? 50}
              onChange={(e) =>
                setPolicy((prev) =>
                  prev ? { ...prev, pass_mark: Number(e.target.value) } : prev,
                )
              }
              className="max-w-[160px]"
            />
            <p className="text-xs text-muted-foreground">
              Students with a final average at or above this percentage are promoted.
            </p>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={policy?.is_active ?? true}
            onCheckedChange={(v) =>
              setPolicy((prev) => (prev ? { ...prev, is_active: v } : prev))
            }
          />
          Policy active
        </label>

        <div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Policy
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
