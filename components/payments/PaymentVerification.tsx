"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { usePayment } from "@/hooks/usePayment"
import { useNotifications } from "@/lib/notifications-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function PaymentVerification() {
  const searchParams = useSearchParams()
  const { verifyPayment, loading } = usePayment()
  const { addNotification } = useNotifications()
  const [paymentStatus, setPaymentStatus] = useState<
    "verifying" | "success" | "failed" | "error"
  >("verifying")
  const [paymentData, setPaymentData] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const hasVerified = useRef(false)

  useEffect(() => {
    if (hasVerified.current) return
    const reference = searchParams.get("reference")
    const trxref = searchParams.get("trxref")
    const ref = reference || trxref

    if (ref) {
      hasVerified.current = true
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

        // Save payment to history
        await savePaymentHistory(result.data, reference)

        // Send email notification to school
        await sendSchoolNotification(result.data)

        // Add in-app notification for the student
        addNotification({
          type: "payment",
          title: "Payment Successful",
          message: `Your payment of GH¢${result.data.amount?.toFixed(2)} for ${result.data.metadata?.fee_type || "fees"} was successful. Reference: ${reference}`,
          metadata: { reference, amount: result.data.amount },
        })

        // Add in-app notification for the school admin
        broadcastSchoolAdminPaymentNotification(result.data, reference)

        // Update local fee payment tracking
        updateLocalFeePayment(result.data)

        // Mark fee as paid in the backend billing system
        await markFeeAsPaidInBackend(result.data)
      } else {
        setPaymentStatus("failed")
        setPaymentData(result.data)
      }
    } catch (err: any) {
      setPaymentStatus("error")
      setErrorMessage(err.message)
    }
  }

  const savePaymentHistory = async (data: any, reference: string) => {
    try {
      await fetch("/api/payments/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: data.metadata?.student_id,
          student_name: data.metadata?.student_name || data.customer?.first_name,
          email: data.customer?.email,
          amount: data.amount,
          fee_type: data.metadata?.fee_type,
          fee_id: data.metadata?.fee_id,
          academic_year: data.metadata?.academic_year,
          term: data.metadata?.term,
          reference: reference,
          status: "success",
          payment_channel: data.channel,
          paid_at: data.paid_at,
          school_id: data.metadata?.school_id || "default",
        }),
      })
    } catch (err) {
      console.error("Failed to save payment history:", err)
    }
  }

  const sendSchoolNotification = async (data: any) => {
    try {
      // Send email to school via our email API
      await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: data.metadata?.school_email || process.env.NEXT_PUBLIC_SCHOOL_EMAIL,
          subject: `Payment Received - ${data.metadata?.student_name || "Student"}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #1a3a52, #0f2438); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: #ffc107; margin: 0; font-size: 24px;">💰 Payment Received</h1>
              </div>
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 12px 12px;">
                <p style="color: #333; font-size: 16px;">A new payment has been received:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px 0; color: #666;">Student</td>
                    <td style="padding: 10px 0; font-weight: bold; text-align: right;">${data.metadata?.student_name || "N/A"}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px 0; color: #666;">Fee Type</td>
                    <td style="padding: 10px 0; font-weight: bold; text-align: right;">${data.metadata?.fee_type || "N/A"}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px 0; color: #666;">Amount</td>
                    <td style="padding: 10px 0; font-weight: bold; color: #27ae60; text-align: right;">GH¢${data.amount?.toFixed(2)}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px 0; color: #666;">Channel</td>
                    <td style="padding: 10px 0; text-align: right; text-transform: capitalize;">${data.channel || "N/A"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #666;">Reference</td>
                    <td style="padding: 10px 0; font-family: monospace; text-align: right; font-size: 12px;">${data.reference || "N/A"}</td>
                  </tr>
                </table>
                <p style="color: #999; font-size: 12px; margin-top: 20px;">This is an automated notification from your School Management System.</p>
              </div>
            </div>
          `,
          type: "payment_notification",
        }),
      })
    } catch (err) {
      console.error("Failed to send school notification email:", err)
    }
  }

  const markFeeAsPaidInBackend = async (data: any) => {
    try {
      const feeId = data.metadata?.fee_id
      if (feeId) {
        // Try to mark the fee as paid via the billing API
        const token = typeof window !== "undefined" ? sessionStorage.getItem("authToken") : null
        if (token) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/billing/student-fee-assignments/${feeId}/mark_paid/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          })
        }
      }
    } catch (err) {
      console.error("Failed to mark fee as paid in backend:", err)
    }
  }

  const broadcastSchoolAdminPaymentNotification = (data: any, reference: string) => {
    if (typeof window === "undefined") return
    try {
      // Store a payment notification that school admins can pick up
      // We use a shared key pattern that the school admin dashboard polls
      const schoolId = data.metadata?.school_id || "default"
      const notifKey = `school_payment_notifications_${schoolId}`
      const existing = JSON.parse(localStorage.getItem(notifKey) || "[]")
      const newNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: "payment",
        title: "Fee Payment Received",
        message: `${data.metadata?.student_name || data.customer?.first_name || "A student"} paid GH¢${data.amount?.toFixed(2)} for ${data.metadata?.fee_type || "fees"}. Reference: ${reference}`,
        read: false,
        created_at: new Date().toISOString(),
        metadata: {
          reference,
          amount: data.amount,
          student_name: data.metadata?.student_name || data.customer?.first_name,
          fee_type: data.metadata?.fee_type,
          channel: data.channel,
        },
      }
      existing.unshift(newNotification)
      localStorage.setItem(notifKey, JSON.stringify(existing.slice(0, 100)))

      // Also inject into any school admin's notification store
      // Find all notification keys for school admin users and add the notification
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith("notifications_") && !key.startsWith("notifications_guest")) {
          try {
            const userNotifs = JSON.parse(localStorage.getItem(key) || "[]")
            // Check if this user already has this notification (by reference)
            const alreadyExists = userNotifs.some((n: any) => n.metadata?.reference === reference && n.type === "payment" && n.title === "Fee Payment Received")
            if (!alreadyExists) {
              userNotifs.unshift(newNotification)
              localStorage.setItem(key, JSON.stringify(userNotifs.slice(0, 50)))
            }
          } catch {
            // skip invalid entries
          }
        }
      }
    } catch {
      // ignore storage errors
    }
  }

  const updateLocalFeePayment = (data: any) => {
    if (typeof window === "undefined") return
    try {
      const feeId = data.metadata?.fee_id
      const amount = data.amount || 0
      if (feeId) {
        const paidKey = `fee_paid_${feeId}`
        const currentPaid = Number(localStorage.getItem(paidKey) || 0)
        localStorage.setItem(paidKey, String(currentPaid + amount))
      }

      // Also store in general payment history in localStorage
      const historyKey = `payment_history_${data.metadata?.student_id || "unknown"}`
      const existing = JSON.parse(localStorage.getItem(historyKey) || "[]")
      existing.unshift({
        reference: data.reference,
        amount: data.amount,
        fee_type: data.metadata?.fee_type,
        channel: data.channel,
        paid_at: data.paid_at,
        status: "success",
      })
      localStorage.setItem(historyKey, JSON.stringify(existing.slice(0, 100)))
    } catch {
      // ignore storage errors
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
            <p className="text-gray-500 text-sm mt-1">Your school has been notified</p>
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
              <span className="text-gray-600">Fee Type</span>
              <span className="font-medium">
                {paymentData?.metadata?.fee_type || "N/A"}
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

          <div className="mt-6 space-y-3">
            <Button
              onClick={() => (window.location.href = "/dashboard/student/fees")}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              View My Fees
            </Button>
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              variant="outline"
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </div>
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
