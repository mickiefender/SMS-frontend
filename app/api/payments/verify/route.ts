import { NextRequest, NextResponse } from "next/server"
import { PaystackService } from "@/lib/paystack"
import { addPaymentRecord } from "../history/route"
import { addRevenueRecord } from "../../revenue/route"

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

    const paystack = new PaystackService()
    const result = await paystack.verifyTransaction(reference)

    if (result.data.status === "success") {
      const amountInCedis = result.data.amount / 100

      // Save payment record server-side
      try {
        const studentName = result.data.metadata?.custom_fields?.find(
          (f: any) => f.variable_name === "student_name"
        )?.value || result.data.customer?.first_name || ""

        addPaymentRecord({
          student_id: result.data.metadata?.student_id,
          student_name: studentName,
          email: result.data.customer?.email,
          amount: amountInCedis,
          fee_type: result.data.metadata?.fee_type,
          fee_id: result.data.metadata?.fee_id,
          academic_year: result.data.metadata?.academic_year,
          term: result.data.metadata?.term,
          reference: result.data.reference,
          status: "success",
          payment_channel: result.data.channel,
          school_id: result.data.metadata?.school_id || "default",
          paid_at: result.data.paid_at,
        })

        // Track revenue
        addRevenueRecord({
          type: "payment",
          amount: amountInCedis,
          reference: result.data.reference,
          student_id: result.data.metadata?.student_id,
          student_name: studentName,
          fee_type: result.data.metadata?.fee_type,
          school_id: result.data.metadata?.school_id || "default",
          created_at: new Date().toISOString(),
        })
      } catch (err) {
        console.error("Failed to save payment record:", err)
      }

      return NextResponse.json({
        status: true,
        message: "Payment verified successfully",
        data: {
          reference: result.data.reference,
          amount: amountInCedis,
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
