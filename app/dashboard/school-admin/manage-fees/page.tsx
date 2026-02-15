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
import { Trash2, Edit2, Plus, DollarSign, Users2, GraduationCap, Building2 } from "lucide-react"

// Helper function to safely format currency amounts
const formatCurrency = (amount: any): string => {
  try {
    return `GH¢${Number(amount).toFixed(2)}`
  } catch {
    return "GH¢0.00"
  }
}

interface Fee {
  id: number
  name: string
  description: string
  amount: number
  fee_type: string
  is_active: boolean
  is_mandatory: boolean
}

interface SchoolFeeAssignment {
  id: number
  school: number
  school_name: string
  fee: number
  fee_name: string
  fee_details: Fee
  amount: number
  due_date: string
}

interface ClassFeeAssignment {
  id: number
  class_obj: number
  class_name: string
  fee: number
  fee_name: string
  fee_details: Fee
  amount: number
  due_date: string
}

interface StudentFeeAssignment {
  id: number
  student: number
  student_name: string
  fee: number
  fee_name: string
  fee_details: Fee
  amount: number
  due_date: string
  paid: boolean
}

export default function ManageSchoolFeesPage() {
  const [activeTab, setActiveTab] = useState("fee-types")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fee Types State
  const [fees, setFees] = useState<Fee[]>([])
  const [isFeeDialogOpen, setIsFeeDialogOpen] = useState(false)
  const [editingFee, setEditingFee] = useState<Fee | null>(null)
  const [feeForm, setFeeForm] = useState({
    name: "",
    description: "",
    amount: "",
    fee_type: "academic",
    is_active: true,
    is_mandatory: true,
  })

  // School-wide Assignment State
  const [schoolAssignments, setSchoolAssignments] = useState<SchoolFeeAssignment[]>([])
  const [isSchoolDialogOpen, setIsSchoolDialogOpen] = useState(false)
  const [schoolForm, setSchoolForm] = useState({
    fee: "",
    amount: "",
    due_date: "",
  })

  // Class Assignment State
  const [classAssignments, setClassAssignments] = useState<ClassFeeAssignment[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false)
  const [classForm, setClassForm] = useState({
    fee: "",
    class_obj: "",
    amount: "",
    due_date: "",
  })

  // Individual Student Assignment State
  const [studentAssignments, setStudentAssignments] = useState<StudentFeeAssignment[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false)
  const [studentForm, setStudentForm] = useState({
    fee: "",
    student: "",
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

    if (studentFilter) {
      newFilteredStudents = newFilteredStudents.filter((s) => {
        const studentName = s.full_name || s.first_name + " " + s.last_name || s.username || ""
        return studentName.toLowerCase().includes(studentFilter.toLowerCase())
      })
    }
    setFilteredStudents(newFilteredStudents)
  }, [students, studentFilter])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [feesRes, classesRes, studentsRes, schoolFeesRes, classFeesRes, studentFeesRes] = await Promise.all([
        billingAPI.fees(),
        academicsAPI.classes(),
        usersAPI.students(),
        billingAPI.schoolFeeAssignments(),
        billingAPI.classFeeAssignments(),
        billingAPI.studentFeeAssignments(),
      ]).catch(() => [
        { data: { results: [] } },
        { data: { results: [] } },
        { data: { results: [] } },
        { data: { results: [] } },
        { data: { results: [] } },
        { data: { results: [] } },
      ])

      setFees(feesRes.data.results || feesRes.data || [])
      setClasses(classesRes.data.results || classesRes.data || [])
      setStudents(studentsRes.data.results || studentsRes.data || [])
      setSchoolAssignments(schoolFeesRes.data.results || schoolFeesRes.data || [])
      setClassAssignments(classFeesRes.data.results || classFeesRes.data || [])
      setStudentAssignments(studentFeesRes.data.results || studentFeesRes.data || [])
      setError(null)
    } catch (err: any) {
      console.error("Error fetching data:", err)
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  // Fee Management
  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!feeForm.name || !feeForm.amount) {
        setError("Please fill required fields")
        return
      }

      const data = {
        name: feeForm.name,
        description: feeForm.description,
        amount: parseFloat(feeForm.amount),
        fee_type: feeForm.fee_type,
        is_active: feeForm.is_active,
        is_mandatory: feeForm.is_mandatory,
      }

      if (editingFee) {
        await billingAPI.updateFee(editingFee.id, data)
      } else {
        await billingAPI.createFee(data)
      }

      setIsFeeDialogOpen(false)
      setEditingFee(null)
      setFeeForm({ name: "", description: "", amount: "", fee_type: "academic", is_active: true, is_mandatory: true })
      setError(null)
      await fetchAllData()
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to save fee")
    }
  }

  const handleDeleteFee = async (id: number) => {
    if (confirm("Are you sure you want to delete this fee?")) {
      try {
        await billingAPI.deleteFee(id)
        fetchAllData()
      } catch (err) {
        setError("Failed to delete fee")
      }
    }
  }

  // School-wide Fee Assignment
  const handleAssignToSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!schoolForm.fee || !schoolForm.amount || !schoolForm.due_date) {
        setError("Please fill all required fields")
        return
      }

      const data = {
        fee: parseInt(schoolForm.fee),
        amount: parseFloat(schoolForm.amount),
        due_date: schoolForm.due_date,
      }

      await billingAPI.createSchoolFeeAssignment(data)
      setIsSchoolDialogOpen(false)
      setSchoolForm({ fee: "", amount: "", due_date: "" })
      setError(null)
      alert("Fee assigned to entire school successfully!")
      await fetchAllData()
    } catch (err: any) {
      console.error("School assignment error:", err.response?.data)
      setError(err?.response?.data?.detail || err?.message || "Failed to assign fee to school")
    }
  }

  // Class Fee Assignment
  const handleAssignToClass = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!classForm.fee || !classForm.class_obj || !classForm.amount || !classForm.due_date) {
        setError("Please fill all required fields")
        return
      }

      const data = {
        fee: parseInt(classForm.fee),
        class_obj: parseInt(classForm.class_obj),
        amount: parseFloat(classForm.amount),
        due_date: classForm.due_date,
      }

      await billingAPI.createClassFeeAssignment(data)
      setIsClassDialogOpen(false)
      setClassForm({ fee: "", class_obj: "", amount: "", due_date: "" })
      setError(null)
      alert("Fee assigned to class successfully!")
      await fetchAllData()
    } catch (err: any) {
      console.error("Class assignment error:", err.response?.data)
      setError(err?.response?.data?.detail || err?.message || "Failed to assign fee to class")
    }
  }

  // Individual Student Fee Assignment
  const handleAssignToStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!studentForm.fee || !studentForm.student || !studentForm.amount || !studentForm.due_date) {
        setError("Please fill all required fields")
        return
      }

      const data = {
        fee: parseInt(studentForm.fee),
        student: parseInt(studentForm.student),
        amount: parseFloat(studentForm.amount),
        due_date: studentForm.due_date,
      }

      await billingAPI.createStudentFeeAssignment(data)
      setIsStudentDialogOpen(false)
      setStudentForm({ fee: "", student: "", amount: "", due_date: "" })
      setError(null)
      alert("Fee assigned to student successfully!")
      await fetchAllData()
    } catch (err: any) {
      console.error("Student fee assignment error:", err.response?.data)
      setError(err?.response?.data?.detail || err?.message || "Failed to assign fee to student")
    }
  }

  return (
    <div className="p-6 space-y-6">
      {loading && <div className="flex items-center justify-center min-h-screen">Loading...</div>}

      {!loading && (
        <div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <DollarSign className="w-8 h-8 text-green-600" />
                School Fees Management
              </h1>
              <p className="text-gray-600 mt-1">Manage fee types and assignments at all levels</p>
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="fee-types">Fee Types</TabsTrigger>
              <TabsTrigger value="school-assignment">Assign to School</TabsTrigger>
              <TabsTrigger value="class-assignment">Assign to Class</TabsTrigger>
              <TabsTrigger value="student-assignment">Assign to Student</TabsTrigger>
            </TabsList>

            {/* Fee Types Tab */}
            <TabsContent value="fee-types" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Fee Types</h2>
                <Dialog open={isFeeDialogOpen} onOpenChange={setIsFeeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingFee(null)
                        setFeeForm({ name: "", description: "", amount: "", fee_type: "academic", is_active: true, is_mandatory: true })
                      }}
                      className="bg-purple-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Fee Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingFee ? "Edit Fee Type" : "Create New Fee Type"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveFee} className="space-y-4">
                      <div>
                        <Label>Fee Name *</Label>
                        <Input
                          value={feeForm.name}
                          onChange={(e) => setFeeForm({ ...feeForm, name: e.target.value })}
                          placeholder="e.g., Tuition Fee, PTA Dues"
                        />
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Input
                          value={feeForm.description}
                          onChange={(e) => setFeeForm({ ...feeForm, description: e.target.value })}
                          placeholder="Fee description"
                        />
                      </div>

                      <div>
                        <Label>Default Amount *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={feeForm.amount}
                          onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <Label>Fee Type *</Label>
                        <select
                          value={feeForm.fee_type}
                          onChange={(e) => setFeeForm({ ...feeForm, fee_type: e.target.value })}
                          className="w-full border rounded px-3 py-2"
                        >
                          <option value="academic">Academic</option>
                          <option value="administrative">Administrative</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={feeForm.is_active}
                            onChange={(e) => setFeeForm({ ...feeForm, is_active: e.target.checked })}
                          />
                          <span>Active</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={feeForm.is_mandatory}
                            onChange={(e) => setFeeForm({ ...feeForm, is_mandatory: e.target.checked })}
                          />
                          <span>Mandatory</span>
                        </label>
                      </div>

                      <Button type="submit" className="w-full bg-purple-600">
                        {editingFee ? "Update" : "Create"} Fee Type
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fees.length > 0 ? (
                  fees.map((fee) => (
                    <Card key={fee.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{fee.name}</CardTitle>
                            <CardDescription className="text-sm mt-1">{fee.description || "No description"}</CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingFee(fee)
                                setFeeForm({
                                  name: fee.name,
                                  description: fee.description,
                                  amount: fee.amount.toString(),
                                  fee_type: fee.fee_type,
                                  is_active: fee.is_active,
                                  is_mandatory: fee.is_mandatory,
                                })
                                setIsFeeDialogOpen(true)
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteFee(fee.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Amount:</span>
                            <span className="font-semibold">{formatCurrency(fee.amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Type:</span>
                            <span className="capitalize">{fee.fee_type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className={`px-2 py-1 rounded text-xs ${fee.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                              {fee.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Required:</span>
                            <span className={`px-2 py-1 rounded text-xs ${fee.is_mandatory ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>
                              {fee.is_mandatory ? "Mandatory" : "Optional"}
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

            {/* School-wide Assignment Tab */}
            <TabsContent value="school-assignment" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Building2 className="w-6 h-6" />
                  Assign Fees to Entire School
                </h2>
                <Dialog open={isSchoolDialogOpen} onOpenChange={setIsSchoolDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setSchoolForm({ fee: "", amount: "", due_date: "" })
                      }}
                      className="bg-orange-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Assign to School
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Assign Fee to All Students in School</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAssignToSchool} className="space-y-4">
                      <div>
                        <Label>Fee Type *</Label>
                        <select
                          value={schoolForm.fee}
                          onChange={(e) => {
                            const selectedFee = fees.find(f => f.id === parseInt(e.target.value))
                            setSchoolForm({ 
                              ...schoolForm, 
                              fee: e.target.value,
                              amount: selectedFee ? selectedFee.amount.toString() : ""
                            })
                          }}
                          className="w-full border rounded px-3 py-2"
                        >
                          <option value="">Select Fee Type</option>
                          {fees.filter((f) => f.is_active).map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} - {formatCurrency(f.amount)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label>Amount *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={schoolForm.amount}
                          onChange={(e) => setSchoolForm({ ...schoolForm, amount: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <Label>Due Date *</Label>
                        <Input type="date" value={schoolForm.due_date} onChange={(e) => setSchoolForm({ ...schoolForm, due_date: e.target.value })} />
                      </div>

                      <Button type="submit" className="w-full bg-orange-600">
                        Assign to All Students
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
                          <th className="text-left py-3 px-4 font-semibold">Amount</th>
                          <th className="text-left py-3 px-4 font-semibold">Due Date</th>
                          <th className="text-left py-3 px-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schoolAssignments.length > 0 ? (
                          schoolAssignments.map((assignment) => (
                            <tr key={assignment.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">{assignment.fee_name}</td>
                              <td className="py-3 px-4 font-semibold">{formatCurrency(assignment.amount)}</td>
                              <td className="py-3 px-4">{new Date(assignment.due_date).toLocaleDateString()}</td>
                              <td className="py-3 px-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    if (confirm("Delete this school-wide fee assignment?")) {
                                      try {
                                        await billingAPI.deleteSchoolFeeAssignment(assignment.id)
                                        fetchAllData()
                                      } catch (err) {
                                        setError("Failed to delete assignment")
                                      }
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-gray-500">
                              No school-wide assignments yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
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
                        setClassForm({ fee: "", class_obj: "", amount: "", due_date: "" })
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
                          value={classForm.fee}
                          onChange={(e) => {
                            const selectedFee = fees.find(f => f.id === parseInt(e.target.value))
                            setClassForm({ 
                              ...classForm, 
                              fee: e.target.value,
                              amount: selectedFee ? selectedFee.amount.toString() : ""
                            })
                          }}
                          className="w-full border rounded px-3 py-2"
                        >
                          <option value="">Select Fee Type</option>
                          {fees.filter((f) => f.is_active).map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} - {formatCurrency(f.amount)}
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
                          step="0.01"
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
                          <th className="text-left py-3 px-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classAssignments.length > 0 ? (
                          classAssignments.map((assignment) => (
                            <tr key={assignment.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">{assignment.fee_name}</td>
                              <td className="py-3 px-4">{assignment.class_name}</td>
                              <td className="py-3 px-4 font-semibold">{formatCurrency(assignment.amount)}</td>
                              <td className="py-3 px-4">{new Date(assignment.due_date).toLocaleDateString()}</td>
                              <td className="py-3 px-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    if (confirm("Delete this class fee assignment?")) {
                                      try {
                                        await billingAPI.deleteClassFeeAssignment(assignment.id)
                                        fetchAllData()
                                      } catch (err) {
                                        setError("Failed to delete assignment")
                                      }
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-500">
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
                  Assign Fees to Individual Students
                </h2>
                <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setStudentForm({ fee: "", student: "", amount: "", due_date: "" })
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
                          value={studentForm.fee}
                          onChange={(e) => {
                            const selectedFee = fees.find(f => f.id === parseInt(e.target.value))
                            setStudentForm({ 
                              ...studentForm, 
                              fee: e.target.value,
                              amount: selectedFee ? selectedFee.amount.toString() : ""
                            })
                          }}
                          className="w-full border rounded px-3 py-2"
                        >
                          <option value="">Select Fee Type</option>
                          {fees.filter((f) => f.is_active).map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} - {formatCurrency(f.amount)}
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
                        />
                      </div>

                      <div>
                        <Label>Student *</Label>
                        <select
                          value={studentForm.student}
                          onChange={(e) => setStudentForm({ ...studentForm, student: e.target.value })}
                          className="w-full border rounded px-3 py-2"
                        >
                          <option value="">Select Student</option>
                          {filteredStudents.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.full_name || s.first_name + " " + s.last_name || s.username || `User ${s.id}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label>Amount *</Label>
                        <Input
                          type="number"
                          step="0.01"
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
                          <th className="text-left py-3 px-4 font-semibold">Amount</th>
                          <th className="text-left py-3 px-4 font-semibold">Due Date</th>
                          <th className="text-left py-3 px-4 font-semibold">Status</th>
                          <th className="text-left py-3 px-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentAssignments.length > 0 ? (
                          studentAssignments.map((assignment) => (
                            <tr key={assignment.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">{assignment.student_name}</td>
                              <td className="py-3 px-4">{assignment.fee_name}</td>
                              <td className="py-3 px-4 font-semibold">{formatCurrency(assignment.amount)}</td>
                              <td className="py-3 px-4">{new Date(assignment.due_date).toLocaleDateString()}</td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-3 py-1 rounded text-xs font-semibold ${
                                    assignment.paid ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {assignment.paid ? "Paid" : "Pending"}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    if (confirm("Delete this student fee assignment?")) {
                                      try {
                                        await billingAPI.deleteStudentFeeAssignment(assignment.id)
                                        fetchAllData()
                                      } catch (err) {
                                        setError("Failed to delete assignment")
                                      }
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-gray-500">
                              No individual student assignments yet
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
