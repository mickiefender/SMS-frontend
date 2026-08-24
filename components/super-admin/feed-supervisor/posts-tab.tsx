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
import { Eye, Flag, MoreHorizontal, ShieldCheck } from "lucide-react"
import { getErrorMessage, feedSupervisorAPI, resolveImageUrl } from "@/lib/api"
import { useFetch } from "@/components/super-admin/use-fetch"
import { DataToolbar } from "@/components/super-admin/data-toolbar"
import type { PagedResponse, PostRow } from "./types"
import { CONTENT_STATES } from "./types"
import { StateBadge } from "./state-badge"
import { TablePagination } from "./pagination"
import { ModerationActionDialog } from "./action-dialog"
import { PostPreviewDialog } from "./post-preview-dialog"
import { useDebouncedValue } from "./use-debounced-value"

const PAGE_SIZE = 25

type PostAction = "approve" | "hide" | "remove" | "restore" | "suspend"

const ACTION_META: Record<PostAction, { label: string; destructive?: boolean }> = {
  approve: { label: "Approve & publish" },
  hide: { label: "Hide post", destructive: true },
  remove: { label: "Remove post", destructive: true },
  restore: { label: "Restore post" },
  suspend: { label: "Suspend post", destructive: true },
}

/** Which moderation actions make sense for each content state. */
function availableActions(state: string): PostAction[] {
  switch (state) {
    case "pending_review":
      return ["approve", "remove"]
    case "published":
    case "restored":
      return ["hide", "remove"]
    case "hidden":
      return ["restore", "remove"]
    case "removed":
      return ["restore"]
    default:
      return ["hide", "remove"]
  }
}

export function PostsTab() {
  const [search, setSearch] = useState("")
  const q = useDebouncedValue(search)
  const [stateFilter, setStateFilter] = useState("")
  const [page, setPage] = useState(1)

  const posts = useFetch<PagedResponse<PostRow>>(
    () =>
      feedSupervisorAPI
        .posts({ page_size: PAGE_SIZE, page, state: stateFilter || undefined, q: q || undefined })
        .then((r) => r.data),
    [q, stateFilter, page],
  )

  const [actionError, setActionError] = useState("")
  const [busy, setBusy] = useState(false)
  const [activePost, setActivePost] = useState<PostRow | null>(null)
  const [pendingAction, setPendingAction] = useState<PostAction>("hide")
  const [notes, setNotes] = useState("")
  const [previewPost, setPreviewPost] = useState<PostRow | null>(null)

  const rows = posts.data?.results || []
  const count = posts.data?.count || 0

  const openAction = (post: PostRow, action: PostAction) => {
    setActivePost(post)
    setPendingAction(action)
    setNotes("")
    setActionError("")
  }

  async function confirmAction() {
    if (!activePost) return
    setBusy(true)
    setActionError("")
    try {
      await feedSupervisorAPI.moderatePost(activePost.id, {
        action: pendingAction,
        notes: notes.trim() || undefined,
      })
      setActivePost(null)
      await posts.reload()
    } catch (err) {
      setActionError(getErrorMessage(err, "Could not apply the moderation action."))
    } finally {
      setBusy(false)
    }
  }

  const meta = pendingAction ? ACTION_META[pendingAction] : null

  return (
    <div className="space-y-4">
      {(actionError || posts.error) && (
        <div className="glass-red rounded-xl p-3 text-sm text-red-300">{actionError || posts.error}</div>
      )}

      <DataToolbar
        search={search}
        onSearch={(v) => {
          setSearch(v)
          setPage(1)
        }}
        searchPlaceholder="Search by title or topic..."
        filters={[
          {
            value: stateFilter,
            onChange: (v) => {
              setStateFilter(v)
              setPage(1)
            },
            placeholder: "State",
            options: [...CONTENT_STATES],
          },
        ]}
      />

      <div className="overflow-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Content</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>School</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Reports</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Posted</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.loading &&
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-12 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!posts.loading && !rows.length && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No posts match these filters.
                </TableCell>
              </TableRow>
            )}
            {!posts.loading &&
              rows.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="max-w-[280px]">
                    <button
                      type="button"
                      onClick={() => setPreviewPost(post)}
                      className="flex items-center gap-2.5 text-left w-full min-w-0 group"
                      title="View post"
                    >
                      {post.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={resolveImageUrl(post.thumbnail_url)}
                          alt=""
                          className="h-9 w-14 rounded object-cover shrink-0 bg-muted"
                        />
                      ) : (
                        <div className="h-9 w-14 rounded bg-muted flex items-center justify-center shrink-0">
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium group-hover:text-primary transition-colors">
                          {post.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{post.preview}</p>
                      </div>
                    </button>
                  </TableCell>
                  <TableCell className="text-sm">{post.teacher_name}</TableCell>
                  <TableCell className="text-sm">{post.school_name || "—"}</TableCell>
                  <TableCell>
                    <StateBadge state={post.content_state} />
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {post.open_reports_count > 0 ? (
                      <span className="inline-flex items-center gap-1 font-medium text-red-400">
                        <Flag className="h-3 w-3" /> {post.open_reports_count}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{post.total_reports_count}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
                    {post.view_count} views · {post.like_count} likes · {post.comment_count} comments
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(post.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setPreviewPost(post)}>
                          <Eye className="h-4 w-4 mr-2" /> View / watch post
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Moderate</DropdownMenuLabel>
                        {availableActions(post.content_state).map((action) => (
                          <DropdownMenuItem key={action} onClick={() => openAction(post, action)}>
                            {ACTION_META[action].label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <TablePagination page={page} pageSize={PAGE_SIZE} count={count} onPage={setPage} />

      {/* Post preview dialog */}
      <PostPreviewDialog
        post={previewPost}
        open={!!previewPost}
        onOpenChange={(open) => !open && setPreviewPost(null)}
      />

      {/* Moderation action dialog */}
      <ModerationActionDialog
        open={!!activePost}
        onOpenChange={(open) => !open && setActivePost(null)}
        title={meta?.label || "Moderate post"}
        description={
          activePost ? `“${activePost.title}” by ${activePost.teacher_name}. This action is audited.` : undefined
        }
        confirmLabel={meta?.label || "Confirm"}
        destructive={meta?.destructive}
        loading={busy}
        notes={notes}
        onNotesChange={setNotes}
        onConfirm={confirmAction}
      >
        <p className="flex items-center gap-2 text-sm">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
          Current state: <StateBadge state={activePost?.content_state} />
        </p>
      </ModerationActionDialog>
    </div>
  )
}
