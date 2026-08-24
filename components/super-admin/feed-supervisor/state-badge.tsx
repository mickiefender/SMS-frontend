"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const STATE_TONES: Record<string, string> = {
  published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  restored: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pending_review: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  under_review: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  flagged: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  hidden: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  removed: "bg-red-500/15 text-red-400 border-red-500/30",
}

/** Badge for the supervisor-facing content state of a feed post. */
export function StateBadge({ state, className }: { state?: string | null; className?: string }) {
  const tone = STATE_TONES[state || ""] || "bg-muted text-muted-foreground border-border"
  return (
    <Badge variant="outline" className={cn("capitalize font-medium", tone, className)}>
      {(state || "unknown").replace(/_/g, " ")}
    </Badge>
  )
}