"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { billingAPI, academicsAPI, usersAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Edit2, Plus, DollarSign, Users2, GraduationCap } from "lucide-react"

// Helper function to safely format currency amounts
const formatCurrency = (amount: any): string => {
  try {
    return `GH¢${Number(amount).toFixed(2)}`
  } catch {
    return "GH¢0.00"
  }
}

interface FeeType {
  id: number
  name: string
  description: string
  amount: number
  is_active: boolean
  is_mandatory: boolean
}

interface StudentIndividualFee {
  fee_type_name: string
  paid: any
  id: number
  fee_type: FeeType
  student_name: string
  class_name: string
  amount: number
  due_date: string
  status: string
}

interface ClassFeeAssignment {
  fee_type_name: string
  id: number
  fee_type: FeeType
  class_name: string
  amount: number
  due_date: string
}

export default function ManageSchoolFeesPage() {
  const [activeTab, setActiveTab] = useState("fee-types")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fee Types State
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFeeType, setEditingFeeType] = useState<FeeType | null>(null)
  const [feeTypeForm, setFeeTypeForm] = useState({
    name: "",
    description: "",
    amount: "",
    is_active: true,
    is_mandatory: true,
  })

  // Class Assignment State
  const [classAssignments, setClassAssignments] = useState<ClassFeeAssignment[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false)
  const [classForm, setClassForm] = useState({
    fee_type: "",
    class_obj: "",
    amount: "",
    due_date: "",
  })

  // Individual Student Assignment State
  const [individualFees, setIndividualFees] = useState<StudentIndividualFee[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false)
  const [studentForm, setStudentForm] = useState({
    fee_type: "",
    student: "",
    class_obj: "",
    amount: "",
    due_date: "",
  })
  const [studentFilter, setStudentFilter] = useState("")
  const [filteredStudents, setFilteredStudents] = useState<any[]>([])

  useEffect(() => {
    fetchAllData()
  }, [])

  useEffect(() => {
    let newFilteredStudents = students

    if (studentForm.class_obj) {
      newFilteredStudents = newFilteredStudents.filter(
        (s) => s.current_class?.id === parseInt(studentForm.class_obj)
      )
    }

    if (studentFilter) {
      newFilteredStudents = newFilteredStudents.filter((s) => {
        const studentName = s.full_name || s.student_name || s.username || ""
        return studentName.toLowerCase().includes(studentFilter.toLowerCase())
      })
    }
    setFilteredStudents(newFilteredStudents)
  }, [students, studentFilter, studentForm.class_obj])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      // Fetch all required data from correct endpoints
      const [feeTypesRes, classesRes, studentsRes, classFeesRes, studentFeesRes] = await Promise.all([
        billingAPI.feeTypes(),
        academicsAPI.classes(),
        usersAPI.students(),
        billingAPI.classFees(),
        billingAPI.individualFees(),
      ]).catch(() => [{ data: { results: [] } }, { data: { results: [] } }, { data: { results: [] } }, { data: { results: [] } }, { data: { results: [] } }])

      setFeeTypes(feeTypesRes.data.results || feeTypesRes.data || [])
      setClasses(classesRes.data.results || classesRes.data || [])
      setStudents(studentsRes.data.results || studentsRes.data || [])
      setClassAssignments(classFeesRes.data.results || classFeesRes.data || [])
      setIndividualFees(studentFeesRes.data.results || studentFeesRes.data || [])
      setError(null)
    } catch (err: any) {
      console.error("Error fetching data:", err)
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  // Fee Types Management
  const handleSaveFeeType = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!feeTypeForm.name || !feeTypeForm.amount) {
        setError("Please fill required fields")
        return
      }

      const data = {
        name: feeTypeForm.name,
        description: feeTypeForm.description,
        amount: parseFloat(feeTypeForm.amount),
        is_active: feeTypeForm.is_active,
        is_mandatory: feeTypeForm.is_mandatory,
      }

      if (editingFeeType) {
        await billingAPI.updateFeeType(editingFeeType.id, data)
      } else {
        await billingAPI.createFeeType(data)
      }

      setIsDialogOpen(false)
      setEditingFeeType(null)
      setFeeTypeForm({ name: "", description: "", amount: "", is_active: true, is_mandatory: true })
      setError(null)
      // Wait for data to be fetched before closing dialog
      await fetchAllData()
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to save fee type")
    }
  }

  const handleDeleteFeeType = async (id: number) => {
    if (confirm("Are you sure you want to delete this fee type?")) {
      try {
        await billingAPI.deleteFeeType(id)
        fetchAllData()
      } catch (err) {
        setError("Failed to delete fee type")
      }
    }
  }

  // Class Fee Assignment
  const handleAssignToClass = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!classForm.fee_type || !classForm.class_obj || !classForm.amount || !classForm.due_date) {
        setError("Please fill all required fields")
        return
      }

      const data = {
        fee_type: parseInt(classForm.fee_type),
        class_obj: parseInt(classForm.class_obj),
        amount: parseFloat(classForm.amount),
        due_date: classForm.due_date,
      }

      console.log("[v0] Creating class fee with data:", data)
      const response = await billingAPI.assignFeeToClass(data)
      console.log("[v0] Class fee creation response:", response?.data || response)
      console.log("[v0] Response status:", response?.status)

      setIsClassDialogOpen(false)
      setClassForm({ fee_type: "", class_obj: "", amount: "", due_date: "" })
      setError(null)
      alert("Fee assigned to class successfully!")
      // Wait for fetchAllData to complete before closing
      await fetchAllData()
      console.log("[v0] Data refetched after assignment")
    } catch (err: any) {
      console.error("[v0] Class assignment error:", err.response?.data)
      setError(err?.response?.data?.detail || err?.message || "Failed to assign fees to class")
    }
  }

  // Individual Student Fee Assignment
  const handleAssignToStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!studentForm.fee_type || !studentForm.student || !studentForm.class_obj || !studentForm.amount || !studentForm.due_date) {
        setError("Please fill all required fields")
        return
      }

      const data = {
        fee_type: parseInt(studentForm.fee_type),
        student: parseInt(studentForm.student),
        class_obj: parseInt(studentForm.class_obj),
        amount: parseFloat(studentForm.amount),
        due_date: studentForm.due_date,
      }

      console.log("[v0] Creating student fee with data:", data)
      const response = await billingAPI.assignFeeToStudent(data)
      console.log("[v0] Student fee creation response:", response?.data || response)
      console.log("[v0] Response status:", response?.status)

      setIsStudentDialogOpen(false)
      setStudentForm({ fee_type: "", student: "", class_obj: "", amount: "", due_date: "" })
      setError(null)
      alert("Fee assigned to student successfully!")
      // Wait for fetchAllData to complete before closing
      await fetchAllData()
      console.log("[v0] Data refetched after student assignment")
    } catch (err: any) {
      console.error("[v0] Student fee assignment error:", err.response?.data)
      setError(err?.response?.data?.detail || err?.message || "Failed to assign fees to student")
    }
  }

  return (
    <div className="p-6 space-y-6">
      {loading && (
        <div className="flex items-center justify-center min-h-screen">Loading...</div>
      )}

      {!loading && (
        <div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <DollarSign className="w-8 h-8 text-green-600" />
                School Fees Management
              </h1>
              <p className="text-gray-600 mt-1">Manage fee types, bulk assignments, and individual student fees</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
                ✕
              </button>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="fee-types">Fee Types</TabsTrigger>
              <TabsTrigger value="class-assignment">Assign to Class</TabsTrigger>
              <TabsTrigger value="student-assignment">Assign to Student</TabsTrigger>
            </TabsList>

            {/* Fee Types Tab */}
            <TabsContent value="fee-types" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Fee Types</h2>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingFeeType(null)
                        setFeeTypeForm({ name: "", description: "", amount: "", is_active: true, is_mandatory: true })
                      }}
                      className="bg-purple-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Fee Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingFeeType ? "Edit Fee Type" : "Create New Fee Type"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveFeeType} className="space-y-4">
                      <div>
                        <Label>Fee Type Name *</Label>
                        <Input
                          value={feeTypeForm.name}
                          onChange={(e) => setFeeTypeForm({ ...feeTypeForm, name: e.target.value })}
                          placeholder="e.g., School Fees, PTA Fee"
                        />
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Input
                          value={feeTypeForm.description}
                          onChange={(e) => setFeeTypeForm({ ...feeTypeForm, description: e.target.value })}
                          placeholder="Fee description"
                        />
                      </div>

                      <div>
                        <Label>Default Amount *</Label>
                        <Input
                          type="number"
                          value={feeTypeForm.amount}
                          onChange={(e) => setFeeTypeForm({ ...feeTypeForm, amount: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={feeTypeForm.is_active}
                            onChange={(e) => setFeeTypeForm({ ...feeTypeForm, is_active: e.target.checked })}
                          />
                          <span>Active</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={feeTypeForm.is_mandatory}
                            onChange={(e) => setFeeTypeForm({ ...feeTypeForm, is_mandatory: e.target.checked })}
                          />
                          <span>Mandatory</span>
                        </label>
                      </div>

                      <Button type="submit" className="w-full bg-purple-600">
                        {editingFeeType ? "Update" : "Create"} Fee Type
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {feeTypes.length > 0 ? (
                  feeTypes.map((feeType) => (
                    <Card key={feeType.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{feeType.name}</CardTitle>
                            <CardDescription className="text-sm mt-1">{feeType.description || "No description"}</CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingFeeType(feeType)
                                setFeeTypeForm({
                                  name: feeType.name,
                                  description: feeType.description,
                                  amount: feeType.amount.toString(),
                                  is_active: feeType.is_active,
                                  is_mandatory: feeType.is_mandatory,
                                })
                                setIsDialogOpen(true)
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteFeeType(feeType.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Amount:</span>
                            <span className="font-semibold">{formatCurrency(feeType.amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className={`px-2 py-1 rounded text-xs ${feeType.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                              {feeType.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Type:</span>
                            <span className={`px-2 py-1 rounded text-xs ${feeType.is_mandatory ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>
                              {feeType.is_mandatory ? "Mandatory" : "Optional"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">No fee types created yet</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Class Assignment Tab */}
            <TabsContent value="class-assignment" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <GraduationCap className="w-6 h-6" />
                  Assign Fees to Classes
                </h2>
                <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setClassForm({ fee_type: "", class_obj: "", amount: "", due_date: "" })
                      }}
                      className="bg-blue-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Assign to Class
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Assign Fee to Entire Class</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAssignToClass} className="space-y-4">
                      <div>
                        <Label>Fee Type *</Label>
                        <select
                          value={classForm.fee_type}
                          onChange={(e) => setClassForm({ ...classForm, fee_type: e.target.value })}
                          className="w-full border rounded px-3 py-2"
                        >
                          <option value="">Select Fee Type</option>
                          {feeTypes.filter((f) => f.is_active).map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label>Class *</Label>
                        <select
                          value={classForm.class_obj}
                          onChange={(e) => setClassForm({ ...classForm, class_obj: e.target.value })}
                          className="w-full border rounded px-3 py-2"
                        >
                          <option value="">Select Class</option>
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label>Amount *</Label>
                        <Input
                          type="number"
                          value={classForm.amount}
                          onChange={(e) => setClassForm({ ...classForm, amount: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <Label>Due Date *</Label>
                        <Input type="date" value={classForm.due_date} onChange={(e) => setClassForm({ ...classForm, due_date: e.target.value })} />
                      </div>

                      <Button type="submit" className="w-full bg-blue-600">
                        Assign to Class
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Fee Type</th>
                          <th className="text-left py-3 px-4 font-semibold">Class</th>
                          <th className="text-left py-3 px-4 font-semibold">Amount</th>
                          <th className="text-left py-3 px-4 font-semibold">Due Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classAssignments.length > 0 ? (
                          classAssignments.map((assignment) => (
                            <tr key={assignment.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">{assignment.fee_type_name || assignment.fee_type?.name || "Unknown"}</td>
                              <td className="py-3 px-4">{assignment.class_name}</td>
                              <td className="py-3 px-4 font-semibold">{formatCurrency(assignment.amount)}</td>
                              <td className="py-3 px-4">{new Date(assignment.due_date).toLocaleDateString()}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-gray-500">
                              No class assignments yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Student Assignment Tab */}
            <TabsContent value="student-assignment" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Users2 className="w-6 h-6" />
                  Assign Fees to Students
                </h2>
                <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setStudentForm({ fee_type: "", student: "", class_obj: "", amount: "", due_date: "" })
                      }}
                      className="bg-green-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Assign to Student
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Assign Fee to Individual Student</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAssignToStudent} className="space-y-4">
                      <div>
                        <Label>Fee Type *</Label>
                        <select
                          value={studentForm.fee_type}
                          onChange={(e) => setStudentForm({ ...studentForm, fee_type: e.target.value })}
                          className="w-full border rounded px-3 py-2"
                        >
                          <option value="">Select Fee Type</option>
                          {feeTypes.filter((f) => f.is_active).map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label>Class *</Label>
                        <select
                          value={studentForm.class_obj}
                          onChange={(e) => setStudentForm({ ...studentForm, class_obj: e.target.value, student: "" })}
                          className="w-full border rounded px-3 py-2"
                        >
                          <option value="">Select Class First</option>
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label>Filter Students by Name</Label>
                        <Input
                          type="text"
                          value={studentFilter}
                          onChange={(e) => setStudentFilter(e.target.value)}
                          placeholder="Type to filter..."
                          className="mb-2"
                          disabled={!studentForm.class_obj}
                        />
                      </div>

                      <div>
                        <Label>Student *</Label>
                        <select
                          value={studentForm.student}
                          onChange={(e) => setStudentForm({ ...studentForm, student: e.target.value })}
                          disabled={!studentForm.class_obj}
                          className="w-full border rounded px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">
                            {studentForm.class_obj ? "Select Student" : "Select Class First"}
                          </option>
                          {filteredStudents.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.full_name || s.student_name || s.username || `User ${s.id}`}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <Label>Amount *</Label>
                        <Input
                          type="number"
                          value={studentForm.amount}
                          onChange={(e) => setStudentForm({ ...studentForm, amount: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <Label>Due Date *</Label>
                        <Input type="date" value={studentForm.due_date} onChange={(e) => setStudentForm({ ...studentForm, due_date: e.target.value })} />
                      </div>

                      <Button type="submit" className="w-full bg-green-600">
                        Assign to Student
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Student</th>
                          <th className="text-left py-3 px-4 font-semibold">Fee Type</th>
                          <th className="text-left py-3 px-4 font-semibold">Class</th>
                          <th className="text-left py-3 px-4 font-semibold">Amount</th>
                          <th className="text-left py-3 px-4 font-semibold">Due Date</th>
                          <th className="text-left py-3 px-4 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {individualFees.length > 0 ? (
                          individualFees.map((fee) => (
                            <tr key={fee.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">{fee.student_name}</td>
                              <td className="py-3 px-4">{fee.fee_type_name || fee.fee_type?.name || "Unknown"}</td>
                              <td className="py-3 px-4">{fee.class_name}</td>
                              <td className="py-3 px-4 font-semibold">{formatCurrency(fee.amount)}</td>
                              <td className="py-3 px-4">{new Date(fee.due_date).toLocaleDateString()}</td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-3 py-1 rounded text-xs font-semibold ${
                                    fee.paid ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {fee.paid ? "Paid" : "Pending"}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-gray-500">
                              No individual fees assigned yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
