import type { AnyObj } from "@/components/super-admin/types"

/** Content states surfaced by the Feed Supervisor (derived server-side). */
export const CONTENT_STATES = [
  { value: "published", label: "Published" },
  { value: "pending_review", label: "Pending Review" },
  { value: "under_review", label: "Under Review" },
  { value: "flagged", label: "Flagged" },
  { value: "hidden", label: "Hidden" },
  { value: "removed", label: "Removed" },
  { value: "restored", label: "Restored" },
] as const

export type ContentState = (typeof CONTENT_STATES)[number]["value"]

export type PostRow = {
  id: number
  title: string
  preview: string
  thumbnail_url?: string
  playback_url?: string
  content_type: string
  content_state: ContentState | string
  status: string
  visibility: string
  teacher_id: number
  teacher_name: string
  school_id: number | null
  school_name: string | null
  open_reports_count: number
  total_reports_count: number
  view_count: number
  like_count: number
  comment_count: number
  created_at: string
  published_at: string | null
}

export type ReportRow = {
  id: number
  target_type: "lesson" | "comment" | "teacher"
  reason: string
  description: string
  status: "pending" | "reviewing" | "resolved" | "dismissed"
  resolution: string
  reporter_name: string
  lesson: {
    id: number
    title: string
    status: string
    visibility: string
    teacher_id: number
    teacher_name: string
    school_name: string | null
  } | null
  comment_id: number | null
  teacher_target_id: number | null
  resolved_by_name: string | null
  resolved_at: string | null
  created_at: string
}

export type CreatorRow = {
  id: number
  name: string
  email: string
  is_active: boolean
  restricted: boolean
  total_posts: number
  removed_posts: number
  reports_received: number
  last_post_at: string | null
}

export type SchoolRow = {
  id: number
  name: string
  total_posts: number
  active_creators?: number
  removed: number
}

export type OverviewData = {
  total_posts: number
  posts_today: number
  videos: number
  images: number
  documents: number
  reported_posts: number
  flagged_posts: number
  hidden_posts: number
  removed_posts: number
  pending_review: number
  published_posts: number
  active_creators_30d: number
  most_active_schools: Array<{ id: number; name: string; posts: number }>
  most_reported_content: Array<{ id: number; title: string; reports: number }>
  recent_activity: Array<{
    id: number
    actor: string
    action: string
    target: string
    created_at: string
  }>
}

export type CreatorDetailData = {
  teacher: {
    id: number
    name: string
    email: string
    school_id: number | null
    is_active: boolean
    restricted: boolean
  }
  stats: {
    total_posts: number
    published: number
    pending_review: number
    hidden: number
    removed: number
    reports_received: number
  }
  warnings: Array<{ note: string; at: string }>
  moderation_history: Array<{ action: string; target: string; by: string; at: string }>
  recent_posts: PostRow[]
  recent_reports: ReportRow[]
}

export type SchoolDetailData = {
  school: { id: number; name: string }
  stats: {
    total_posts: number
    active_creators: number
    reported: number
    removed: number
  }
  top_teachers: Array<{ id: number; name: string; posts: number }>
  recent_posts: PostRow[]
}

export type FeedSettings = {
  who_can_post: string
  allow_videos: boolean
  allow_documents: boolean
  allowed_file_types: string[]
  max_video_size_mb: number
  max_video_duration_minutes: number
  allow_comments: boolean
  allow_reporting: boolean
  moderation_mode:
    | "automatic_publishing"
    | "report_based_moderation"
    | "manual_approval"
}

export type PagedResponse<T> = { count: number; results: T[] }

export type { AnyObj }
