import {
  PaystackInitializeResponse,
  PaystackVerifyResponse,
  PaymentInitData,
} from "@/types/payment"

const PAYSTACK_BASE_URL =
  process.env.PAYSTACK_BASE_URL || "https://api.paystack.co"

export class PaystackService {
  private headers: HeadersInit

  constructor() {
    const secretKey = process.env.PAYSTACK_SECRET_KEY

    if (!secretKey) {
      throw new Error("PAYSTACK_SECRET_KEY is not defined in environment")
    }

    this.headers = {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    }
  }

  // ✅ Initialize payment
  async initializeTransaction(
    data: PaymentInitData
  ): Promise<PaystackInitializeResponse> {
    const reference = `SCH-${Date.now()}-${crypto.randomUUID()}`

    const payload = {
      email: data.email,
      amount: Math.round(data.amount * 100), // convert to pesewas safely
      currency: "GHS",
      reference,
      callback_url:
        data.callback_url ||
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify`,
      metadata: {
        student_id: data.student_id,
        student_name: data.student_name,
        fee_type: data.fee_type,
        fee_id: data.fee_id,
        academic_year: data.academic_year,
        term: data.term,
        school_id: data.school_id,
        school_email: data.school_email,
        custom_fields: [
          {
            display_name: "Student Name",
            variable_name: "student_name",
            value: data.student_name,
          },
          {
            display_name: "Fee Type",
            variable_name: "fee_type",
            value: data.fee_type,
          },
          {
            display_name: "Academic Year",
            variable_name: "academic_year",
            value: data.academic_year,
          },
          {
            display_name: "Term",
            variable_name: "term",
            value: data.term,
          },
        ],
      },
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch(
        `${PAYSTACK_BASE_URL}/transaction/initialize`,
        {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result?.message || "Failed to initialize transaction"
        )
      }

      return result
    } catch (error: any) {
      console.error("Paystack initialize error:", error)
      throw error
    } finally {
      clearTimeout(timeout)
    }
  }

  // ✅ Verify payment
  async verifyTransaction(
    reference: string
  ): Promise<PaystackVerifyResponse> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch(
        `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
        {
          method: "GET",
          headers: this.headers,
          signal: controller.signal,
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.message || "Failed to verify transaction")
      }

      return result
    } catch (error: any) {
      console.error("Paystack verify error:", error)
      throw error
    } finally {
      clearTimeout(timeout)
    }
  }

  // ✅ List transactions
  async listTransactions(params?: {
    perPage?: number
    page?: number
    status?: string
    from?: string
    to?: string
  }) {
    const searchParams = new URLSearchParams()

    if (params?.perPage) searchParams.set("perPage", params.perPage.toString())
    if (params?.page) searchParams.set("page", params.page.toString())
    if (params?.status) searchParams.set("status", params.status)
    if (params?.from) searchParams.set("from", params.from)
    if (params?.to) searchParams.set("to", params.to)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch(
        `${PAYSTACK_BASE_URL}/transaction?${searchParams.toString()}`,
        {
          method: "GET",
          headers: this.headers,
          signal: controller.signal,
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.message || "Failed to list transactions")
      }

      return result
    } catch (error: any) {
      console.error("Paystack list error:", error)
      throw error
    } finally {
      clearTimeout(timeout)
    }
  }

  // ✅ Webhook signature validation
  static validateWebhookSignature(
    body: string,
    signature: string
  ): boolean {
    const crypto = require("crypto")
    const secretKey = process.env.PAYSTACK_SECRET_KEY

    if (!secretKey) {
      console.error("Missing PAYSTACK_SECRET_KEY for webhook validation")
      return false
    }

    const hash = crypto
      .createHmac("sha512", secretKey)
      .update(body)
      .digest("hex")

    return hash === signature
  }
}