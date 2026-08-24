"use client"

import { useState } from "react"
import { StudentPromotion } from "@/components/student-promotion"
import { PromotionHistory } from "@/components/promotion-history"
import { PromotionRules } from "@/components/promotion-rules"
import { PromotionPolicy } from "@/components/promotion-policy"
import { StudentEnrollmentYears } from "@/components/student-enrollment-years"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, History, Settings2, SplitSquareHorizontal, Users } from "lucide-react"

export default function StudentPromotionPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Student Promotion</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Move students to their next class at the end of an academic year — bulk or one at a time,
          with preview, review, and full history.
        </p>
      </div>

      <Tabs defaultValue="promote">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="promote" className="gap-1.5">
            <Users className="h-4 w-4" />
            Promote Students
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-1.5">
            <SplitSquareHorizontal className="h-4 w-4" />
            Class Rules
          </TabsTrigger>
          <TabsTrigger value="policy" className="gap-1.5">
            <Settings2 className="h-4 w-4" />
            Policy
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-4 w-4" />
            Promotion History
          </TabsTrigger>
          <TabsTrigger value="enrollments" className="gap-1.5">
            <CalendarDays className="h-4 w-4" />
            Enrollment Years
          </TabsTrigger>
        </TabsList>

        <TabsContent value="promote" className="mt-4">
          <StudentPromotion onPromoted={() => setRefreshKey((k) => k + 1)} />
        </TabsContent>

        <TabsContent value="rules" className="mt-4">
          <PromotionRules />
        </TabsContent>

        <TabsContent value="policy" className="mt-4">
          <PromotionPolicy />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <PromotionHistory refreshKey={refreshKey} />
        </TabsContent>

        <TabsContent value="enrollments" className="mt-4">
          <StudentEnrollmentYears />
        </TabsContent>
      </Tabs>
    </div>
  )
}
