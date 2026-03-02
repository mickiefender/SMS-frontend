"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { academicsAPI } from "@/lib/api"
import { Settings, Save, Trash2, Plus, Calculator } from "lucide-react"

interface GradingPolicy {
  id: number
  academic_session: number
  session_name?: string
  name: string
  assessment_type: string
  assessment_type_display: string
  weightage: number
  is_active: boolean
}

interface AcademicSession {
  id: number
  name: string
  is_current: boolean
}

const DEFAULT_POLICIES = [
  { assessment_type: 'exam', weightage: 60, name: 'Exam' },
  { assessment_type: 'test', weightage: 10, name: 'Test' },
  { assessment_type: 'quiz', weightage: 10, name: 'Quiz' },
  { assessment_type: 'assignment', weightage: 10, name: 'Assignment' },
  { assessment_type: 'attendance', weightage: 10, name: 'Attendance' },
]

export function GradingPolicyManagement() {
  const [policies, setPolicies] = useState<GradingPolicy[]>([])
  const [sessions, setSessions] = useState<AcademicSession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<string>("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<GradingPolicy | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    assessment_type: "exam",
    weightage: 0,
    name: "Default Grading Policy",
    is_active: true,
  })

  useEffect(() => {
    fetchSessions()
  }, [])

  useEffect(() => {
    if (selectedSession) {
      fetchPolicies(selectedSession)
    }
  }, [selectedSession])

  const fetchSessions = async () => {
    try {
      const res = await academicsAPI.academicSessions()
      const sessionsData = res.data.results || res.data || []
      setSessions(sessionsData)
      
      // Select current session by default
      const currentSession = sessionsData.find((s: AcademicSession) => s.is_current)
      if (currentSession) {
        setSelectedSession(currentSession.id.toString())
      } else if (sessionsData.length > 0) {
        setSelectedSession(sessionsData[0].id.toString())
      }
    } catch (error) {
      console.error("[v0] Failed to fetch sessions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSession = async () => {
    const sessionName = prompt("Enter academic session name (e.g., 'First Term 2024'):")
    if (!sessionName) return
    
    try {
      const term = sessions.length + 1
      const currentYear = new Date().getFullYear()
      await academicsAPI.createAcademicSession({
        name: sessionName,
        term: term,
        start_date: `${currentYear}-01-01`,
        end_date: `${currentYear}-04-30`,
        is_current: sessions.length === 0,
        is_active: true,
      })
      alert("Academic session created! Please refresh the page.")
      fetchSessions()
    } catch (error: any) {
      console.error("[v0] Failed to create session:", error)
      alert("Failed to create session. Make sure you have the required permissions.")
    }
  }

  const fetchPolicies = async (sessionId: string) => {
    try {
      setLoading(true)
      const res = await academicsAPI.gradingPoliciesBySession(parseInt(sessionId))
      setPolicies(res.data || [])
    } catch (error) {
      console.error("[v0] Failed to fetch policies:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePolicies = async () => {
    if (!selectedSession) {
      alert("Please select an academic session")
      return
    }

    try {
      setSaving(true)
      
      // Prepare policies data
      const policiesData = DEFAULT_POLICIES.map(p => ({
        assessment_type: p.assessment_type,
        name: formData.name,
        weightage: p.weightage,
        is_active: true,
      }))

      await academicsAPI.bulkCreateGradingPolicies({
        session_id: parseInt(selectedSession),
        policies: policiesData,
      })

      alert("Grading policies saved successfully!")
      await fetchPolicies(selectedSession)
    } catch (error: any) {
      console.error("[v0] Failed to save policies:", error)
      alert(error?.response?.data?.error || "Failed to save policies")
    } finally {
      setSaving(false)
    }
  }

  const handleAddPolicy = async () => {
    if (!selectedSession) {
      alert("Please select an academic session")
      return
    }

    try {
      setSaving(true)
      await academicsAPI.createGradingPolicy({
        academic_session: parseInt(selectedSession),
        name: formData.name,
        assessment_type: formData.assessment_type,
        weightage: formData.weightage,
        is_active: formData.is_active,
      })

      alert("Policy added successfully!")
      setShowAddDialog(false)
      setFormData({
        assessment_type: "exam",
        weightage: 0,
        name: "Default Grading Policy",
        is_active: true,
      })
      await fetchPolicies(selectedSession)
    } catch (error: any) {
      console.error("[v0] Failed to add policy:", error)
      alert(error?.response?.data?.error || "Failed to add policy")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePolicy = async () => {
    if (!editingPolicy) return

    try {
      setSaving(true)
      await academicsAPI.updateGradingPolicy(editingPolicy.id, {
        name: editingPolicy.name,
        assessment_type: editingPolicy.assessment_type,
        weightage: editingPolicy.weightage,
        is_active: editingPolicy.is_active,
      })

      alert("Policy updated successfully!")
      setEditingPolicy(null)
      await fetchPolicies(selectedSession)
    } catch (error: any) {
      console.error("[v0] Failed to update policy:", error)
      alert(error?.response?.data?.error || "Failed to update policy")
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePolicy = async (policyId: number) => {
    if (!confirm("Are you sure you want to delete this policy?")) return

    try {
      await academicsAPI.deleteGradingPolicy(policyId)
      alert("Policy deleted successfully!")
      await fetchPolicies(selectedSession)
    } catch (error: any) {
      console.error("[v0] Failed to delete policy:", error)
      alert(error?.response?.data?.error || "Failed to delete policy")
    }
  }

  const calculateTotalWeightage = () => {
    return policies.reduce((sum, p) => sum + (p.is_active ? p.weightage : 0), 0)
  }

  const isValidWeightage = calculateTotalWeightage() === 100

  if (loading && sessions.length > 0) {
    return <div className="text-center py-4">Loading grading policies...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Grading Policy Management</h2>
          <p className="text-gray-500">Configure how different assessment types are weighted</p>
        </div>
      </div>

      {/* Session Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Academic Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-full md:w-1/3">
                <SelectValue placeholder="Select Academic Session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id.toString()}>
                    {session.name} {session.is_current ? '(Current)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleCreateSession}>
              <Plus className="w-4 h-4 mr-2" />
              Create Session
            </Button>
          </div>
          {sessions.length === 0 && (
            <p className="text-sm text-red-500 mt-2">
              No academic sessions found. Please create one first.
            </p>
          )}
        </CardContent>
      </Card>

      {selectedSession && (
        <>
          {/* Default Policies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Default Grading Weightage
                </div>
                <Button 
                  onClick={handleSavePolicies} 
                  disabled={saving}
                  className={isValidWeightage ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Default Policies"}
                </Button>
              </CardTitle>
              <CardDescription>
                Set default weightage for each assessment type. Total must equal 100%.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DEFAULT_POLICIES.map((policy) => {
                  const existingPolicy = policies.find(p => p.assessment_type === policy.assessment_type)
                  return (
                    <div key={policy.assessment_type} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="font-medium">{policy.name}</Label>
                        <p className="text-sm text-gray-500">{policy.assessment_type}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32">
                          <Input
                            type="number"
                            value={existingPolicy?.weightage ?? policy.weightage}
                            onChange={async (e) => {
                              const newWeightage = parseFloat(e.target.value) || 0
                              // Try to update locally first for UI responsiveness
                              const updatedPolicies = policies.map(p => 
                                p.assessment_type === policy.assessment_type 
                                  ? { ...p, weightage: newWeightage }
                                  : p
                              )
                              // If not exists, add it
                              if (!existingPolicy) {
                                updatedPolicies.push({
                                  id: 0,
                                  academic_session: parseInt(selectedSession),
                                  name: "Default Grading Policy",
                                  assessment_type: policy.assessment_type,
                                  assessment_type_display: policy.name,
                                  weightage: newWeightage,
                                  is_active: true,
                                })
                              }
                              setPolicies(updatedPolicies)
                            }}
                            min={0}
                            max={100}
                            step={1}
                          />
                        </div>
                        <span className="text-gray-500">%</span>
                        {existingPolicy?.is_active ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <Label className="font-bold text-lg">Total Weightage</Label>
                  <div className="flex items-center gap-4">
                    <span className={`text-2xl font-bold ${isValidWeightage ? 'text-green-600' : 'text-red-600'}`}>
                      {calculateTotalWeightage()}%
                    </span>
                    {!isValidWeightage && (
                      <Badge variant="destructive">Must equal 100%</Badge>
                    )}
                    {isValidWeightage && (
                      <Badge className="bg-green-100 text-green-800">Valid</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Policies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>Custom Policies</div>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Policy
                </Button>
              </CardTitle>
              <CardDescription>
                Add additional custom assessment types beyond the defaults
              </CardDescription>
            </CardHeader>
            <CardContent>
              {policies.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No custom policies yet</p>
              ) : (
                <div className="space-y-2">
                  {policies.filter(p => !DEFAULT_POLICIES.find(d => d.assessment_type === p.assessment_type)).map((policy) => (
                    <div key={policy.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="font-medium">{policy.assessment_type_display}</Label>
                        <p className="text-sm text-gray-500">{policy.weightage}%</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingPolicy(policy)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeletePolicy(policy.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Add Policy Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Grading Policy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Assessment Type</Label>
              <Input
                value={formData.assessment_type}
                onChange={(e) => setFormData({ ...formData, assessment_type: e.target.value })}
                placeholder="e.g., project, homework"
              />
            </div>
            <div>
              <Label>Weightage (%)</Label>
              <Input
                type="number"
                value={formData.weightage}
                onChange={(e) => setFormData({ ...formData, weightage: parseFloat(e.target.value) || 0 })}
                min={0}
                max={100}
              />
            </div>
            <div>
              <Label>Policy Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddPolicy} disabled={saving}>
              {saving ? "Saving..." : "Add Policy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Policy Dialog */}
      <Dialog open={!!editingPolicy} onOpenChange={() => setEditingPolicy(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Grading Policy</DialogTitle>
          </DialogHeader>
          {editingPolicy && (
            <div className="space-y-4">
              <div>
                <Label>Assessment Type</Label>
                <Input
                  value={editingPolicy.assessment_type}
                  onChange={(e) => setEditingPolicy({ ...editingPolicy, assessment_type: e.target.value })}
                />
              </div>
              <div>
                <Label>Weightage (%)</Label>
                <Input
                  type="number"
                  value={editingPolicy.weightage}
                  onChange={(e) => setEditingPolicy({ ...editingPolicy, weightage: parseFloat(e.target.value) || 0 })}
                  min={0}
                  max={100}
                />
              </div>
              <div>
                <Label>Policy Name</Label>
                <Input
                  value={editingPolicy.name}
                  onChange={(e) => setEditingPolicy({ ...editingPolicy, name: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPolicy(null)}>Cancel</Button>
            <Button onClick={handleUpdatePolicy} disabled={saving}>
              {saving ? "Saving..." : "Update Policy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

