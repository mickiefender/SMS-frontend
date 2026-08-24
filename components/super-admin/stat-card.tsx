"use client"

import { CountUp } from "@/components/ui/count-up"
import { cn } from "@/lib/utils"

const TONES = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-emerald-400",
  warning: "text-amber-400",
  danger: "text-red-400",
  muted: "text-muted-foreground",
} as const

export type StatCardTone = keyof typeof TONES

export function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  tone = "default",
  prefix,
  suffix,
}: {
  label: string
  value: number | string
  icon?: React.ComponentType<{ className?: string }>
  sub?: string
  tone?: StatCardTone
  prefix?: string
  suffix?: string
}) {
  return (
    <div className="glass-card glass-hover p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
          {label}
        </p>
        {Icon && (
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
      </div>
      <div className={cn("text-2xl font-bold tracking-tight mt-2 tabular-nums", TONES[tone])}>
        {typeof value === "number" ? (
          <>
            {prefix}
            <CountUp value={value} />
            {suffix}
          </>
        ) : (
          <>
            {prefix}
            {value}
            {suffix}
          </>
        )}
      </div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

export function StatCardGrid({ children }: { children: React.ReactNode }) {
  return (
    <section className="stagger grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {children}
    </section>
  )
}
