"use client"

import React, { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useFetch, assignFee } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export function AssignFees() {
  const { toast } = useToast()
  const [assignTo, setAssignTo] = useState("school")
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedStudent, setSelectedStudent] = useState("")
  const [selectedFeeType, setSelectedFeeType] = useState("")

  const {
    data: feeTypes,
    loading: feeTypesLoading,
    error: feeTypesError,
  } = useFetch("/fees")
  const {
    data: classes,
    loading: classesLoading,
    error: classesError,
  } = useFetch("/classes")
  const {
    data: students,
    loading: studentsLoading,
    error: studentsError,
  } = useFetch("/students")

  const handleAssignFee = async () => {
    try {
      await assignFee({
        feeType: selectedFeeType,
        assignTo,
        classId: selectedClass,
        studentId: selectedStudent,
      })
      toast({
        title: "Fee assigned successfully",
      })
    } catch (error) {
      toast({
        title: "Failed to assign fee",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Fees</CardTitle>
        <CardDescription>
          Assign fees to the entire school, a specific class, or an individual
          student.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Assign Fee</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Assign Fee</DialogTitle>
              <DialogDescription>
                Select a fee and assign it to the school, a class, or a
                student.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fee-type" className="text-right">
                  Fee Type
                </Label>
                <Select
                  onValueChange={setSelectedFeeType}
                  value={selectedFeeType}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a fee type" />
                  </SelectTrigger>
                  <SelectContent>
                    {feeTypesLoading && <SelectItem value="loading">Loading...</SelectItem>}
                    {feeTypesError && <SelectItem value="error">Error loading fees</SelectItem>}
                    {feeTypes?.map((fee: any) => (
                      <SelectItem key={fee.id} value={fee.id}>
                        {fee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Assign To</Label>
                <RadioGroup
                  defaultValue="school"
                  className="col-span-3 flex"
                  onValueChange={setAssignTo}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="school" id="school" />
                    <Label htmlFor="school">School</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="class" id="class" />
                    <Label htmlFor="class">Class</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="student" id="student" />
                    <Label htmlFor="student">Student</Label>
                  </div>
                </RadioGroup>
              </div>
              {assignTo === "class" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="class-select" className="text-right">
                    Class
                  </Label>
                  <Select
                    onValueChange={setSelectedClass}
                    value={selectedClass}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classesLoading && <SelectItem value="loading">Loading...</SelectItem>}
                      {classesError && <SelectItem value="error">Error loading classes</SelectItem>}
                      {classes?.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {assignTo === "student" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="student-select" className="text-right">
                    Student
                  </Label>
                  <Select
                    onValueChange={setSelectedStudent}
                    value={selectedStudent}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {studentsLoading && <SelectItem value="loading">Loading...</SelectItem>}
                      {studentsError && <SelectItem value-="error">Error loading students</SelectItem>}
                      {students?.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAssignFee}>
                Assign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}