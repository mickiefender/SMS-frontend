"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { billingAPI } from "@/lib/api"
import { DollarSign, Download } from "lucide-react"
import Loader from '@/components/loader'

// Helper function to safely format currency amounts
const formatCurrency = (amount: any): string => {
  try {
    return `GH¢${Number(amount).toFixed(2)}`
  } catch {
    return "GH¢0.00"
  }
}

interface StudentFee {
  id: number
  student: number
  student_name: string
  fee: number
  fee_name: string
  fee_details: {
    id: number
    name: string
    description: string
    amount: number
    fee_type: string
    is_active: boolean
    is_mandatory: boolean
  }
  amount: number
  due_date: string
  paid: boolean
  created_at: string
  updated_at: string
}

export default function StudentFeesPage() {
  const [fees, setFees] = useState<StudentFee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFees()
  }, [])

  const fetchFees = async () => {
    try {
      setLoading(true)
      const response = await billingAPI.myFees()
      setFees(response.data || [])
      setError(null)
    } catch (err: any) {
      console.error("Error fetching fees:", err)
      setError("Failed to load fees")
    } finally {
      setLoading(false)
    }
  }

  const calculateTotals = () => {
    const totalDue = fees.reduce((sum, fee) => sum + (fee.paid ? 0 : Number(fee.amount)), 0)
    const totalPaid = fees.reduce((sum, fee) => sum + (fee.paid ? Number(fee.amount) : 0), 0)
    const totalCharged = fees.reduce((sum, fee) => sum + Number(fee.amount), 0)
    
    return { totalDue, totalPaid, totalCharged }
  }

  const { totalDue, totalPaid, totalCharged } = calculateTotals()

  if (loading) {
    return <Loader />
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-green-600" />
            My Fees & Expenses
          </h1>
          <p className="text-gray-600 mt-1">View your fee status and payment history</p>
        </div>
        <Button className="bg-blue-600">
          <Download className="w-4 h-4 mr-2" />
          Download Statement
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            ✕
          </button>
        </div>
      )}

      {/* Fee Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <p className="text-sm text-gray-600 mb-2">Total Due</p>
          <p className="text-3xl font-bold text-red-600">{formatCurrency(totalDue)}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <p className="text-sm text-gray-600 mb-2">Total Paid</p>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600 mb-2">Total Charged</p>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalCharged)}</p>
        </div>
      </div>

      {/* Fees Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Fees</CardTitle>
          <CardDescription>Complete list of all fees assigned to you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold">Fee Type</th>
                  <th className="text-left py-3 px-4 font-semibold">Description</th>
                  <th className="text-left py-3 px-4 font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold">Due Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Category</th>
                </tr>
              </thead>
              <tbody>
                {fees.length > 0 ? (
                  fees.map((fee) => {
                    const isOverdue = !fee.paid && new Date(fee.due_date) < new Date()
                    const statusColor = fee.paid
                      ? "bg-green-100 text-green-800"
                      : isOverdue
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"

                    return (
                      <tr key={fee.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{fee.fee_name}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {fee.fee_details?.description || "No description"}
                        </td>
                        <td className="py-3 px-4 font-semibold">{formatCurrency(fee.amount)}</td>
                        <td className="py-3 px-4">{new Date(fee.due_date).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                            {fee.paid ? "Paid" : isOverdue ? "Overdue" : "Pending"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs capitalize">
                            {fee.fee_details?.fee_type || "N/A"}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No fees assigned yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-lg font-semibold text-blue-900 mb-2">Need to Pay?</p>
        <p className="text-sm text-blue-800 mb-4">
          Contact your school admin or visit the payment portal to pay your outstanding fees online.
        </p>
        <Button className="bg-blue-600 hover:bg-blue-700">Go to Payment Portal</Button>
      </div>
    </div>
  )
}
