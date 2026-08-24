"use client"

import * as XLSX from "xlsx"

type Row = Record<string, any>

function toAoA(rows: Row[], columns?: Array<{ key: string; label: string }>) {
  if (columns?.length) {
    const headers = columns.map((c) => c.label)
    const body = rows.map((r) => columns.map((c) => r[c.key] ?? ""))
    return [headers, ...body]
  }
  if (!rows.length) return [[]]
  const headers = Object.keys(rows[0])
  const body = rows.map((r) => headers.map((h) => r[h] ?? ""))
  return [headers, ...body]
}

export function downloadCSV(rows: Row[], filename: string, columns?: Array<{ key: string; label: string }>) {
  const ws = XLSX.utils.aoa_to_sheet(toAoA(rows, columns))
  const csv = XLSX.utils.sheet_to_csv(ws)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  triggerDownload(blob, `${filename}.csv`)
}

export function downloadXLSX(rows: Row[], filename: string, columns?: Array<{ key: string; label: string }>) {
  const ws = XLSX.utils.aoa_to_sheet(toAoA(rows, columns))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Report")
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export async function downloadPDF(
  title: string,
  rows: Row[],
  filename: string,
  columns?: Array<{ key: string; label: string }>,
) {
  // Render a print-friendly table off-screen and convert it with html2pdf.
  const { default: html2pdf } = await import("html2pdf.js")
  const cols = columns?.length
    ? columns
    : rows.length
      ? Object.keys(rows[0]).map((k) => ({ key: k, label: k }))
      : []

  const container = document.createElement("div")
  container.style.cssText =
    "position:fixed;left:-9999px;top:0;width:900px;background:#fff;color:#111;font-family:sans-serif;padding:24px;"
  container.innerHTML = `
    <h1 style="font-size:20px;margin:0 0 4px;">${escapeHtml(title)}</h1>
    <p style="font-size:11px;color:#666;margin:0 0 16px;">Generated ${new Date().toLocaleString()}</p>
    <table style="width:100%;border-collapse:collapse;font-size:10px;">
      <thead><tr>${cols
        .map((c) => `<th style="text-align:left;border-bottom:1px solid #ccc;padding:6px 4px;">${escapeHtml(c.label)}</th>`)
        .join("")}</tr></thead>
      <tbody>
        ${rows
          .slice(0, 500)
          .map(
            (r) =>
              `<tr>${cols
                .map((c) => `<td style="border-bottom:1px solid #eee;padding:5px 4px;">${escapeHtml(String(r[c.key] ?? ""))}</td>`)
                .join("")}</tr>`,
          )
          .join("")}
      </tbody>
    </table>`
  document.body.appendChild(container)

  try {
    await (html2pdf as any)().set({
      margin: [8, 8],
      filename: `${filename}.pdf`,
      image: { type: "jpeg", quality: 0.9 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
    }).from(container).save()
  } finally {
    document.body.removeChild(container)
  }
}

const ESCAPES: Record<string, string> = {
  [String.fromCharCode(38)]: String.fromCharCode(38, 97, 109, 112, 59), // & -> &
  [String.fromCharCode(60)]: String.fromCharCode(38, 108, 116, 59), // < -> <
  [String.fromCharCode(62)]: String.fromCharCode(38, 103, 116, 59), // > -> >
  [String.fromCharCode(34)]: String.fromCharCode(38, 113, 117, 111, 116, 59), // " -> "
  [String.fromCharCode(39)]: String.fromCharCode(38, 35, 51, 57, 59), // ' -> '
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (ch) => ESCAPES[ch] || ch)
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
