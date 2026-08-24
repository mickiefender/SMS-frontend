"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  Activity,
  Bell,
  ChevronRight,
  LifeBuoy,
  LogOut,
  Menu,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { bgFetch } from "@/lib/api"
import { useAuthContext } from "@/lib/auth-context"
import { NAV_GROUPS } from "./platform-sidebar"

const HEALTH_TONE: Record<string, string> = {
  healthy: "bg-emerald-500",
  degraded: "bg-amber-500",
  down: "bg-red-500",
}

function flattenNav() {
  return NAV_GROUPS.flatMap((g) => g.items)
}

function pageTitle(pathname: string) {
  const match = flattenNav()
    .filter((i) => i.href !== "/dashboard/super-admin")
    .find((i) => pathname.startsWith(i.href))
  return match?.label ?? "Dashboard"
}

export function PlatformTopbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthContext()

  const [navOpen, setNavOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [health, setHealth] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  // Background health probe — never blocks the global loader.
  useEffect(() => {
    let cancelled = false
    bgFetch
      .get("/platform/health/")
      .then((r) => {
        if (cancelled) return
        const checks = r.data?.checks ?? []
        const worst = checks.some((c: any) => c.status === "down")
          ? "down"
          : checks.some((c: any) => c.status === "degraded")
            ? "degraded"
            : checks.length
              ? "healthy"
              : null
        setHealth(worst)
      })
      .catch(() => !cancelled && setHealth(null))
    return () => {
      cancelled = true
    }
  }, [])

  // Close the search dropdown on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return flattenNav().filter((i) => i.label.toLowerCase().includes(q)).slice(0, 6)
  }, [query])

  function go(href: string) {
    setSearchOpen(false)
    setQuery("")
    router.push(href)
  }

  const initials = [user?.first_name?.[0], user?.last_name?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || "SA"
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username || "Super Admin"

  return (
    <header className="sticky top-0 z-40 border-b border-sidebar-border bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/80">
      <div className="flex h-18.5 items-center gap-3 px-4">
        {/* Mobile nav */}
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-sidebar overflow-y-auto">
            <SheetHeader className="px-5 py-4 border-b border-sidebar-border">
              <SheetTitle className="text-sm">Navigation</SheetTitle>
            </SheetHeader>
            <nav className="px-3 py-4 space-y-5">
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
                          onClick={() => setNavOpen(false)}
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
          </SheetContent>
        </Sheet>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-[15px] min-w-0">
          <Link href="/dashboard/super-admin" className="font-medium text-foreground/75 hover:text-foreground transition-colors shrink-0">
            Platform
          </Link>
          <ChevronRight className="h-4 w-4 text-foreground/50 shrink-0" />
          <span className="font-bold tracking-tight truncate">{pageTitle(pathname)}</span>
        </nav>

        {/* Global search */}
        <div ref={searchRef} className="relative ml-auto w-full max-w-xs hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) go(results[0].href)
              if (e.key === "Escape") setSearchOpen(false)
            }}
            placeholder="Search pages…"
            className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-12 text-sm text-foreground placeholder:text-muted-foreground/80 outline-none focus:ring-1 focus:ring-ring"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1 text-[10px] text-muted-foreground">
            ⏎
          </kbd>

          {searchOpen && results.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 rounded-md border border-border bg-popover shadow-md overflow-hidden">
              {results.map((r) => (
                <button
                  key={r.href}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(r.href)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                >
                  <r.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-1 md:ml-0 ml-auto">
          {/* System health */}
          <Link
            href="/dashboard/super-admin/monitoring"
            title={health ? `System status: ${health}` : "System monitoring"}
            className="hidden sm:flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
          >
            <span className="relative flex h-2 w-2">
              {health === "healthy" && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              )}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${HEALTH_TONE[health ?? ""] ?? "bg-slate-400"}`} />
            </span>
            <span className="capitalize">{health ?? "Status"}</span>
          </Link>

          <Separator orientation="vertical" className="hidden sm:block h-5 mx-1" />

          {/* Notifications */}
          <Button variant="ghost" size="icon" asChild aria-label="Notifications">
            <Link href="/dashboard/super-admin/notifications">
              <Bell className="h-4 w-4" />
            </Link>
          </Button>

          {/* Support */}
          <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex" aria-label="Support center">
            <Link href="/dashboard/super-admin/support">
              <LifeBuoy className="h-4 w-4" />
            </Link>
          </Button>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-md pl-1 pr-2 py-1 hover:bg-muted transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-[11px] font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden lg:block text-sm font-semibold max-w-[140px] truncate">
                  {fullName}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="text-sm font-medium truncate">{fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
                <Badge variant="outline" className="mt-1.5 gap-1 text-[10px] capitalize">
                  <ShieldCheck className="h-3 w-3" />
                  super admin
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => go("/dashboard/super-admin/audit-logs")}>
                <ScrollText className="h-4 w-4 mr-2" /> My audit trail
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => go("/dashboard/super-admin/settings")}>
                <Settings className="h-4 w-4 mr-2" /> System settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => go("/dashboard/super-admin/monitoring")}>
                <Activity className="h-4 w-4 mr-2" /> Monitoring
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-500 focus:text-red-500"
                onClick={() => logout()}
              >
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
