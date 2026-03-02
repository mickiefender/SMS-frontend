"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { usePayment } from "@/hooks/usePayment"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function PaymentVerification() {
  const searchParams = useSearchParams()
  const { verifyPayment, loading } = usePayment()
  const [paymentStatus, setPaymentStatus] = useState<
    "verifying" | "success" | "failed" | "error"
  >("verifying")
  const [paymentData, setPaymentData] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string>("")

  useEffect(() => {
    const reference = searchParams.get("reference")
    const trxref = searchParams.get("trxref")
    const ref = reference || trxref

    if (ref) {
      handleVerification(ref)
    } else {
      setPaymentStatus("error")
      setErrorMessage("No payment reference found")
    }
  }, [searchParams])

  const handleVerification = async (reference: string) => {
    try {
      const result = await verifyPayment(reference)
      if (result.status) {
        setPaymentStatus("success")
        setPaymentData(result.data)
      } else {
        setPaymentStatus("failed")
        setPaymentData(result.data)
      }
    } catch (err: any) {
      setPaymentStatus("error")
      setErrorMessage(err.message)
    }
  }

  if (paymentStatus === "verifying" || loading) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Verifying your payment...</p>
      </div>
    )
  }

  if (paymentStatus === "success") {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-800">
              Payment Successful!
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Reference</span>
              <span className="font-medium text-sm">{paymentData?.reference}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Amount</span>
              <span className="font-medium">
                GH¢{paymentData?.amount?.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Channel</span>
              <span className="font-medium capitalize">
                {paymentData?.channel}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Date</span>
              <span className="font-medium">
                {paymentData?.paid_at
                  ? new Date(paymentData.paid_at).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
          </div>

          <Button
            onClick={() => (window.location.href = "/dashboard")}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
          >
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (paymentStatus === "failed") {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-800">Payment Failed</h2>
            <p className="text-gray-600 mt-2">
              {paymentData?.gateway_response ||
                "Your payment could not be processed"}
            </p>
          </div>

          <Button
            onClick={() => window.history.back()}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Error</h2>
        <p className="text-gray-600 mt-2">{errorMessage}</p>
        <Button
          onClick={() => (window.location.href = "/dashboard")}
          className="mt-4 bg-blue-600 hover:bg-blue-700"
        >
          Back to Dashboard
        </Button>
      </CardContent>
    </Card>
  )
}
