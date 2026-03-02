"use client"

import { TeacherGrading } from "@/components/teacher-grading"
import { TerminalReport } from "@/components/terminal-report"
import { PositionReport } from "@/components/position-report"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TeacherGradesPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Grading & Reports</h1>
      
      <Tabs defaultValue="grades" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="terminal-reports">Terminal Reports</TabsTrigger>
          <TabsTrigger value="positions">Position Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grades">
          <TeacherGrading />
        </TabsContent>
        
        <TabsContent value="terminal-reports">
          <TerminalReport />
        </TabsContent>
        
        <TabsContent value="positions">
          <PositionReport />
        </TabsContent>
      </Tabs>
    </div>
  )
}
