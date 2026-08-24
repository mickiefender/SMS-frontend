"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

/** Prev/next pager for the supervisor's paginated tables. */
export function TablePagination({
  page,
  pageSize,
  count,
  onPage,
}: {
  page: number
  pageSize: number
  count: number
  onPage: (page: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize))
  const from = count === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(count, page * pageSize)

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3">
      <p className="text-xs text-muted-foreground">
        Showing {from}–{to} of {count}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-4 w-4 mr-0.5" /> Prev
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">
          Page {page} of {totalPages}
        </span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next <ChevronRight className="h-4 w-4 ml-0.5" />
        </Button>
      </div>
    </div>
  )
}
