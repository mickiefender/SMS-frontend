"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const TONE_MAP: Record<string, string> = {
  // positive
  active: "bg-emerald-500/10 text-emerald-700 border-emerald-600/25",
  healthy: "bg-emerald-500/10 text-emerald-700 border-emerald-600/25",
  paid: "bg-emerald-500/10 text-emerald-700 border-emerald-600/25",
  processed: "bg-emerald-500/10 text-emerald-700 border-emerald-600/25",
  resolved: "bg-emerald-500/10 text-emerald-700 border-emerald-600/25",
  actioned: "bg-emerald-500/10 text-emerald-700 border-emerald-600/25",
  sent: "bg-emerald-500/10 text-emerald-700 border-emerald-600/25",
  success: "bg-emerald-500/10 text-emerald-700 border-emerald-600/25",
  approved: "bg-emerald-500/10 text-emerald-700 border-emerald-600/25",
  dismissed: "bg-slate-500/10 text-slate-600 border-slate-500/25",

  // warning
  trial: "bg-amber-500/10 text-amber-700 border-amber-600/25",
  pending: "bg-amber-500/10 text-amber-700 border-amber-600/25",
  scheduled: "bg-amber-500/10 text-amber-700 border-amber-600/25",
  draft: "bg-slate-500/10 text-slate-600 border-slate-500/25",
  open: "bg-amber-500/10 text-amber-700 border-amber-600/25",
  reviewing: "bg-amber-500/10 text-amber-700 border-amber-600/25",
  waiting: "bg-amber-500/10 text-amber-700 border-amber-600/25",
  degraded: "bg-amber-500/10 text-amber-700 border-amber-600/25",
  in_progress: "bg-blue-500/10 text-blue-700 border-blue-600/25",
  sending: "bg-blue-500/10 text-blue-700 border-blue-600/25",

  // negative
  suspended: "bg-red-500/10 text-red-700 border-red-600/25",
  failed: "bg-red-500/10 text-red-700 border-red-600/25",
  down: "bg-red-500/10 text-red-700 border-red-600/25",
  rejected: "bg-red-500/10 text-red-700 border-red-600/25",
  cancelled: "bg-red-500/10 text-red-700 border-red-600/25",
  banned: "bg-red-500/10 text-red-700 border-red-600/25",
  locked: "bg-red-500/10 text-red-700 border-red-600/25",
  critical: "bg-red-500/10 text-red-700 border-red-600/25",
  urgent: "bg-red-500/10 text-red-700 border-red-600/25",
  void: "bg-red-500/10 text-red-700 border-red-600/25",
  refunded: "bg-red-500/10 text-red-700 border-red-600/25",

  // neutral
  inactive: "bg-slate-500/10 text-slate-600 border-slate-500/25",
  closed: "bg-slate-500/10 text-slate-600 border-slate-500/25",
  archived: "bg-slate-500/10 text-slate-600 border-slate-500/25",
  info: "bg-blue-500/10 text-blue-700 border-blue-600/25",
  warning: "bg-amber-500/10 text-amber-700 border-amber-600/25",
}

export function StatusBadge({ status, className }: { status?: string | null; className?: string }) {
  const key = (status || "").toLowerCase().replace(/[\s-]+/g, "_")
  const tone = TONE_MAP[key] || "bg-muted text-muted-foreground border-border"
  return (
    <Badge variant="outline" className={cn("capitalize font-medium", tone, className)}>
      {(status || "unknown").replace(/_/g, " ")}
    </Badge>
  )
}
