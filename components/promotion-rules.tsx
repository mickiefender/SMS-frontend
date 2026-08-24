"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { promotionAPI, academicsAPI, getErrorMessage } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import {
  ArrowRight,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react"

type ClassInfo = { id: number; name: string }

type PromotionRule = {
  id: number
  from_class: number
  from_class_name: string
  to_class: number | null
  to_class_name: string | null
  order: number
  is_active: boolean
}

const emptyForm = {
  id: 0,
  from_class: "",
  to_class: "none",
  order: "0",
  is_active: true,
}

export function PromotionRules() {
  const [rules, setRules] = useState<PromotionRule[]>([])
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rulesRes, classesRes] = await Promise.all([
        promotionAPI.promotionRules(),
        academicsAPI.classes(),
      ])
      setRules(rulesRes.data.results || rulesRes.data)
      setClasses(classesRes.data.results || classesRes.data)
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load promotion rules"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setForm({ ...emptyForm, order: String(rules.length) })
    setShowDialog(true)
  }

  const openEdit = (rule: PromotionRule) => {
    setForm({
      id: rule.id,
      from_class: String(rule.from_class),
      to_class: rule.to_class ? String(rule.to_class) : "none",
      order: String(rule.order ?? 0),
      is_active: rule.is_active,
    })
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!form.from_class) {
      toast.error("Select the class students are promoted FROM")
      return
    }
    const payload = {
      from_class: Number(form.from_class),
      to_class: form.to_class === "none" ? null : Number(form.to_class),
      order: Number(form.order) || 0,
      is_active: form.is_active,
    }
    if (payload.to_class != null && payload.to_class === payload.from_class) {
      toast.error("A class cannot promote into itself")
      return
    }
    setSaving(true)
    try {
      if (form.id) {
        await promotionAPI.updatePromotionRule(form.id, payload)
        toast.success("Promotion rule updated")
      } else {
        await promotionAPI.createPromotionRule(payload)
        toast.success("Promotion rule created")
      }
      setShowDialog(false)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save promotion rule"))
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (rule: PromotionRule) => {
    try {
      await promotionAPI.updatePromotionRule(rule.id, { is_active: !rule.is_active })
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, is_active: !r.is_active } : r)),
      )
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update rule"))
    }
  }

  const handleDelete = async (rule: PromotionRule) => {
    if (!window.confirm(`Delete the rule "${rule.from_class_name} → ${rule.to_class_name || "Graduated"}"?`)) {
      return
    }
    try {
      await promotionAPI.deletePromotionRule(rule.id)
      toast.success("Rule deleted")
      load()
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete rule"))
    }
  }

  const usedFromClass = new Set(
    form.id ? [] : rules.map((r) => r.from_class),
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Class Progression Rules</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Define how each class moves to the next at year end. A rule with no
              destination means students in that class graduate instead of moving.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!loading && rules.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No rules yet. Add one, e.g. &ldquo;Primary 1 → Primary 2&rdquo;, so the
              promotion preview knows where each class should go.
            </p>
          )}
          {rules.length > 0 && (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From Class</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.from_class_name}</TableCell>
                      <TableCell>
                        {rule.to_class ? (
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                            {rule.to_class_name}
                          </span>
                        ) : (
                          <Badge variant="outline" className="bg-sky-100 text-sky-800 border-sky-200 gap-1">
                            <GraduationCap className="h-3 w-3" />
                            Graduated
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{rule.order}</TableCell>
                      <TableCell>
                        <Switch checked={rule.is_active} onCheckedChange={() => toggleActive(rule)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(rule)}>
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Create / edit dialog ─────────────────────────────── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Rule" : "Add Promotion Rule"}</DialogTitle>
            <DialogDescription>
              Choose where students in a class go when they are promoted. Leave the
              destination as &ldquo;Graduate&rdquo; for terminal classes like JHS 3.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>From Class</Label>
              <Select value={form.from_class} onValueChange={(v) => setForm({ ...form, from_class: v })}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)} disabled={!form.id && usedFromClass.has(c.id)}>
                      {c.name}{!form.id && usedFromClass.has(c.id) ? " (already has a rule)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Destination</Label>
              <Select value={form.to_class} onValueChange={(v) => setForm({ ...form, to_class: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Graduate (no next class)</SelectItem>
                  {classes
                    .filter((c) => String(c.id) !== form.from_class)
                    .map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="space-y-1.5">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm pb-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
                Active
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {form.id ? "Save Changes" : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
