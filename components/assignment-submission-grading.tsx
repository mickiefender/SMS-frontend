"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { assignmentAPI } from "@/lib/api"

export function AssignmentSubmissionGrading() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    score: "",
    feedback: "",
  })

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true)
        const res = await assignmentAPI.submissions()
        const data = res.data.results || res.data || []
        setSubmissions(data.filter((s: any) => s.status === "submitted"))
      } catch (error) {
        console.error("[v0] Failed to fetch submissions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [])

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubmission || !formData.score) {
      alert("Please enter a score")
      return
    }

    try {
      // TODO: Call API to grade submission
      setFormData({ score: "", feedback: "" })
      setIsOpen(false)
      alert("Submission graded successfully")
    } catch (error) {
      console.error("[v0] Failed to grade submission:", error)
      alert("Failed to grade submission")
    }
  }

  if (loading) return <div className="text-center py-4">Loading submissions...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grade Submissions ({submissions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <p className="text-muted-foreground">No pending submissions</p>
        ) : (
          <div className="space-y-3">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => {
                  setSelectedSubmission(submission)
                  setIsOpen(true)
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{submission.student_name || `Student ${submission.student}`}</p>
                    <p className="text-sm text-muted-foreground">{submission.assignment_title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Submitted: {new Date(submission.submitted_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedSubmission(submission)
                      setIsOpen(true)
                    }}
                  >
                    Grade
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grade Submission</DialogTitle>
            </DialogHeader>
            {selectedSubmission && (
              <form onSubmit={handleGradeSubmission} className="space-y-4">
                <div>
                  <Label>Student: {selectedSubmission.student_name || `Student ${selectedSubmission.student}`}</Label>
                </div>
                <div>
                  <Label>Assignment: {selectedSubmission.assignment_title}</Label>
                </div>
                <div>
                  <Label htmlFor="score">Score</Label>
                  <Input
                    id="score"
                    type="number"
                    step="0.1"
                    max="100"
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                    placeholder="Enter score out of 100"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="feedback">Feedback</Label>
                  <textarea
                    id="feedback"
                    value={formData.feedback}
                    onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                    placeholder="Provide feedback to the student"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Submit Grade
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
