"use client"

import FileExplorer from "@/components/FileExplorer"

export function LearningMaterials() {
  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Learning Materials</h1>
      <div className="flex-grow">
        <FileExplorer />
      </div>
    </div>
  )
}
