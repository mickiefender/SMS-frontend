import {
  PaystackInitializeResponse,
  PaystackVerifyResponse,
  PaymentInitData,
} from "@/types/payment"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!
const PAYSTACK_BASE_URL = "https://api.paystack.co"

export class PaystackService {
  private headers: HeadersInit

  constructor() {
    this.headers = {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    }
  }

  async initializeTransaction(
    data: PaymentInitData
  ): Promise<PaystackInitializeResponse> {
    const payload = {
      email: data.email,
      amount: data.amount * 100, // Convert to pesewas
      currency: "GHS", // Ghana Cedis
      reference: `SCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to initialize transaction")
    }

    return response.json()
  }

  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: this.headers,
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to verify transaction")
    }

    return response.json()
  }

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

    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transaction?${searchParams.toString()}`,
      {
        method: "GET",
        headers: this.headers,
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to list transactions")
    }

    return response.json()
  }

  static validateWebhookSignature(
    body: string,
    signature: string
  ): boolean {
    const crypto = require("crypto")
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(body)
      .digest("hex")
    return hash === signature
  }
}
