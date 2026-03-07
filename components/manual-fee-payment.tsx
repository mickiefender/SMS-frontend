"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthContext } from "@/lib/auth-context"
import { usersAPI, billingAPI } from "@/lib/api"
import { CircularLoader } from "@/components/circular-loader"
import { DollarSign, Search, User, Receipt, CreditCard, Building2, Smartphone, Wallet, FileText, Check, X, Printer, Mail } from "lucide-react"

interface Student {
  id: number
  user?: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
  }
  user_data?: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
  }
  username?: string
  email?: string
  first_name?: string
  last_name?: string
  student_id?: string
}

interface FeeAssignment {
  id: number
  student: number
  student_name: string
  fee: number
  fee_name: string
  amount: string
  amount_paid: string
  balance: string
  due_date: string
  paid: boolean
  status: string
}

interface ManualPayment {
  id: number
  receipt_number: string
  amount: string
  payment_method: string
  payment_method_display: string
  fee_name: string
  payment_date: string
  recorded_by_name: string
}

interface PaymentReceipt {
  receipt_number: string
  amount: string
  payment_method: string
  payment_method_display: string
  fee_name: string
  student_name: string
  payment_date: string
  recorded_by_name: string
  balance: string
  is_paid: boolean
}

export function ManualFeePayment() {
  const { user } = useAuthContext()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentFees, setStudentFees] = useState<FeeAssignment[]>([])
  const [studentPayments, setStudentPayments] = useState<ManualPayment[]>([])
  const [feesLoading, setFeesLoading] = useState(false)
  
  // Payment dialog states
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [selectedFee, setSelectedFee] = useState<FeeAssignment | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [paymentNotes, setPaymentNotes] = useState("")
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  
  // Receipt dialog state
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
  const [paymentReceipt, setPaymentReceipt] = useState<PaymentReceipt | null>(null)

  // Fetch students on mount
  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await usersAPI.students()
      const data = response.data.results || response.data || []
      setStudents(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error("Failed to fetch students:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentFees = async (studentId: number) => {
    try {
      setFeesLoading(true)
      const response = await billingAPI.studentFeeAssignmentsByStudent(studentId)
      const fees = response.data.results || response.data || []
      setStudentFees(fees)
      
      // Also fetch payment history
      const paymentsResponse = await billingAPI.manualPaymentsByStudent(studentId)
      const payments = paymentsResponse.data.results || paymentsResponse.data || []
      setStudentPayments(payments)
    } catch (err: any) {
      console.error("Failed to fetch student fees:", err)
    } finally {
      setFeesLoading(false)
    }
  }

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student)
    fetchStudentFees(student.id)
  }

  const handleRecordPayment = async () => {
    if (!selectedStudent || !selectedFee || !paymentAmount) return
    
    setPaymentError(null)
    setProcessingPayment(true)
    
    try {
      const amount = parseFloat(paymentAmount)
      if (isNaN(amount) || amount <= 0) {
        setPaymentError("Please enter a valid amount")
        return
      }
      
      if (amount > parseFloat(selectedFee.balance)) {
        setPaymentError("Amount cannot exceed the balance")
        return
      }
      
      const response = await billingAPI.recordManualPayment({
        student_id: selectedStudent.id,
        fee_assignment_id: selectedFee.id,
        amount: amount,
        payment_method: paymentMethod,
        notes: paymentNotes
      })
      
      // Set receipt data
      const payment = response.data
      setPaymentReceipt({
        receipt_number: payment.receipt_number,
        amount: paymentAmount,
        payment_method: paymentMethod,
        payment_method_display: payment.payment_method_display || paymentMethod,
        fee_name: selectedFee.fee_name,
        student_name: getStudentName(selectedStudent),
        payment_date: new Date().toLocaleString(),
        recorded_by_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'School Admin',
        balance: (parseFloat(selectedFee.balance) - amount).toFixed(2),
        is_paid: parseFloat(selectedFee.balance) - amount <= 0
      })
      
      // Close payment dialog and open receipt dialog
      setIsPaymentDialogOpen(false)
      setReceiptDialogOpen(true)
      
      // Reset form
      setPaymentAmount("")
      setPaymentMethod("cash")
      setPaymentNotes("")
      setSelectedFee(null)
      
      // Refresh fees
      fetchStudentFees(selectedStudent.id)
      
    } catch (err: any) {
      console.error("Failed to record payment:", err)
      setPaymentError(err?.response?.data?.detail || err?.message || "Failed to record payment")
    } finally {
      setProcessingPayment(false)
    }
  }

  const getStudentName = (student: Student) => {
    if (student.first_name || student.last_name) {
      return `${student.first_name || ""} ${student.last_name || ""}`.trim()
    }
    if (student.user_data) {
      return `${student.user_data.first_name || ""} ${student.user_data.last_name || ""}`.trim() || student.user_data.username
    }
    if (student.user) {
      return `${student.user.first_name || ""} ${student.user.last_name || ""}`.trim() || student.user.username
    }
    return student.username || "Unknown"
  }

  const filteredStudents = students.filter(student => {
    const name = getStudentName(student).toLowerCase()
    return name.includes(searchQuery.toLowerCase())
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Paid</span>
      case 'partial':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Partial</span>
      case 'pending':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Pending</span>
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Wallet size={16} />
      case 'bank_transfer': return <Building2 size={16} />
      case 'mobile_money': return <Smartphone size={16} />
      case 'card': return <CreditCard size={16} />
      default: return <DollarSign size={16} />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Collect Fees</h2>
          <p className="text-gray-500">Search and record manual fee payments from students</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Selection Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Student
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="max-h-[500px] overflow-y-auto space-y-2">
              {loading ? (
                <div className="flex justify-center py-8">
                  <CircularLoader />
                </div>
              ) : filteredStudents.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No students found</p>
              ) : (
                filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => handleStudentSelect(student)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedStudent?.id === student.id
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-gray-50 hover:bg-gray-100 border border-transparent"
                    }`}
                  >
                    <p className="font-medium">{getStudentName(student)}</p>
                    <p className="text-sm text-gray-500">{student.student_id || student.email || student.user?.email || 'N/A'}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Student Payment Dashboard */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {selectedStudent ? `${getStudentName(selectedStudent)} - Payment Dashboard` : "Student Payment Dashboard"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedStudent ? (
              <div className="text-center py-12 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a student from the list to view their payment dashboard</p>
              </div>
            ) : feesLoading ? (
              <div className="flex justify-center py-12">
                <CircularLoader />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Outstanding Fees */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Outstanding Fees
                  </h3>
                  {studentFees.length === 0 ? (
                    <p className="text-gray-500 text-sm">No fees assigned to this student</p>
                  ) : (
                    <div className="space-y-3">
                      {studentFees.map((fee) => (
                        <div
                          key={fee.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{fee.fee_name}</p>
                            <p className="text-sm text-gray-500">Due: {new Date(fee.due_date).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">GH¢{fee.balance}</p>
                            <p className="text-sm text-gray-500">of GH¢{fee.amount}</p>
                            {getStatusBadge(fee.status)}
                          </div>
                          {parseFloat(fee.balance) > 0 && (
                            <Button
                              size="sm"
                              className="ml-4 bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setSelectedFee(fee)
                                setPaymentAmount(fee.balance)
                                setIsPaymentDialogOpen(true)
                              }}
                            >
                              Record Payment
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment History */}
                {studentPayments.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Payment History
                    </h3>
                    <div className="space-y-2">
                      {studentPayments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-3 bg-white border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {getPaymentMethodIcon(payment.payment_method)}
                            <div>
                              <p className="font-medium">{payment.fee_name}</p>
                              <p className="text-xs text-gray-500">
                                {payment.payment_method_display} • {new Date(payment.payment_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">GH¢{payment.amount}</p>
                            <p className="text-xs text-gray-500">{payment.receipt_number}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          
          {selectedFee && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">{selectedFee.fee_name}</p>
                <p className="text-sm text-gray-500">
                  Balance: GH¢{selectedFee.balance} of GH¢{selectedFee.amount}
                </p>
              </div>
              
              <div>
                <Label htmlFor="amount">Amount (GH¢)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedFee.balance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              
              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      <div className="flex items-center gap-2">
                        <Wallet size={16} /> Cash
                      </div>
                    </SelectItem>
                    <SelectItem value="bank_transfer">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} /> Bank Transfer
                      </div>
                    </SelectItem>
                    <SelectItem value="mobile_money">
                      <div className="flex items-center gap-2">
                        <Smartphone size={16} /> Mobile Money
                      </div>
                    </SelectItem>
                    <SelectItem value="card">
                      <div className="flex items-center gap-2">
                        <CreditCard size={16} /> Card
                      </div>
                    </SelectItem>
                    <SelectItem value="other">
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} /> Other
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Any additional notes"
                />
              </div>
              
              {paymentError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {paymentError}
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleRecordPayment} 
                  disabled={processingPayment || !paymentAmount}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processingPayment ? "Processing..." : "Record Payment"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-green-600" />
              Payment Receipt
            </DialogTitle>
          </DialogHeader>
          
          {paymentReceipt && (
            <div className="space-y-4">
              <div className="text-center border-b pb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold">Payment Successful!</h3>
                <p className="text-gray-500">A receipt has been generated and email sent to the student</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Receipt Number</span>
                  <span className="font-mono font-medium">{paymentReceipt.receipt_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Student</span>
                  <span className="font-medium">{paymentReceipt.student_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fee Type</span>
                  <span className="font-medium">{paymentReceipt.fee_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount Paid</span>
                  <span className="font-semibold text-green-600">GH¢{paymentReceipt.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Method</span>
                  <span className="font-medium">{paymentReceipt.payment_method_display}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium">{paymentReceipt.payment_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Recorded By</span>
                  <span className="font-medium">{paymentReceipt.recorded_by_name}</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-gray-500">Remaining Balance</span>
                  <span className={`font-semibold ${parseFloat(paymentReceipt.balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    GH¢{paymentReceipt.balance}
                  </span>
                </div>
              </div>
              
              {paymentReceipt.is_paid && (
                <div className="bg-green-50 text-green-700 p-3 rounded-lg text-center font-medium">
                  ✓ This fee has been fully paid
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => window.print()}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => setReceiptDialogOpen(false)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

