"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { assignmentAPI } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

interface AssignmentSubmissionModalProps {
  assignment: any
  isOpen: boolean
  onClose: () => void
}

export default function AssignmentSubmissionModal({ assignment, isOpen, onClose }: AssignmentSubmissionModalProps) {
  const [submissionType, setSubmissionType] = useState("file")
  const [file, setFile] = useState<File | null>(null)
  const [textSubmission, setTextSubmission] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
      setTextSubmission("")
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextSubmission(e.target.value)
    setFile(null)
  }

  const handleSubmit = async () => {
    if (!file && !textSubmission) {
      toast({
        title: "No submission provided",
        description: "Please either upload a file or enter text to submit.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("assignment", assignment.id)
      if (file) {
        formData.append("file", file)
      } else if (textSubmission) {
        formData.append("text_submission", textSubmission)
      }

      await assignmentAPI.submitAssignment(formData)
      toast({
        title: "Assignment submitted",
        description: "Your assignment has been submitted successfully.",
      })
      onClose()
    } catch (error) {
      console.error("Error submitting assignment:", error)
      toast({
        title: "Submission failed",
        description: "There was an error submitting your assignment.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Assignment: {assignment.title}</DialogTitle>
        </DialogHeader>
        <Tabs value={submissionType} onValueChange={setSubmissionType} className="w-full">
          <TabsList>
            <TabsTrigger value="file">File Upload</TabsTrigger>
            <TabsTrigger value="text">Text Submission</TabsTrigger>
          </TabsList>
          <TabsContent value="file">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="file" className="text-right">
                  File
                </Label>
                <Input id="file" type="file" className="col-span-3" onChange={handleFileChange} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="text">
            <div className="grid gap-4 py-4">
              <Textarea
                placeholder="Type your submission here."
                className="col-span-4"
                value={textSubmission}
                onChange={handleTextChange}
              />
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
