"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  Activity,
  Bell,
  ChevronDown,
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

type HealthTone = { dot: string; label: string }

const HEALTH_TONE: Record<string, HealthTone> = {
  healthy: { dot: "bg-emerald-500", label: "text-emerald-600" },
  degraded: { dot: "bg-amber-500", label: "text-amber-600" },
  down: { dot: "bg-red-500", label: "text-red-600" },
}

const HEALTH_PILL: Record<string, string> = {
  healthy: "border-emerald-200 bg-emerald-50",
  degraded: "border-amber-200 bg-amber-50",
  down: "border-red-200 bg-red-50",
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
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  // ⌘K / Ctrl+K focuses global search.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
        setSearchOpen(true)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
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

  const tone = HEALTH_TONE[health ?? ""]
  const pill = HEALTH_PILL[health ?? ""]

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border bg-card/85 backdrop-blur-md supports-[backdrop-filter]:bg-card/70">
      <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
        {/* Mobile nav */}
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" aria-label="Open navigation">
              <Menu className="h-[18px] w-[18px]" />
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
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-2 min-w-0">
          <Link
            href="/dashboard/super-admin"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            Platform
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" aria-hidden />
          <span className="text-sm font-semibold tracking-tight truncate">{pageTitle(pathname)}</span>
        </nav>

        {/* Global search */}
        <div ref={searchRef} className="relative ml-auto w-full max-w-sm hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            ref={searchInputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) go(results[0].href)
              if (e.key === "Escape") {
                setSearchOpen(false)
                searchInputRef.current?.blur()
              }
            }}
            placeholder="Search pages…"
            className="h-9 w-full rounded-lg border border-transparent bg-muted pl-9 pr-14 text-sm text-foreground shadow-none outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/15"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
            ⌘K
          </kbd>

          {searchOpen && results.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-lg border border-border bg-popover shadow-lg shadow-black/5 overflow-hidden animate-glass-in">
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Pages
              </p>
              {results.map((r) => (
                <button
                  key={r.href}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(r.href)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground/90 hover:bg-muted transition-colors text-left"
                >
                  <r.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{r.label}</span>
                  <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/50" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-1 md:ml-auto ml-auto md:ml-3">
          {/* System health */}
          <Link
            href="/dashboard/super-admin/monitoring"
            title={health ? `System status: ${health}` : "System monitoring"}
            className={`hidden sm:inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              pill ?? "border-border bg-muted text-muted-foreground"
            }`}
          >
            <span className="relative flex h-1.5 w-1.5">
              {health === "healthy" && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              )}
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${tone?.dot ?? "bg-slate-400"}`} />
            </span>
            <span className={tone?.label ?? ""}>
              {health ? `All systems ${health === "healthy" ? "operational" : health}` : "Status"}
            </span>
          </Link>

          <Separator orientation="vertical" className="hidden sm:block h-5 mx-1.5" />

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="text-muted-foreground hover:text-foreground"
            aria-label="Notifications"
          >
            <Link href="/dashboard/super-admin/notifications">
              <Bell className="h-[18px] w-[18px]" />
            </Link>
          </Button>

          {/* Support */}
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hidden sm:inline-flex text-muted-foreground hover:text-foreground"
            aria-label="Support center"
          >
            <Link href="/dashboard/super-admin/support">
              <LifeBuoy className="h-[18px] w-[18px]" />
            </Link>
          </Button>

          <Separator orientation="vertical" className="hidden sm:block h-5 mx-1.5" />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg pl-0.5 pr-1.5 py-1 hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                <Avatar className="h-7 w-7 ring-1 ring-border">
                  <AvatarFallback className="bg-secondary-dark text-secondary-foreground text-[11px] font-bold tracking-wide">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden lg:block max-w-[140px] truncate text-sm font-medium">
                  {fullName}
                </span>
                <ChevronDown className="hidden lg:block h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium truncate">{fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-dark">
                  <ShieldCheck className="h-3 w-3" />
                  Super Admin
                </span>
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
                className="text-destructive focus:text-destructive"
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
