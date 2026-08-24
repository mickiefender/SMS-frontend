"use client"

import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Ban, Eye, MoreHorizontal, ShieldOff } from "lucide-react"
import { getErrorMessage, feedSupervisorAPI } from "@/lib/api"
import { useFetch } from "@/components/super-admin/use-fetch"
import { DataToolbar } from "@/components/super-admin/data-toolbar"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/super-admin/status-badge"
import type { CreatorRow, PagedResponse } from "./types"
import { TablePagination } from "./pagination"
import { ModerationActionDialog } from "./action-dialog"
import { CreatorDetailDialog } from "./creator-detail-dialog"
import { useDebouncedValue } from "./use-debounced-value"

const PAGE_SIZE = 25

const ORDERING_OPTIONS = [
  { value: "-posts", label: "Most posts" },
  { value: "-reports", label: "Most reports" },
  { value: "-last_post_at", label: "Recently active" },
]

type CreatorAction = "restrict" | "suspend" | "unrestrict"

const ACTION_LABEL: Record<CreatorAction, string> = {
  restrict: "Restrict from posting",
  suspend: "Suspend creator",
  unrestrict: "Remove restriction",
}

export function CreatorsTab() {
  const [search, setSearch] = useState("")
  const q = useDebouncedValue(search)
  const [ordering, setOrdering] = useState("-posts")
  const [page, setPage] = useState(1)

  const creators = useFetch<PagedResponse<CreatorRow>>(
    () =>
      feedSupervisorAPI
        .creators({ page_size: PAGE_SIZE, page, q: q || undefined, ordering: ordering || undefined })
        .then((r) => r.data),
    [q, ordering, page],
  )

  const [actionError, setActionError] = useState("")
  const [busy, setBusy] = useState(false)
  const [activeCreator, setActiveCreator] = useState<CreatorRow | null>(null)
  const [creatorAction, setCreatorAction] = useState<CreatorAction>("restrict")
  const [notes, setNotes] = useState("")
  const [detailId, setDetailId] = useState<number | null>(null)

  const rows = creators.data?.results || []
  const count = creators.data?.count || 0

  function openAction(creator: CreatorRow, action: CreatorAction) {
    setActiveCreator(creator)
    setCreatorAction(action)
    setNotes("")
    setActionError("")
  }

  async function confirmAction() {
    if (!activeCreator) return
    setBusy(true)
    setActionError("")
    try {
      const notesTrim = notes.trim() || undefined
      if (creatorAction === "restrict") {
        await feedSupervisorAPI.restrictCreator(activeCreator.id, notesTrim)
      } else if (creatorAction === "suspend") {
        await feedSupervisorAPI.suspendCreator(activeCreator.id, notesTrim)
      } else {
        await feedSupervisorAPI.unrestrictCreator(activeCreator.id, notesTrim)
      }
      setActiveCreator(null)
      await creators.reload()
    } catch (err) {
      setActionError(getErrorMessage(err, "Could not apply creator action."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {(actionError || creators.error) && (
        <div className="glass-red rounded-xl p-3 text-sm text-red-300">{actionError || creators.error}</div>
      )}

      <DataToolbar
        search={search}
        onSearch={(v) => {
          setSearch(v)
          setPage(1)
        }}
        searchPlaceholder="Search by name or email..."
        filters={[
          {
            value: ordering,
            onChange: (v) => {
              setOrdering(v)
              setPage(1)
            },
            placeholder: "Sort",
            options: ORDERING_OPTIONS,
          },
        ]}
      />

      <div className="overflow-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Creator</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Posts</TableHead>
              <TableHead>Removed</TableHead>
              <TableHead>Reports</TableHead>
              <TableHead>Last post</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {creators.loading &&
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-12 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!creators.loading && !rows.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No creators found.
                </TableCell>
              </TableRow>
            )}
            {!creators.loading &&
              rows.map((creator) => (
                <TableRow key={creator.id}>
                  <TableCell className="min-w-[180px]">
                    <p className="font-medium">{creator.name}</p>
                    <p className="text-xs text-muted-foreground">{creator.email}</p>
                  </TableCell>
                  <TableCell>
                    {creator.restricted ? (
                      <Badge variant="outline" className="bg-amber-500/15 text-amber-400 border-amber-500/30">
                        Restricted
                      </Badge>
                    ) : (
                      <StatusBadge status={creator.is_active ? "active" : "inactive"} />
                    )}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{creator.total_posts}</TableCell>
                  <TableCell className="text-sm tabular-nums">{creator.removed_posts}</TableCell>
                  <TableCell className="text-sm tabular-nums font-medium text-red-400">
                    {creator.reports_received}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {creator.last_post_at ? new Date(creator.last_post_at).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Creator</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setDetailId(creator.id)}>
                          <Eye className="h-4 w-4 mr-2" /> View detail
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {creator.restricted ? (
                          <DropdownMenuItem onClick={() => openAction(creator, "unrestrict")}>
                            <ShieldOff className="h-4 w-4 mr-2" /> Remove restriction
                          </DropdownMenuItem>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => openAction(creator, "restrict")}>
                              <Ban className="h-4 w-4 mr-2" /> Restrict from posting
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openAction(creator, "suspend")}>
                              <Ban className="h-4 w-4 mr-2" /> Suspend creator
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <TablePagination page={page} pageSize={PAGE_SIZE} count={count} onPage={setPage} />

      {/* Creator action dialog */}
      <ModerationActionDialog
        open={!!activeCreator}
        onOpenChange={(open) => !open && setActiveCreator(null)}
        title={creatorAction ? ACTION_LABEL[creatorAction] : "Creator action"}
        description={activeCreator ? `${activeCreator.name} (${activeCreator.email})` : undefined}
        confirmLabel={creatorAction ? ACTION_LABEL[creatorAction] : "Confirm"}
        destructive={creatorAction !== "unrestrict"}
        loading={busy}
        notes={notes}
        onNotesChange={setNotes}
        onConfirm={confirmAction}
      />

      {/* Creator detail */}
      {detailId && (
        <CreatorDetailDialog
          key={detailId}
          teacherId={detailId}
          open={!!detailId}
          onOpenChange={(open) => !open && setDetailId(null)}
        />
      )}
    </div>
  )
}
