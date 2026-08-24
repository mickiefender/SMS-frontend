"use client"

import {
  AlertTriangle,
  History,
  ShieldCheck,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard, StatCardGrid } from "@/components/super-admin/stat-card"
import { Badge } from "@/components/ui/badge"
import { getErrorMessage, feedSupervisorAPI } from "@/lib/api"
import { useFetch } from "@/components/super-admin/use-fetch"
import type { CreatorDetailData } from "./types"
import { StateBadge } from "./state-badge"

export function CreatorDetailDialog({
  teacherId,
  open,
  onOpenChange,
}: {
  teacherId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const detail = useFetch<CreatorDetailData>(
    () => feedSupervisorAPI.creatorDetail(teacherId).then((r) => r.data),
    [teacherId],
  )

  const data = detail.data

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {data?.teacher?.name || "Creator detail"}
            {data?.teacher?.restricted && (
              <Badge variant="outline" className="bg-amber-500/15 text-amber-400 border-amber-500/30">
                Restricted
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>{data?.teacher?.email || "·"}</DialogDescription>
        </DialogHeader>

        {detail.loading && !data && <Skeleton className="h-40 w-full" />}
        {detail.error && (
          <div className="glass-red rounded-xl p-3 text-sm text-red-300">{detail.error}</div>
        )}

        {data && (
          <div className="space-y-5">
            <StatCardGrid>
              <StatCard label="Total posts" value={data.stats.total_posts} />
              <StatCard label="Published" value={data.stats.published} tone="success" />
              <StatCard label="Pending review" value={data.stats.pending_review} tone="warning" />
              <StatCard label="Removed" value={data.stats.removed} tone="danger" />
            </StatCardGrid>
            <StatCardGrid>
              <StatCard label="Hidden" value={data.stats.hidden} tone="muted" />
              <StatCard label="Reports received" value={data.stats.reports_received} tone="warning" icon={AlertTriangle} />
            </StatCardGrid>

            {/* Warnings */}
            <section className="glass-card p-4 rounded-xl">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" /> Warnings
              </h3>
              {data.warnings.length === 0 ? (
                <p className="text-xs text-muted-foreground">No warnings on record.</p>
              ) : (
                <ul className="space-y-2">
                  {data.warnings.map((w, i) => (
                    <li key={i} className="text-sm">
                      <p>{w.note || "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(w.at).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Moderation history */}
            <section className="glass-card p-4 rounded-xl">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <History className="h-4 w-4 text-primary" /> Moderation history
              </h3>
              {data.moderation_history.length === 0 ? (
                <p className="text-xs text-muted-foreground">No moderation history.</p>
              ) : (
                <ul className="space-y-2">
                  {data.moderation_history.map((h, i) => (
                    <li key={i} className="text-sm">
                      <p>
                        <span className="font-medium capitalize">
                          {h.action.replace(/^feed\./, "").replace(/_/g, " ")}
                        </span>{" "}
                        <span className="text-muted-foreground">· {h.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {h.by} · {new Date(h.at).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Recent posts */}
            <section className="glass-card p-4 rounded-xl">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Recent posts
              </h3>
              {data.recent_posts.length === 0 ? (
                <p className="text-xs text-muted-foreground">No posts yet.</p>
              ) : (
                <ul className="space-y-2">
                  {data.recent_posts.map((post) => (
                    <li key={post.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">{post.title}</span>
                      <StateBadge state={post.content_state} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Recent reports */}
            <section className="glass-card p-4 rounded-xl">
              <h3 className="text-sm font-semibold mb-2">Recent reports</h3>
              {data.recent_reports.length === 0 ? (
                <p className="text-xs text-muted-foreground">No reports against this creator.</p>
              ) : (
                <ul className="space-y-2">
                  {data.recent_reports.map((report) => (
                    <li key={report.id} className="text-sm">
                      <p className="capitalize">
                        {report.reason.replace(/_/g, " ")} — {report.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
