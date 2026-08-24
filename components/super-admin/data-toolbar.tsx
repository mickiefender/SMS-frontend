"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"

export type FilterOption = { value: string; label: string }

export function DataToolbar({
  search,
  onSearch,
  searchPlaceholder = "Search...",
  filters = [],
  children,
}: {
  search?: string
  onSearch?: (value: string) => void
  searchPlaceholder?: string
  filters?: Array<{
    value: string
    onChange: (value: string) => void
    placeholder: string
    options: FilterOption[]
    allLabel?: string
  }>
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4 flex-wrap">
      {onSearch && (
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-8"
          />
        </div>
      )}
      {filters.map((f) => (
        <Select key={f.placeholder} value={f.value || "all"} onValueChange={(v) => f.onChange(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder={f.placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{f.allLabel || `All ${f.placeholder}`}</SelectItem>
            {f.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      <div className="flex items-center gap-2 md:ml-auto">{children}</div>
    </div>
  )
}
