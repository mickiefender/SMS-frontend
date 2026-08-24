"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileText, Film, Flag } from "lucide-react"
import { resolveImageUrl } from "@/lib/api"
import type { PostRow } from "./types"
import { StateBadge } from "./state-badge"

/**
 * Preview dialog letting the Super Admin watch/read a feed post
 * straight from the moderation queue.
 */
export function PostPreviewDialog({
  post,
  open,
  onOpenChange,
}: {
  post: PostRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!post) return null

  const videoSrc = post.playback_url ? resolveImageUrl(post.playback_url) : ""
  const poster = post.thumbnail_url ? resolveImageUrl(post.thumbnail_url) : undefined
  const isVideoish = ["video", "lesson"].includes(post.content_type.toLowerCase())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6">
            <span className="truncate">{post.title}</span>
            <StateBadge state={post.content_state} />
          </DialogTitle>
          <DialogDescription className="truncate">
            {post.teacher_name}
            {post.school_name ? ` · ${post.school_name}` : ""} ·{" "}
            {new Date(post.created_at).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        {/* Media */}
        <div className="relative overflow-hidden rounded-lg bg-black aspect-video flex items-center justify-center">
          {videoSrc ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              key={videoSrc}
              src={videoSrc}
              poster={poster}
              controls
              preload="metadata"
              className="h-full w-full"
            />
          ) : poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt={post.title} className="max-h-full max-w-full object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              {isVideoish ? (
                <Film className="h-10 w-10" />
              ) : (
                <FileText className="h-10 w-10" />
              )}
              <p className="text-xs">No playable media attached to this post.</p>
            </div>
          )}
        </div>

        {/* Description */}
        {post.preview && (
          <p className="text-sm text-muted-foreground leading-relaxed">{post.preview}</p>
        )}

        {/* Metadata grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-sm border-t pt-4">
          <Meta label="Type" value={post.content_type || "—"} />
          <Meta label="Visibility" value={post.visibility} />
          <Meta label="Status" value={post.status} />
          <Meta
            label="Reports"
            value={
              <span className="inline-flex items-center gap-1">
                <Flag className="h-3 w-3" />
                {post.open_reports_count} open / {post.total_reports_count} total
              </span>
            }
          />
          <Meta label="Views" value={post.view_count.toLocaleString()} />
          <Meta
            label="Engagement"
            value={`${post.like_count} likes · ${post.comment_count} comments`}
          />
          <Meta
            label="Created"
            value={new Date(post.created_at).toLocaleDateString()}
          />
          <Meta
            label="Published"
            value={
              post.published_at ? new Date(post.published_at).toLocaleDateString() : "—"
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-medium capitalize truncate">{value}</p>
    </div>
  )
}
