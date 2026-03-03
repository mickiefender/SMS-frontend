import { NextRequest, NextResponse } from "next/server"
import { PaystackService } from "@/lib/paystack"
import { WebhookEvent } from "@/types/payment"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@schoolmanagement.com"

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
        const { reference, amount, channel, paid_at, metadata } = event.data

        console.log(`Payment successful: ${reference}`)
        console.log(`Student: ${metadata.student_id}`)
        console.log(`Amount: ${amount / 100}`)
        console.log(`Fee Type: ${metadata.fee_type}`)

        // Save payment record via internal API
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          await fetch(`${appUrl}/api/payments/history`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              student_id: metadata.student_id,
              student_name: metadata.custom_fields?.find((f: any) => f.variable_name === "student_name")?.value || "",
              email: event.data.customer?.email,
              amount: amount / 100,
              fee_type: metadata.fee_type,
              academic_year: metadata.academic_year,
              term: metadata.term,
              reference,
              status: "success",
              payment_channel: channel,
              paid_at,
              school_id: "default",
            }),
          })
        } catch (err) {
          console.error("Failed to save payment record from webhook:", err)
        }

        // Save revenue record
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          await fetch(`${appUrl}/api/revenue`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "payment",
              amount: amount / 100,
              reference,
              student_id: metadata.student_id,
              fee_type: metadata.fee_type,
              school_id: "default",
            }),
          })
        } catch (err) {
          console.error("Failed to save revenue record:", err)
        }

        // Send email notification to school
        try {
          const schoolEmail = process.env.SCHOOL_ADMIN_EMAIL || process.env.NEXT_PUBLIC_SCHOOL_EMAIL
          if (schoolEmail) {
            const studentName = metadata.custom_fields?.find((f: any) => f.variable_name === "student_name")?.value || "Student"
            await resend.emails.send({
              from: `School Management <${FROM_EMAIL}>`,
              to: [schoolEmail],
              subject: `Payment Received - ${studentName} - GH¢${(amount / 100).toFixed(2)}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #1a3a52, #0f2438); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: #ffc107; margin: 0;">Payment Received</h1>
                  </div>
                  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 12px 12px;">
                    <p>A payment has been confirmed via Paystack:</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                      <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px 0; color: #666;">Student</td><td style="padding: 10px 0; font-weight: bold; text-align: right;">${studentName}</td></tr>
                      <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px 0; color: #666;">Fee Type</td><td style="padding: 10px 0; font-weight: bold; text-align: right;">${metadata.fee_type}</td></tr>
                      <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px 0; color: #666;">Amount</td><td style="padding: 10px 0; font-weight: bold; color: #27ae60; text-align: right;">GH¢${(amount / 100).toFixed(2)}</td></tr>
                      <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px 0; color: #666;">Channel</td><td style="padding: 10px 0; text-align: right; text-transform: capitalize;">${channel}</td></tr>
                      <tr><td style="padding: 10px 0; color: #666;">Reference</td><td style="padding: 10px 0; font-family: monospace; text-align: right; font-size: 12px;">${reference}</td></tr>
                    </table>
                    <p style="color: #999; font-size: 12px;">This is an automated notification from your School Management System.</p>
                  </div>
                </div>
              `,
            })
          }
        } catch (emailErr) {
          console.error("Failed to send school notification email:", emailErr)
        }

        break

      case "charge.failed":
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
