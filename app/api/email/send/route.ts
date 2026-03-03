import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@schoolmanagement.com"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, html, text, type } = body

    if (!to || !subject) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject" },
        { status: 400 }
      )
    }

    const { data, error } = await resend.emails.send({
      from: `School Management <${FROM_EMAIL}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || undefined,
      text: text || undefined,
    })

    if (error) {
      console.error("Resend email error:", error)
      return NextResponse.json(
        { error: error.message || "Failed to send email" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: true,
      message: "Email sent successfully",
      data: { id: data?.id },
    })
  } catch (error: any) {
    console.error("Email send error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    )
  }
}
