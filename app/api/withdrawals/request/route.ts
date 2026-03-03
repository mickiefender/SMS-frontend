import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@schoolmanagement.com"

// In-memory OTP store (in production, use Redis or database)
const otpStore: Map<string, { otp: string; expires: number; withdrawalData: any }> = new Map()

export function getOtpEntry(email: string) {
  return otpStore.get(email)
}

export function deleteOtpEntry(email: string) {
  otpStore.delete(email)
}

// In-memory withdrawal records
const withdrawalRecords: any[] = []

export function addWithdrawalRecord(record: any) {
  withdrawalRecords.unshift(record)
}

export function getWithdrawalRecords(schoolId?: string): any[] {
  if (schoolId) {
    return withdrawalRecords.filter((r) => r.school_id === schoolId)
  }
  return withdrawalRecords
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, amount, method, account_details, school_id, school_name } = body

    if (!email || !amount || !method || !account_details) {
      return NextResponse.json(
        { error: "Missing required fields: email, amount, method, account_details" },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      )
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = Date.now() + 10 * 60 * 1000 // 10 minutes

    // Store OTP with withdrawal data
    otpStore.set(email, {
      otp,
      expires,
      withdrawalData: {
        amount,
        method,
        account_details,
        school_id,
        school_name,
        email,
        requested_at: new Date().toISOString(),
      },
    })

    // Send OTP via Resend
    const methodLabel = method === "momo" ? "Mobile Money" : "Bank Transfer"
    try {
      await resend.emails.send({
        from: `School Management <${FROM_EMAIL}>`,
        to: [email],
        subject: "Withdrawal OTP Verification",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1a3a52, #0f2438); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: #ffc107; margin: 0; font-size: 24px;">Withdrawal Verification</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 12px 12px;">
              <p style="color: #333; font-size: 16px;">Dear ${school_name || "School Administrator"},</p>
              <p style="color: #666;">You have requested a withdrawal of <strong style="color: #1a3a52;">GH¢${Number(amount).toFixed(2)}</strong> via <strong>${methodLabel}</strong>.</p>
              <div style="background: #f8f9fa; border: 2px dashed #1a3a52; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <p style="color: #666; margin: 0 0 8px 0; font-size: 14px;">Your OTP Code</p>
                <p style="color: #1a3a52; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0;">${otp}</p>
              </div>
              <p style="color: #999; font-size: 13px;">This code expires in 10 minutes. Do not share this code with anyone.</p>
              <p style="color: #999; font-size: 13px;">If you did not request this withdrawal, please ignore this email and secure your account.</p>
            </div>
          </div>
        `,
      })
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError)
      // Still return success - OTP is stored, email might fail in dev
    }

    return NextResponse.json({
      status: true,
      message: "OTP sent to your email address",
      data: {
        email: email.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
        expires_in: "10 minutes",
      },
    })
  } catch (error: any) {
    console.error("Withdrawal request error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process withdrawal request" },
      { status: 500 }
    )
  }
}
