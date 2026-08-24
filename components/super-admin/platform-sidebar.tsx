"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { AlaraLogo } from "@/components/alara-logo"
import {
  Activity,
  BadgeDollarSign,
  BarChart3,
  Bell,
  Building2,
  Database,
  FileText,
  Flag,
  KeyRound,
  LifeBuoy,
  Lock,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  UserCog,
  Wallet,
} from "lucide-react"

export const NAV_GROUPS: Array<{
  label: string
  items: Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string }> }>
}> = [
  {
    label: "Platform",
    items: [
      { href: "/dashboard/super-admin", label: "Dashboard", icon: BarChart3 },
      { href: "/dashboard/super-admin/schools", label: "Schools", icon: Building2 },
      { href: "/dashboard/super-admin/users", label: "Users", icon: Users },
      { href: "/dashboard/super-admin/roles", label: "Roles & Permissions", icon: UserCog },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/dashboard/super-admin/subscriptions", label: "Subscriptions & Plans", icon: BadgeDollarSign },
      { href: "/dashboard/super-admin/payments", label: "Payments & Finance", icon: Wallet },
      { href: "/dashboard/super-admin/analytics", label: "Analytics", icon: FileText },
      { href: "/dashboard/super-admin/reports", label: "Reports", icon: FileText },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/dashboard/super-admin/moderation", label: "Content Moderation", icon: ShieldCheck },
      { href: "/dashboard/super-admin/notifications", label: "Notifications", icon: Bell },
      { href: "/dashboard/super-admin/support", label: "Support Center", icon: LifeBuoy },
      { href: "/dashboard/super-admin/audit-logs", label: "Audit Logs", icon: ScrollText },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/dashboard/super-admin/settings", label: "System Settings", icon: Settings },
      { href: "/dashboard/super-admin/feature-flags", label: "Feature Flags", icon: Flag },
      { href: "/dashboard/super-admin/storage", label: "Storage Management", icon: Database },
      { href: "/dashboard/super-admin/security", label: "Security Center", icon: Lock },
      { href: "/dashboard/super-admin/monitoring", label: "Monitoring", icon: Activity },
      { href: "/dashboard/super-admin/integrations", label: "API & Integrations", icon: KeyRound },
    ],
  },
]

export function PlatformSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex sticky top-0 h-screen overflow-y-auto w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <AlaraLogo width={36} height={36} className="h-9 w-9 object-contain shrink-0" forceVariant="dark" />
        <div>
          <p className="text-sm font-bold tracking-tight text-foreground">Alara Platform</p>
          <p className="text-[11px] text-muted-foreground">Super Admin Console</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/dashboard/super-admin"
                    ? pathname === item.href
                    : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="sa-nav-link"
                    data-active={active}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3">
        <p className="text-[11px] text-muted-foreground">
          Every sensitive action is recorded in the audit log.
        </p>
      </div>
    </aside>
  )
}
