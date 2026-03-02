"use client"

import { useState, useEffect } from "react"
import { PaymentRecord } from "@/types/payment"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PaymentHistoryProps {
  studentId?: string
}

export default function PaymentHistory({ studentId }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    fetchPayments()
  }, [studentId, filter])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (studentId) params.set("student_id", studentId)
      if (filter !== "all") params.set("status", filter)

      const response = await fetch(`/api/payments/history?${params.toString()}`)
      const data = await response.json()
      setPayments(data.payments || [])
    } catch (error) {
      console.error("Failed to fetch payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      success: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      abandoned: "bg-gray-100 text-gray-800",
    }

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[status] || styles.pending
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Payment History</CardTitle>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Payments</option>
            <option value="success">Successful</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No payment records found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Reference</th>
                  <th className="text-left py-3 px-4 font-semibold">Fee Type</th>
                  <th className="text-left py-3 px-4 font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-800 text-xs">
                      {payment.reference}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {payment.fee_type}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">
                      GH¢{payment.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(payment.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
