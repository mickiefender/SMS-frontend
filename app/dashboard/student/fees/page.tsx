"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { billingAPI } from "@/lib/api"
import { useAuthContext } from "@/lib/auth-context"
import { usePayment } from "@/hooks/usePayment"
import { DollarSign, Download } from "lucide-react"
import Loader from "@/components/loader"
import PaymentHistory from "@/components/payments/PaymentHistory"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
  amount_paid: number
  balance: number
  due_date: string
  paid: boolean
  created_at: string
  updated_at: string
}

export default function StudentFeesPage() {
  const { user } = useAuthContext()
  const { initiatePayment, loading: paymentLoading, error: paymentError } = usePayment()
  const [fees, setFees] = useState<StudentFee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payingFeeId, setPayingFeeId] = useState<number | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedFee, setSelectedFee] = useState<StudentFee | null>(null)
  const [customAmount, setCustomAmount] = useState<string>("")
  const [payFullAmount, setPayFullAmount] = useState(true)

  useEffect(() => {
    fetchFees()
  }, [])

  const fetchFees = async () => {
    try {
      setLoading(true)
      const response = await billingAPI.myFees()
      const rawFees = response.data || []
      // Enrich fees with amount_paid and balance from localStorage
      const enrichedFees = (Array.isArray(rawFees) ? rawFees : []).map((fee: any) => {
        const paidKey = `fee_paid_${fee.id}`
        const storedPaid = typeof window !== "undefined" ? Number(localStorage.getItem(paidKey) || 0) : 0
        const totalAmount = Number(fee.amount)
        const amountPaid = fee.amount_paid ? Number(fee.amount_paid) : storedPaid
        const balance = totalAmount - amountPaid
        return {
          ...fee,
          amount_paid: amountPaid,
          balance: balance > 0 ? balance : 0,
          paid: fee.paid || balance <= 0,
        }
      })
      setFees(enrichedFees)
      setError(null)
    } catch (err: any) {
      console.error("Error fetching fees:", err)
      setError("Failed to load fees")
    } finally {
      setLoading(false)
    }
  }

  const openPaymentDialog = (fee: StudentFee) => {
    setSelectedFee(fee)
    setCustomAmount("")
    setPayFullAmount(true)
    setShowPaymentDialog(true)
  }

  const handlePayFee = async () => {
    if (!user || !selectedFee) return

    const balance = selectedFee.balance > 0 ? selectedFee.balance : Number(selectedFee.amount)
    const amountToPay = payFullAmount ? balance : Number(customAmount)

    if (!amountToPay || amountToPay <= 0) {
      setError("Please enter a valid amount")
      return
    }

    if (amountToPay > balance) {
      setError(`Amount cannot exceed the balance of ${formatCurrency(balance)}`)
      return
    }

    setPayingFeeId(selectedFee.id)
    setShowPaymentDialog(false)

    try {
      await initiatePayment({
        email: user.email,
        amount: amountToPay,
        student_id: user.student_id || String(user.id),
        student_name: `${user.first_name} ${user.last_name}`,
        fee_type: selectedFee.fee_name || selectedFee.fee_details?.name || "School Fee",
        fee_id: selectedFee.id,
        academic_year: "2024/2025",
        term: "Current Term",
      })
    } catch (err) {
      console.error("Payment initiation failed:", err)
    } finally {
      setPayingFeeId(null)
    }
  }

  const calculateTotals = () => {
    const totalCharged = fees.reduce((sum, fee) => sum + Number(fee.amount), 0)
    const totalPaid = fees.reduce((sum, fee) => sum + (fee.amount_paid || 0), 0)
    const totalDue = fees.reduce((sum, fee) => sum + (fee.paid ? 0 : (fee.balance > 0 ? fee.balance : Number(fee.amount))), 0)

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

      {paymentError && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg flex justify-between items-center">
          <span>{paymentError}</span>
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
                  <th className="text-left py-3 px-4 font-semibold">Total Amount</th>
                  <th className="text-left py-3 px-4 font-semibold">Paid</th>
                  <th className="text-left py-3 px-4 font-semibold">Balance</th>
                  <th className="text-left py-3 px-4 font-semibold">Due Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {fees.length > 0 ? (
                  fees.map((fee) => {
                    const balance = fee.balance > 0 ? fee.balance : Number(fee.amount)
                    const isOverdue = !fee.paid && new Date(fee.due_date) < new Date()
                    const isPartiallyPaid = (fee.amount_paid || 0) > 0 && !fee.paid
                    const statusColor = fee.paid
                      ? "bg-green-100 text-green-800"
                      : isPartiallyPaid
                        ? "bg-blue-100 text-blue-800"
                        : isOverdue
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    const statusLabel = fee.paid
                      ? "Paid"
                      : isPartiallyPaid
                        ? "Partial"
                        : isOverdue
                          ? "Overdue"
                          : "Pending"

                    return (
                      <tr key={fee.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{fee.fee_name}</td>
                        <td className="py-3 px-4 font-semibold">{formatCurrency(fee.amount)}</td>
                        <td className="py-3 px-4 text-green-600 font-medium">
                          {formatCurrency(fee.amount_paid || 0)}
                        </td>
                        <td className="py-3 px-4 text-red-600 font-medium">
                          {fee.paid ? formatCurrency(0) : formatCurrency(balance)}
                        </td>
                        <td className="py-3 px-4">{new Date(fee.due_date).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {!fee.paid && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              disabled={paymentLoading && payingFeeId === fee.id}
                              onClick={() => openPaymentDialog(fee)}
                            >
                              {paymentLoading && payingFeeId === fee.id ? "Processing..." : "Pay Now"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No fees assigned yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog - Choose amount */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
          </DialogHeader>
          {selectedFee && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Fee Type</p>
                <p className="font-semibold text-lg">{selectedFee.fee_name}</p>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-gray-500">Total Amount</p>
                    <p className="font-medium">{formatCurrency(selectedFee.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Balance Due</p>
                    <p className="font-medium text-red-600">
                      {formatCurrency(selectedFee.balance > 0 ? selectedFee.balance : selectedFee.amount)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="pay-full"
                    name="payment-type"
                    checked={payFullAmount}
                    onChange={() => {
                      setPayFullAmount(true)
                      setCustomAmount("")
                    }}
                    className="w-4 h-4 text-green-600"
                  />
                  <Label htmlFor="pay-full" className="cursor-pointer">
                    Pay full balance ({formatCurrency(selectedFee.balance > 0 ? selectedFee.balance : selectedFee.amount)})
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="pay-partial"
                    name="payment-type"
                    checked={!payFullAmount}
                    onChange={() => setPayFullAmount(false)}
                    className="w-4 h-4 text-green-600"
                  />
                  <Label htmlFor="pay-partial" className="cursor-pointer">
                    Pay a custom amount
                  </Label>
                </div>

                {!payFullAmount && (
                  <div className="ml-7">
                    <Label htmlFor="custom-amount" className="text-sm text-gray-600">
                      Enter amount (GH¢)
                    </Label>
                    <Input
                      id="custom-amount"
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="0.00"
                      min="1"
                      max={selectedFee.balance > 0 ? selectedFee.balance : Number(selectedFee.amount)}
                      step="0.01"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Min: GH¢1.00 | Max: {formatCurrency(selectedFee.balance > 0 ? selectedFee.balance : selectedFee.amount)}
                    </p>
                  </div>
                )}
              </div>

              {/* Amount Preview */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-sm text-green-700">Amount to Pay</p>
                <p className="text-3xl font-bold text-green-800">
                  {formatCurrency(
                    payFullAmount
                      ? (selectedFee.balance > 0 ? selectedFee.balance : Number(selectedFee.amount))
                      : Number(customAmount) || 0
                  )}
                </p>
              </div>

              <Button
                onClick={handlePayFee}
                disabled={paymentLoading || (!payFullAmount && (!customAmount || Number(customAmount) <= 0))}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
              >
                {paymentLoading ? "Processing..." : "Proceed to Payment"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment History */}
      <PaymentHistory studentId={user?.student_id || undefined} />

      {/* Payment Methods Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-lg font-semibold text-blue-900 mb-2">Secure Payments via Paystack</p>
        <p className="text-sm text-blue-800 mb-4">
          All payments are processed securely through Paystack. You can pay using Mobile Money, Bank Card, or Bank Transfer.
          Click the &quot;Pay Now&quot; button next to any unpaid fee to make a payment. You can also choose to pay a partial amount if you cannot pay the full fee at once.
        </p>
      </div>
    </div>
  )
}
