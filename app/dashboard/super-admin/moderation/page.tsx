"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/super-admin/page-header"
import { feedSupervisorAPI } from "@/lib/api"
import { useFetch } from "@/components/super-admin/use-fetch"
import type { OverviewData } from "@/components/super-admin/feed-supervisor/types"
import { OverviewTab } from "@/components/super-admin/feed-supervisor/overview-tab"
import { PostsTab } from "@/components/super-admin/feed-supervisor/posts-tab"
import { ReportsTab } from "@/components/super-admin/feed-supervisor/reports-tab"
import { CreatorsTab } from "@/components/super-admin/feed-supervisor/creators-tab"
import { SchoolsTab } from "@/components/super-admin/feed-supervisor/schools-tab"
import { SettingsTab } from "@/components/super-admin/feed-supervisor/settings-tab"

export default function ContentModerationPage() {
  const overview = useFetch<OverviewData>(
    () => feedSupervisorAPI.overview().then((r) => r.data),
    [],
  )

  const flaggedCount = overview.data?.flagged_posts ?? 0

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Content Moderation"
        description="Supervise the Alara Feed — review reported content, moderate posts, monitor creators and schools, and configure global moderation policies."
      />

      {overview.error && (
        <div className="glass-red rounded-xl p-3 text-sm text-red-300">{overview.error}</div>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="posts">
            Posts
            {flaggedCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500/15 px-1.5 text-[10px] font-semibold text-red-400 tabular-nums">
                {flaggedCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports">Report Queue</TabsTrigger>
          <TabsTrigger value="creators">Creators</TabsTrigger>
          <TabsTrigger value="schools">Schools</TabsTrigger>
          <TabsTrigger value="settings">Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab overview={overview} />
        </TabsContent>

        <TabsContent value="posts" className="mt-4">
          <PostsTab />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <ReportsTab />
        </TabsContent>

        <TabsContent value="creators" className="mt-4">
          <CreatorsTab />
        </TabsContent>

        <TabsContent value="schools" className="mt-4">
          <SchoolsTab />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
