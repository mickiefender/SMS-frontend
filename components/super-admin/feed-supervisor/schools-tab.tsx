"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getErrorMessage, feedSupervisorAPI } from "@/lib/api"
import { useFetch } from "@/components/super-admin/use-fetch"
import type { SchoolDetailData, SchoolRow } from "./types"
import { StatCard, StatCardGrid } from "@/components/super-admin/stat-card"
import { StateBadge } from "./state-badge"

export function SchoolsTab() {
  const schools = useFetch<SchoolRow[]>(() => feedSupervisorAPI.schools().then((r) => r.data), [])
  const [detailId, setDetailId] = useState<number | null>(null)

  const rows = schools.data || []

  return (
    <div className="space-y-4">
      {schools.error && (
        <div className="glass-red rounded-xl p-3 text-sm text-red-300">{schools.error}</div>
      )}

      <div className="overflow-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>School</TableHead>
              <TableHead>Total posts</TableHead>
              <TableHead>Active creators</TableHead>
              <TableHead>Removed posts</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {schools.loading &&
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!schools.loading && !rows.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No school activity on the Feed yet.
                </TableCell>
              </TableRow>
            )}
            {!schools.loading &&
              rows.map((school) => (
                <TableRow key={school.id}>
                  <TableCell className="font-medium">{school.name}</TableCell>
                  <TableCell className="text-sm tabular-nums">{school.total_posts}</TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {school.active_creators ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums text-red-400">{school.removed}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setDetailId(school.id)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {detailId && (
        <SchoolDetailDialog
          key={detailId}
          schoolId={detailId}
          open={!!detailId}
          onOpenChange={(open) => !open && setDetailId(null)}
        />
      )}
    </div>
  )
}

function SchoolDetailDialog({
  schoolId,
  open,
  onOpenChange,
}: {
  schoolId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const detail = useFetch<SchoolDetailData>(
    () => feedSupervisorAPI.schools({ school_id: schoolId }).then((r) => r.data),
    [schoolId],
  )
  const data = detail.data

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data?.school?.name || "School detail"}</DialogTitle>
          <DialogDescription>Feed activity overview for this school.</DialogDescription>
        </DialogHeader>

        {detail.loading && !data && <Skeleton className="h-40 w-full" />}
        {detail.error && (
          <div className="glass-red rounded-xl p-3 text-sm text-red-300">{detail.error}</div>
        )}

        {data && (
          <div className="space-y-5">
            <StatCardGrid>
              <StatCard label="Total posts" value={data.stats.total_posts} />
              <StatCard label="Active creators (30d)" value={data.stats.active_creators} />
              <StatCard label="Reported posts" value={data.stats.reported} tone="warning" />
              <StatCard label="Removed posts" value={data.stats.removed} tone="danger" />
            </StatCardGrid>

            <section className="glass-card p-4 rounded-xl">
              <h3 className="text-sm font-semibold mb-2">Top teachers by posts</h3>
              {data.top_teachers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No teacher activity yet.</p>
              ) : (
                <ul className="space-y-2">
                  {data.top_teachers.map((teacher) => (
                    <li key={teacher.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">{teacher.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {teacher.posts} posts
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="glass-card p-4 rounded-xl">
              <h3 className="text-sm font-semibold mb-2">Recent posts</h3>
              {data.recent_posts.length === 0 ? (
                <p className="text-xs text-muted-foreground">No recent posts.</p>
              ) : (
                <ul className="space-y-2">
                  {data.recent_posts.map((post) => (
                    <li key={post.id} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate">{post.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{post.teacher_name}</p>
                      </div>
                      <StateBadge state={post.content_state} />
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
