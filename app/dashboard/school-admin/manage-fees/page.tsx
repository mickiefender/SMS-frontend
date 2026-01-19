"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { academicsAPI, authAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Edit2, Plus } from "lucide-react"

interface SchoolFee {
  id: number
  title: string
  student_name: string
  amount_due: number
  amount_paid: number
  status: string
  due_date: string
}

export default function ManageSchoolFeesPage() {
  const [fees, setFees] = useState<SchoolFee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [editingFee, setEditingFee] = useState<SchoolFee | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: "",
    student: "",
    class_obj: "",
    amount_due: "",
    amount_paid: "0",
    due_date: "",
    status: "pending",
    description: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [feesRes, studentsRes, classesRes] = await Promise.all([
        academicsAPI.schoolFees(),
        academicsAPI.enrollments(),
        academicsAPI.classes(),
      ])

      setFees(feesRes.data.results || feesRes.data || [])
      setStudents(studentsRes.data.results || studentsRes.data || [])
      setClasses(classesRes.data.results || classesRes.data || [])
      setError(null)
    } catch (err: any) {
      console.error("Error:", err)
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!formData.title || !formData.student || !formData.amount_due || !formData.due_date) {
        setError("Please fill in all required fields")
        return
      }

      const data = {
        title: formData.title,
        student: Number.parseInt(formData.student),
        class_obj: Number.parseInt(formData.class_obj),
        amount_due: parseFloat(formData.amount_due),
        amount_paid: parseFloat(formData.amount_paid),
        due_date: formData.due_date,
        status: formData.status,
        description: formData.description,
      }

      if (editingFee) {
        await academicsAPI.updateSchoolFee(editingFee.id, data)
      } else {
        await academicsAPI.createSchoolFee(data)
      }

      setIsOpen(false)
      setEditingFee(null)
      setFormData({ title: "", student: "", class_obj: "", amount_due: "", amount_paid: "0", due_date: "", status: "pending", description: "" })
      setError(null)
      fetchData()
    } catch (err: any) {
      console.error("Error:", err?.response?.data)
      setError(err?.response?.data?.detail || "Failed to save fee")
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure?")) {
      try {
        await academicsAPI.deleteSchoolFee(id)
        fetchData()
      } catch (err) {
        setError("Failed to delete fee")
      }
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage School Fees</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingFee(null)
                setFormData({ title: "", student: "", class_obj: "", amount_due: "", amount_paid: "0", due_date: "", status: "pending", description: "" })
              }}
              className="bg-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Fee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingFee ? "Edit Fee" : "Create New Fee"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}

              <div>
                <Label>Fee Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Tuition Fee"
                />
              </div>

              <div>
                <Label>Student *</Label>
                <select
                  value={formData.student}
                  onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.student_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Class *</Label>
                <select
                  value={formData.class_obj}
                  onChange={(e) => setFormData({ ...formData, class_obj: e.target.value })}
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
                <Label>Amount Due *</Label>
                <Input
                  type="number"
                  value={formData.amount_due}
                  onChange={(e) => setFormData({ ...formData, amount_due: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>Amount Paid</Label>
                <Input
                  type="number"
                  value={formData.amount_paid}
                  onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div>
                <Label>Status</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <Button type="submit" className="w-full bg-purple-600">
                {editingFee ? "Update" : "Create"} Fee
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>School Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Title</th>
                  <th className="text-left py-3 px-4 font-semibold">Student</th>
                  <th className="text-left py-3 px-4 font-semibold">Amount Due</th>
                  <th className="text-left py-3 px-4 font-semibold">Amount Paid</th>
                  <th className="text-left py-3 px-4 font-semibold">Due Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((fee) => (
                  <tr key={fee.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{fee.title}</td>
                    <td className="py-3 px-4">{fee.student_name}</td>
                    <td className="py-3 px-4">${fee.amount_due}</td>
                    <td className="py-3 px-4">${fee.amount_paid}</td>
                    <td className="py-3 px-4">{new Date(fee.due_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded text-xs font-semibold ${fee.status === "paid" ? "bg-green-100 text-green-800" : fee.status === "overdue" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                        {fee.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setEditingFee(fee); setIsOpen(true); }}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(fee.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
