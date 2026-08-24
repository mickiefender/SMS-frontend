"use client"

import {
  AlertTriangle,
  Eye,
  EyeOff,
  FileText,
  Film,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard, StatCardGrid } from "@/components/super-admin/stat-card"
import type { OverviewData } from "./types"

export type OverviewFetch = {
  data: OverviewData | null
  loading: boolean
  error: string
  reload: () => Promise<void>
}

function formatWhen(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

export function OverviewTab({ overview }: { overview: OverviewFetch }) {
  const data = overview.data

  if (overview.loading && !data) {
    return (
      <div className="space-y-4">
        <StatCardGrid>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </StatCardGrid>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <StatCardGrid>
        <StatCard label="Total posts" value={data.total_posts} icon={FileText} sub={`${data.posts_today} today`} />
        <StatCard
          label="Reported posts"
          value={data.reported_posts}
          icon={AlertTriangle}
          tone="warning"
          sub="With open reports"
        />
        <StatCard label="Pending review" value={data.pending_review} icon={Eye} tone="warning" />
        <StatCard label="Active creators" value={data.active_creators_30d} icon={Users} sub="Last 30 days" />
      </StatCardGrid>

      <StatCardGrid>
        <StatCard label="Published" value={data.published_posts} icon={ShieldCheck} tone="success" />
        <StatCard label="Hidden" value={data.hidden_posts} icon={EyeOff} tone="muted" />
        <StatCard label="Removed" value={data.removed_posts} icon={Trash2} tone="danger" />
        <StatCard
          label="Media on feed"
          value={`${data.videos} / ${data.images} / ${data.documents}`}
          icon={Film}
          sub="Videos / images / docs"
        />
      </StatCardGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Most reported content */}
        <section className="glass-card p-5">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-400" /> Most reported content
          </h3>
          {data.most_reported_content.length === 0 ? (
            <p className="text-xs text-muted-foreground">No reported content. 🎉</p>
          ) : (
            <ul className="space-y-2">
              {data.most_reported_content.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{item.title}</span>
                  <span className="shrink-0 text-xs font-medium text-red-400 tabular-nums">
                    {item.reports} reports
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Most active schools */}
        <section className="glass-card p-5">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-primary" /> Most active schools
          </h3>
          {data.most_active_schools.length === 0 ? (
            <p className="text-xs text-muted-foreground">No school activity yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.most_active_schools.map((school) => (
                <li key={school.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{school.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {school.posts} posts
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent moderation activity */}
        <section className="glass-card p-5">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <ShieldCheck className="h-4 w-4 text-primary" /> Recent moderation activity
          </h3>
          {data.recent_activity.length === 0 ? (
            <p className="text-xs text-muted-foreground">No moderation actions recorded yet.</p>
          ) : (
            <ul className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {data.recent_activity.map((entry) => (
                <li key={entry.id} className="text-xs leading-relaxed">
                  <p>
                    <span className="font-medium">{entry.actor || "System"}</span>{" "}
                    <span className="text-muted-foreground">{entry.action.replace(/^feed\./, "").replace(/_/g, " ")}</span>{" "}
                    <span className="font-medium">{entry.target}</span>
                  </p>
                  <p className="text-muted-foreground/70">{formatWhen(entry.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
