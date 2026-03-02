"use client"

import { useState } from "react"
import { usePayment } from "@/hooks/usePayment"
import { FeeStructure } from "@/types/payment"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface PaymentFormProps {
  studentId: string
  studentName: string
  studentEmail: string
  fees: FeeStructure[]
}

export default function PaymentForm({
  studentId,
  studentName,
  studentEmail,
  fees,
}: PaymentFormProps) {
  const { initiatePayment, loading, error } = usePayment()
  const [selectedFee, setSelectedFee] = useState<string>("")
  const [customAmount, setCustomAmount] = useState<string>("")

  const selectedFeeData = fees.find((f) => f.id === selectedFee)
  const paymentAmount = selectedFeeData?.amount || Number(customAmount) || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFee && !customAmount) {
      return
    }

    await initiatePayment({
      email: studentEmail,
      amount: paymentAmount,
      student_id: studentId,
      student_name: studentName,
      fee_type: selectedFeeData?.name || "Custom Payment",
      academic_year: selectedFeeData?.academic_year || "2024/2025",
      term: selectedFeeData?.term || "First Term",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Make Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Student</p>
          <p className="font-medium">{studentName}</p>
          <p className="text-sm text-gray-500">{studentEmail}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fee-select">Select Fee Type</Label>
            <select
              id="fee-select"
              value={selectedFee}
              onChange={(e) => {
                setSelectedFee(e.target.value)
                setCustomAmount("")
              }}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select a fee --</option>
              {fees.map((fee) => (
                <option key={fee.id} value={fee.id}>
                  {fee.name} - GH¢{fee.amount.toFixed(2)}
                  {fee.is_mandatory ? " (Mandatory)" : ""}
                </option>
              ))}
            </select>
          </div>

          {!selectedFee && (
            <div>
              <Label htmlFor="custom-amount">Or Enter Custom Amount (GH¢)</Label>
              <Input
                id="custom-amount"
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="mt-1"
              />
            </div>
          )}

          {paymentAmount > 0 && (
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm text-blue-600">Amount to Pay</p>
              <p className="text-2xl font-bold text-blue-800">
                GH¢{paymentAmount.toFixed(2)}
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded text-sm border border-red-200">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || paymentAmount <= 0}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Processing..." : `Pay GH¢${paymentAmount.toFixed(2)}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
