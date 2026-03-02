import { NextRequest, NextResponse } from "next/server"
import { PaystackService } from "@/lib/paystack"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get("reference")

    if (!reference) {
      return NextResponse.json(
        { error: "Transaction reference is required" },
        { status: 400 }
      )
    }

    let paystack: PaystackService
    try {
      paystack = new PaystackService()
    } catch (configError: any) {
      console.error("Paystack configuration error:", configError.message)
      return NextResponse.json(
        { error: configError.message },
        { status: 503 }
      )
    }

    const result = await paystack.verifyTransaction(reference)

    if (result.data.status === "success") {
      return NextResponse.json({
        status: true,
        message: "Payment verified successfully",
        data: {
          reference: result.data.reference,
          amount: result.data.amount / 100, // Convert from pesewas
          status: result.data.status,
          channel: result.data.channel,
          paid_at: result.data.paid_at,
          customer: result.data.customer,
          metadata: result.data.metadata,
        },
      })
    } else {
      return NextResponse.json({
        status: false,
        message: `Payment ${result.data.status}`,
        data: {
          reference: result.data.reference,
          status: result.data.status,
          gateway_response: result.data.gateway_response,
        },
      })
    }
  } catch (error: any) {
    console.error("Payment verification error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to verify payment" },
      { status: 500 }
    )
  }
}
