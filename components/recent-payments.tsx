"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthContext } from "@/lib/auth-context"

interface PaymentRecord {
  id: string
  student_name: string
  amount: number
  fee_type: string
  reference: string
  status: string
  payment_channel: string
  paid_at: string
  created_at: string
}

export function RecentPayments() {
  const { user } = useAuthContext()
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecentPayments = async () => {
    try {
      const schoolId = user?.school_id || "default"
      const response = await fetch(`/api/payments/history?school_id=${schoolId}`)
      const data = await response.json()
      const apiPayments = (data.payments || []).slice(0, 8)

      // Also check localStorage for school payment notifications
      if (typeof window !== "undefined") {
        try {
          const notifKey = `school_payment_notifications_${schoolId}`
          const localNotifs = JSON.parse(localStorage.getItem(notifKey) || "[]")
          const apiRefs = new Set(apiPayments.map((p: any) => p.reference))

          const localPayments = localNotifs
            .filter((n: any) => !apiRefs.has(n.metadata?.reference))
            .map((n: any) => ({
              id: n.id,
              student_name: n.metadata?.student_name || "Student",
              amount: n.metadata?.amount || 0,
              fee_type: n.metadata?.fee_type || "Fee Payment",
              reference: n.metadata?.reference || "",
              status: "success",
              payment_channel: n.metadata?.channel || "",
              paid_at: n.created_at,
              created_at: n.created_at,
            }))

          const merged = [...apiPayments, ...localPayments]
            .sort((a: any, b: any) => new Date(b.created_at || b.paid_at).getTime() - new Date(a.created_at || a.paid_at).getTime())
            .slice(0, 8)

          setPayments(merged)
        } catch {
          setPayments(apiPayments)
        }
      } else {
        setPayments(apiPayments)
      }
    } catch (error) {
      console.error("Failed to fetch recent payments:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecentPayments()
    const interval = setInterval(fetchRecentPayments, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      success: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Recent Fee Payments</CardTitle>
          <a
            href="/dashboard/school-admin/payments"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All
          </a>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm">No payments recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-bold">
                    ₵
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {payment.student_name || "Student"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payment.fee_type} • {formatTimeAgo(payment.paid_at || payment.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-700">
                    GH¢{Number(payment.amount).toFixed(2)}
                  </p>
                  {getStatusBadge(payment.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
