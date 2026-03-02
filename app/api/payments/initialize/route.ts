import { NextRequest, NextResponse } from "next/server"
import { PaystackService } from "@/lib/paystack"
import { PaymentInitData } from "@/types/payment"

export async function POST(request: NextRequest) {
  try {
    const body: PaymentInitData = await request.json()

    // Validate required fields
    if (!body.email || !body.amount || !body.student_id || !body.fee_type) {
      return NextResponse.json(
        { error: "Missing required fields: email, amount, student_id, fee_type" },
        { status: 400 }
      )
    }

    if (body.amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
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

    const result = await paystack.initializeTransaction(body)

    return NextResponse.json({
      status: true,
      message: "Payment initialized successfully",
      data: {
        authorization_url: result.data.authorization_url,
        access_code: result.data.access_code,
        reference: result.data.reference,
      },
    })
  } catch (error: any) {
    console.error("Payment initialization error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to initialize payment" },
      { status: 500 }
    )
  }
}
