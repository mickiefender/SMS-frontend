import { NextRequest, NextResponse } from "next/server"

// In-memory store for payment history (in production, use a database)
// This is shared across the app via module scope
const paymentRecords: Map<string, any[]> = new Map()

export function addPaymentRecord(record: any) {
  const schoolId = record.school_id || "default"
  const existing = paymentRecords.get(schoolId) || []
  existing.unshift(record)
  paymentRecords.set(schoolId, existing)

  // Also store by student
  const studentKey = `student_${record.student_id}`
  const studentRecords = paymentRecords.get(studentKey) || []
  studentRecords.unshift(record)
  paymentRecords.set(studentKey, studentRecords)
}

export function getPaymentRecords(key: string): any[] {
  return paymentRecords.get(key) || []
}

export function getAllPaymentRecords(): any[] {
  const all: any[] = []
  const seen = new Set<string>()
  paymentRecords.forEach((records) => {
    records.forEach((r) => {
      if (!seen.has(r.reference)) {
        seen.add(r.reference)
        all.push(r)
      }
    })
  })
  return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("student_id")
    const schoolId = searchParams.get("school_id")
    const status = searchParams.get("status")

    let payments: any[]

    if (studentId) {
      payments = getPaymentRecords(`student_${studentId}`)
    } else if (schoolId) {
      payments = getPaymentRecords(schoolId)
    } else {
      payments = getAllPaymentRecords()
    }

    if (status && status !== "all") {
      payments = payments.filter((p) => p.status === status)
    }

    return NextResponse.json({
      status: true,
      payments,
      total: payments.length,
    })
  } catch (error: any) {
    console.error("Payment history error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch payment history" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const record = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      student_id: body.student_id,
      student_name: body.student_name,
      email: body.email,
      amount: body.amount,
      fee_type: body.fee_type,
      fee_id: body.fee_id,
      academic_year: body.academic_year || "2024/2025",
      term: body.term || "Current Term",
      reference: body.reference,
      status: body.status || "success",
      payment_channel: body.payment_channel || "paystack",
      school_id: body.school_id || "default",
      paid_at: body.paid_at || new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    addPaymentRecord(record)

    return NextResponse.json({
      status: true,
      message: "Payment record saved",
      data: record,
    })
  } catch (error: any) {
    console.error("Save payment error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to save payment record" },
      { status: 500 }
    )
  }
}
