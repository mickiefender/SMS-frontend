import { NextRequest, NextResponse } from "next/server"
import { PaystackService } from "@/lib/paystack"
import { WebhookEvent } from "@/types/payment"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-paystack-signature")

    if (!signature) {
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 400 }
      )
    }

    // Validate webhook signature
    const isValid = PaystackService.validateWebhookSignature(body, signature)

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      )
    }

    const event: WebhookEvent = JSON.parse(body)

    switch (event.event) {
      case "charge.success":
        // Payment was successful
        const { reference, amount, channel, paid_at, metadata } = event.data

        console.log(`Payment successful: ${reference}`)
        console.log(`Student: ${metadata.student_id}`)
        console.log(`Amount: ${amount / 100}`)
        console.log(`Fee Type: ${metadata.fee_type}`)
        break

      case "charge.failed":
        // Payment failed
        console.log(`Payment failed: ${event.data.reference}`)
        break

      default:
        console.log(`Unhandled event: ${event.event}`)
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error("Webhook error:", error)
    // Still return 200 to prevent Paystack from retrying
    return NextResponse.json({ received: true }, { status: 200 })
  }
}
