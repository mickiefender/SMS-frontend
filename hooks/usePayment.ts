"use client"

import { useState } from "react"
import { PaymentInitData } from "@/types/payment"

interface UsePaymentReturn {
  initiatePayment: (data: PaymentInitData) => Promise<void>
  verifyPayment: (reference: string) => Promise<any>
  loading: boolean
  error: string | null
}

export function usePayment(): UsePaymentReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initiatePayment = async (data: PaymentInitData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Payment initialization failed")
      }

      // Redirect to Paystack checkout
      if (result.data?.authorization_url) {
        window.location.href = result.data.authorization_url
      }
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const verifyPayment = async (reference: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/payments/verify?reference=${reference}`
      )
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Payment verification failed")
      }

      return result
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { initiatePayment, verifyPayment, loading, error }
}
