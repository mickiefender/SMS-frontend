"use client"

import {
  Building2,
  CircleDollarSign,
  GraduationCap,
  LifeBuoy,
  Receipt,
  ScrollText,
} from "lucide-react"
import { platformAPI, schoolsAPI } from "@/lib/api"
import type { AnyObj } from "@/components/super-admin/types"
import { useFetch } from "@/components/super-admin/use-fetch"
import { PageHeader } from "@/components/super-admin/page-header"
import { StatCard, StatCardGrid } from "@/components/super-admin/stat-card"
import { ReportCard } from "@/components/super-admin/report-card"

function unwrap(res: { data: any }): AnyObj[] {
  return res.data?.results || res.data || []
}

export default function SuperAdminReportsPage() {
  const overview = useFetch<AnyObj>(() => platformAPI.overview().then((r) => r.data), [])
  const o = overview.data

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and download platform-wide reports. Data is pulled fresh at export time."
      />

      {overview.error && (
        <div className="glass-red rounded-xl p-3 text-sm text-red-300">{overview.error}</div>
      )}

      <StatCardGrid>
        <StatCard label="Schools" value={o?.schools?.total ?? 0} icon={Building2} sub={`${o?.schools?.active ?? 0} active`} />
        <StatCard label="Users" value={o?.users?.total ?? 0} icon={GraduationCap} />
        <StatCard
          label="Revenue (all time)"
          value={`GH₵ ${Number(o?.revenue?.total ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={CircleDollarSign}
          tone="primary"
        />
        <StatCard label="Open tickets" value={o?.support?.open_tickets ?? 0} icon={LifeBuoy} tone="warning" />
      </StatCardGrid>

      <section className="stagger grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <ReportCard
          icon={Receipt}
          title="Invoices report"
          description="Every subscription invoice with amounts, status and billing period."
          filename="platform-invoices"
          fetchRows={() => platformAPI.invoices({ page_size: 500 }).then(unwrap)}
          columns={[
            { key: "number", label: "Invoice #" },
            { key: "school_name", label: "School" },
            { key: "amount_due", label: "Amount due" },
            { key: "amount_paid", label: "Amount paid" },
            { key: "currency", label: "Currency" },
            { key: "status", label: "Status" },
            { key: "due_date", label: "Due date" },
            { key: "created_at", label: "Created" },
          ]}
        />

        <ReportCard
          icon={CircleDollarSign}
          title="Refunds report"
          description="All refund requests with amounts, reasons and processing state."
          filename="platform-refunds"
          fetchRows={() => platformAPI.refunds().then(unwrap)}
          columns={[
            { key: "transaction_ref", label: "Transaction ref" },
            { key: "school_name", label: "School" },
            { key: "amount", label: "Amount" },
            { key: "currency", label: "Currency" },
            { key: "reason", label: "Reason" },
            { key: "status", label: "Status" },
            { key: "processed_at", label: "Processed" },
            { key: "created_at", label: "Created" },
          ]}
        />

        <ReportCard
          icon={Building2}
          title="Schools directory"
          description="All registered schools with their status and plan details."
          filename="platform-schools"
          fetchRows={() => schoolsAPI.list().then(unwrap)}
          columns={[
            { key: "id", label: "ID" },
            { key: "name", label: "School" },
            { key: "status", label: "Status" },
            { key: "created_at", label: "Registered" },
          ]}
        />

        <ReportCard
          icon={ScrollText}
          title="Audit log report"
          description="Recent administrative actions across the platform (latest 500)."
          filename="platform-audit-logs"
          fetchRows={() => platformAPI.auditLogs({ page_size: 500 }).then(unwrap)}
          columns={[
            { key: "actor_name", label: "Actor" },
            { key: "action", label: "Action" },
            { key: "target_type", label: "Target type" },
            { key: "target_label", label: "Target" },
            { key: "ip_address", label: "IP address" },
            { key: "created_at", label: "Timestamp" },
          ]}
        />

        <ReportCard
          icon={LifeBuoy}
          title="Support tickets report"
          description="Open and resolved support tickets with priority and assignee."
          filename="platform-support-tickets"
          fetchRows={() => platformAPI.tickets({ page_size: 500 }).then(unwrap)}
          columns={[
            { key: "reference", label: "Reference" },
            { key: "school_name", label: "School" },
            { key: "requester_name", label: "Requester" },
            { key: "subject", label: "Subject" },
            { key: "kind", label: "Kind" },
            { key: "priority", label: "Priority" },
            { key: "status", label: "Status" },
            { key: "assignee_name", label: "Assignee" },
            { key: "created_at", label: "Created" },
          ]}
        />

        <ReportCard
          icon={GraduationCap}
          title="Growth summary"
          description="Monthly new-school and new-user counts for the last 6 months."
          filename="platform-growth-summary"
          fetchRows={() =>
            platformAPI.overview().then((r) => ((r.data?.growth as AnyObj[]) || []))
          }
          columns={[
            { key: "month", label: "Month" },
            { key: "schools", label: "New schools" },
            { key: "users", label: "New users" },
          ]}
        />
      </section>
    </div>
  )
}
