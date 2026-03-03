import { NextRequest, NextResponse } from "next/server"

// In-memory revenue store
const revenueRecords: Map<string, any[]> = new Map()

export function addRevenueRecord(record: any) {
  const schoolId = record.school_id || "default"
  const existing = revenueRecords.get(schoolId) || []
  existing.unshift(record)
  revenueRecords.set(schoolId, existing)
}

export function getRevenueRecords(schoolId: string): any[] {
  return revenueRecords.get(schoolId) || []
}

export function getTotalRevenue(schoolId: string): number {
  const records = getRevenueRecords(schoolId)
  return records.reduce((sum, r) => sum + (r.amount || 0), 0)
}

export function getTotalWithdrawn(schoolId: string): number {
  const records = getRevenueRecords(schoolId)
  return records
    .filter((r) => r.type === "withdrawal")
    .reduce((sum, r) => sum + Math.abs(r.amount || 0), 0)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const record = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: body.type || "payment",
      amount: body.amount || 0,
      reference: body.reference,
      student_id: body.student_id,
      student_name: body.student_name,
      fee_type: body.fee_type,
      school_id: body.school_id || "default",
      created_at: new Date().toISOString(),
    }
    addRevenueRecord(record)
    return NextResponse.json({ status: true, data: record })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get("school_id") || "default"

    const records = getRevenueRecords(schoolId)
    const totalRevenue = records
      .filter((r) => r.type === "payment")
      .reduce((sum, r) => sum + (r.amount || 0), 0)
    const totalWithdrawn = records
      .filter((r) => r.type === "withdrawal")
      .reduce((sum, r) => sum + Math.abs(r.amount || 0), 0)
    const availableBalance = totalRevenue - totalWithdrawn

    return NextResponse.json({
      status: true,
      data: {
        total_revenue: totalRevenue,
        total_withdrawn: totalWithdrawn,
        available_balance: availableBalance,
        records,
      },
    })
  } catch (error: any) {
    console.error("Revenue error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch revenue data" },
      { status: 500 }
    )
  }
}
