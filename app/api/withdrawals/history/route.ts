import { NextRequest, NextResponse } from "next/server"
import { getWithdrawalRecords } from "../request/route"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get("school_id")

    const withdrawals = getWithdrawalRecords(schoolId || undefined)

    return NextResponse.json({
      status: true,
      withdrawals,
      total: withdrawals.length,
    })
  } catch (error: any) {
    console.error("Withdrawal history error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch withdrawal history" },
      { status: 500 }
    )
  }
}
