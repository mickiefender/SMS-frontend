"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { billingAPI } from "@/lib/api"
import { useAuthContext } from "@/lib/auth-context"

interface Fee {
  id: number
  name: string
  description: string
  amount: number
  is_active: boolean
  is_mandatory: boolean
}

export function FeesManagement() {
  const { user } = useAuthContext()
  const [fees, setFees] = useState<Fee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [editingFee, setEditingFee] = useState<Fee | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: 0,
    is_active: true,
    is_mandatory: true,
  })

  const fetchFees = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await billingAPI.feeTypes()
      const data = response.data.results || response.data || []
      setFees(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "Failed to load fees")
      setFees([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFees()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      if (editingFee) {
        await billingAPI.updateFeeType(editingFee.id, formData)
      } else {
        await billingAPI.createFeeType(formData)
      }
      setIsOpen(false)
      setEditingFee(null)
      setFormData({ name: "", description: "", amount: 0, is_active: true, is_mandatory: true })
      fetchFees()
    } catch (err: any) {
      const errorData = err?.response?.data
      let errorMsg = "Failed to save fee"
      if (errorData) {
        errorMsg = Object.entries(errorData).map(([key, value]) => `${key}: ${value}`).join(", ")
      }
      setError(errorMsg)
    }
  }

  const handleEdit = (fee: Fee) => {
    setEditingFee(fee)
    setFormData({
      name: fee.name,
      description: fee.description,
      amount: fee.amount,
      is_active: fee.is_active,
      is_mandatory: fee.is_mandatory,
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this fee?")) {
      try {
        await billingAPI.deleteFeeType(id)
        fetchFees()
      } catch (err: any) {
        setError(err?.response?.data?.detail || err?.message || "Failed to delete fee")
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Fees Management</CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={() => {
                  setEditingFee(null)
                  setFormData({ name: "", description: "", amount: 0, is_active: true, is_mandatory: true })
                  setError(null)
                }}
              >
                Add Fee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingFee ? "Edit Fee" : "Add New Fee"}</DialogTitle>
              </DialogHeader>
              {error && <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="flex items-center">
                  <Input
                    id="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <Label htmlFor="is_active" className="ml-2">Is Active</Label>
                </div>
                <div className="flex items-center">
                  <Input
                    id="is_mandatory"
                    type="checkbox"
                    checked={formData.is_mandatory}
                    onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
                  />
                  <Label htmlFor="is_mandatory" className="ml-2">Is Mandatory</Label>
                </div>
                <Button type="submit" className="w-full">
                  {editingFee ? "Update Fee" : "Create Fee"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {error && !isOpen && (
          <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm mb-4">{error}</div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Name</th>
                <th className="text-left py-2 px-2">Amount</th>
                <th className="text-left py-2 px-2">Is Active</th>
                <th className="text-left py-2 px-2">Is Mandatory</th>
                <th className="text-left py-2 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : fees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted-foreground">
                    No fees found. Add your first fee.
                  </td>
                </tr>
              ) : (
                fees.map((fee) => (
                  <tr key={fee.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2">{fee.name}</td>
                    <td className="py-2 px-2">{fee.amount}</td>
                    <td className="py-2 px-2">{fee.is_active ? "Yes" : "No"}</td>
                    <td className="py-2 px-2">{fee.is_mandatory ? "Yes" : "No"}</td>
                    <td className="py-2 px-2">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(fee)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(fee.id)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
