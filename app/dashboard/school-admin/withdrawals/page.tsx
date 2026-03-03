"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProtectedRoute } from "@/lib/protected-route"
import { useAuthContext } from "@/lib/auth-context"
import { useNotifications } from "@/lib/notifications-context"

const formatCurrency = (amount: number): string => {
  return `GH¢${Number(amount).toFixed(2)}`
}

type WithdrawalMethod = "momo" | "bank"
type WithdrawalStep = "form" | "otp" | "success"

interface WithdrawalRecord {
  id: string
  amount: number
  method: string
  status: string
  created_at: string
  account_details: any
}

export default function WithdrawalsPage() {
  const { user, school } = useAuthContext()
  const { addNotification } = useNotifications()
  const [step, setStep] = useState<WithdrawalStep>("form")
  const [method, setMethod] = useState<WithdrawalMethod>("momo")
  const [amount, setAmount] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<any>(null)
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([])
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true)
  const [availableBalance, setAvailableBalance] = useState(0)
  const [balanceLoading, setBalanceLoading] = useState(true)

  // MOMO fields
  const [momoNetwork, setMomoNetwork] = useState("MTN")
  const [momoPhone, setMomoPhone] = useState("")
  const [momoName, setMomoName] = useState("")

  // Bank fields
  const [bankName, setBankName] = useState("")
  const [bankCode, setBankCode] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountName, setAccountName] = useState("")

  useEffect(() => {
    fetchBalance()
    fetchWithdrawals()
  }, [])

  const fetchBalance = async () => {
    try {
      const schoolId = user?.school_id || "default"
      const res = await fetch(`/api/revenue?school_id=${schoolId}`)
      const data = await res.json()
      if (data.status) {
        setAvailableBalance(data.data.available_balance || 0)
      }
    } catch {
      // ignore
    } finally {
      setBalanceLoading(false)
    }
  }

  const fetchWithdrawals = async () => {
    try {
      const schoolId = user?.school_id || "default"
      const res = await fetch(`/api/withdrawals/history?school_id=${schoolId}`)
      const data = await res.json()
      setWithdrawals(data.withdrawals || [])
    } catch {
      // ignore
    } finally {
      setWithdrawalsLoading(false)
    }
  }

  const handleRequestOTP = async () => {
    setError(null)

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    if (Number(amount) > availableBalance) {
      setError(`Amount exceeds available balance of ${formatCurrency(availableBalance)}`)
      return
    }

    if (method === "momo" && (!momoPhone || !momoName)) {
      setError("Please fill in all Mobile Money details")
      return
    }

    if (method === "bank" && (!accountNumber || !accountName || !bankCode)) {
      setError("Please fill in all bank details")
      return
    }

    setLoading(true)

    const accountDetails =
      method === "momo"
        ? { network: momoNetwork, phone_number: momoPhone, account_name: momoName }
        : { bank_name: bankName, bank_code: bankCode, account_number: accountNumber, account_name: accountName }

    try {
      const res = await fetch("/api/withdrawals/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email,
          amount: Number(amount),
          method,
          account_details: accountDetails,
          school_id: String(user?.school_id || "default"),
          school_name: school?.name || "School",
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.status) {
        throw new Error(data.error || "Failed to send OTP")
      }

      setStep("otp")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    setError(null)

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/withdrawals/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email,
          otp,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.status) {
        throw new Error(data.error || "OTP verification failed")
      }

      setSuccessData(data.data)
      setStep("success")

      addNotification({
        type: "withdrawal",
        title: "Withdrawal Processed",
        message: `Your withdrawal of ${formatCurrency(Number(amount))} via ${method === "momo" ? "Mobile Money" : "Bank Transfer"} has been processed.`,
        metadata: { amount: Number(amount), method },
      })

      // Refresh data
      fetchBalance()
      fetchWithdrawals()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep("form")
    setAmount("")
    setOtp("")
    setError(null)
    setSuccessData(null)
    setMomoPhone("")
    setMomoName("")
    setAccountNumber("")
    setAccountName("")
    setBankCode("")
    setBankName("")
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: "bg-green-100 text-green-800",
      processing: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["school_admin"]}>
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Withdrawals</h1>
          <p className="text-gray-600 mt-1">Withdraw your school&apos;s revenue to Mobile Money or Bank Account</p>
        </div>

        {/* Balance Card */}
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Available Balance</p>
                <p className="text-4xl font-bold text-blue-900 mt-1">
                  {balanceLoading ? "..." : formatCurrency(availableBalance)}
                </p>
                <p className="text-xs text-blue-600 mt-2">Ready for withdrawal</p>
              </div>
              <div className="text-6xl">🏦</div>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Form / OTP / Success */}
        <Card>
          <CardHeader>
            <CardTitle>
              {step === "form" && "Request Withdrawal"}
              {step === "otp" && "Verify OTP"}
              {step === "success" && "Withdrawal Successful"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm border border-red-200">
                {error}
              </div>
            )}

            {/* Step 1: Form */}
            {step === "form" && (
              <div className="space-y-6">
                {/* Method Selection */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Withdrawal Method</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setMethod("momo")}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        method === "momo"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-3xl block mb-2">📱</span>
                      <p className="font-semibold">Mobile Money</p>
                      <p className="text-xs text-gray-500 mt-1">MTN, Vodafone, AirtelTigo</p>
                    </button>
                    <button
                      onClick={() => setMethod("bank")}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        method === "bank"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-3xl block mb-2">🏦</span>
                      <p className="font-semibold">Bank Transfer</p>
                      <p className="text-xs text-gray-500 mt-1">Direct bank deposit</p>
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <Label htmlFor="amount">Amount (GH¢)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="1"
                    max={availableBalance}
                    step="0.01"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {formatCurrency(availableBalance)}
                  </p>
                </div>

                {/* MOMO Details */}
                {method === "momo" && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-sm text-gray-700">Mobile Money Details</h4>
                    <div>
                      <Label htmlFor="momo-network">Network</Label>
                      <select
                        id="momo-network"
                        value={momoNetwork}
                        onChange={(e) => setMomoNetwork(e.target.value)}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="MTN">MTN Mobile Money</option>
                        <option value="VOD">Vodafone Cash</option>
                        <option value="ATL">AirtelTigo Money</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="momo-phone">Phone Number</Label>
                      <Input
                        id="momo-phone"
                        value={momoPhone}
                        onChange={(e) => setMomoPhone(e.target.value)}
                        placeholder="0241234567"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="momo-name">Account Name</Label>
                      <Input
                        id="momo-name"
                        value={momoName}
                        onChange={(e) => setMomoName(e.target.value)}
                        placeholder="Full name on MoMo account"
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                {/* Bank Details */}
                {method === "bank" && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-sm text-gray-700">Bank Details</h4>
                    <div>
                      <Label htmlFor="bank-name">Bank Name</Label>
                      <select
                        id="bank-name"
                        value={bankCode}
                        onChange={(e) => {
                          setBankCode(e.target.value)
                          const option = e.target.options[e.target.selectedIndex]
                          setBankName(option.text)
                        }}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">Select Bank</option>
                        <option value="GH010">Ecobank Ghana</option>
                        <option value="GH020">Fidelity Bank</option>
                        <option value="GH030">GCB Bank</option>
                        <option value="GH040">Stanbic Bank</option>
                        <option value="GH050">Standard Chartered</option>
                        <option value="GH060">Absa Bank Ghana</option>
                        <option value="GH070">CalBank</option>
                        <option value="GH080">Zenith Bank Ghana</option>
                        <option value="GH090">Access Bank Ghana</option>
                        <option value="GH100">UBA Ghana</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="account-number">Account Number</Label>
                      <Input
                        id="account-number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Enter account number"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="account-name">Account Name</Label>
                      <Input
                        id="account-name"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Name on bank account"
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleRequestOTP}
                  disabled={loading || !amount || Number(amount) <= 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 py-3"
                >
                  {loading ? "Sending OTP..." : "Request Withdrawal"}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  An OTP will be sent to your email ({user?.email}) for verification
                </p>
              </div>
            )}

            {/* Step 2: OTP Verification */}
            {step === "otp" && (
              <div className="space-y-6 max-w-sm mx-auto">
                <div className="text-center">
                  <span className="text-5xl block mb-4">📧</span>
                  <p className="text-gray-600">
                    We&apos;ve sent a 6-digit OTP to your email address. Please enter it below to confirm your withdrawal.
                  </p>
                </div>

                <div>
                  <Label htmlFor="otp" className="text-center block">Enter OTP</Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="mt-2 text-center text-2xl tracking-[0.5em] font-mono"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-semibold">{formatCurrency(Number(amount))}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600">Method</span>
                    <span className="font-semibold">{method === "momo" ? "Mobile Money" : "Bank Transfer"}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setStep("form")
                      setOtp("")
                      setError(null)
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleVerifyOTP}
                    disabled={loading || otp.length !== 6}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {loading ? "Verifying..." : "Confirm Withdrawal"}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Success */}
            {step === "success" && (
              <div className="text-center space-y-6 max-w-sm mx-auto">
                <div>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-green-800">Withdrawal Successful!</h3>
                  <p className="text-gray-600 mt-2">Your withdrawal is being processed</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg text-left space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-semibold">{formatCurrency(Number(amount))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Method</span>
                    <span className="font-semibold capitalize">{method === "momo" ? "Mobile Money" : "Bank Transfer"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <span className="text-green-600 font-semibold">{successData?.status || "Processing"}</span>
                  </div>
                  {successData?.id && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Reference</span>
                      <span className="font-mono text-xs">{successData.id}</span>
                    </div>
                  )}
                </div>

                <Button onClick={resetForm} className="w-full bg-blue-600 hover:bg-blue-700">
                  Make Another Withdrawal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal History */}
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal History</CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawalsLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No withdrawal records yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold">Date</th>
                      <th className="text-left py-3 px-4 font-semibold">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold">Method</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((wd) => (
                      <tr key={wd.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(wd.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-medium">{formatCurrency(wd.amount)}</td>
                        <td className="py-3 px-4 capitalize">
                          {wd.method === "momo" ? "Mobile Money" : "Bank Transfer"}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(wd.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
