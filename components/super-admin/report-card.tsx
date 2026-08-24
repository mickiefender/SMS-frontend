"use client"

import { useState } from "react"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getErrorMessage } from "@/lib/api"
import { downloadCSV, downloadPDF, downloadXLSX } from "@/components/super-admin/export"

export type ReportColumn = { key: string; label: string }

/**
 * A single downloadable platform report. Rows are fetched lazily — only when
 * the user picks an export format — so the page stays light.
 */
export function ReportCard({
  icon: Icon,
  title,
  description,
  fetchRows,
  columns,
  filename,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  fetchRows: () => Promise<Array<Record<string, any>>>
  columns: ReportColumn[]
  filename: string
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function exportAs(format: "csv" | "xlsx" | "pdf") {
    setBusy(true)
    setError("")
    try {
      const rows = await fetchRows()
      if (!rows.length) {
        setError("No records available for this report yet.")
        return
      }
      if (format === "csv") downloadCSV(rows, filename, columns)
      else if (format === "xlsx") downloadXLSX(rows, filename, columns)
      else await downloadPDF(title, rows, filename, columns)
    } catch (err) {
      setError(getErrorMessage(err, "Could not generate the report."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="glass-card glass-hover p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" disabled={busy}>
              <Download className="h-4 w-4 mr-1" />
              {busy ? "Preparing…" : "Export"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Download as</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => exportAs("csv")}>
              <FileText className="h-4 w-4 mr-2" /> CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportAs("xlsx")}>
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel (.xlsx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportAs("pdf")}>
              <FileText className="h-4 w-4 mr-2" /> PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
