"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getErrorMessage, usersAPI } from "@/lib/api"
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  UserPlus,
  Users,
} from "lucide-react"
import { toast } from "sonner"

type Parent = {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  is_active_user: boolean
  children: Array<{ id: number; student_name: string; student_id: string | null; status: string }>
}

type Student = { user_id: number; first_name: string; last_name: string; student_id: string }
type Relationship = { id: number; parent: number; parent_name: string; student_name: string; status: string; relationship_type: string }

const initialForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: "",
  relationship_type: "guardian",
  student_ids: [] as number[],
}

const statusStyles: Record<string, string> = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  revoked: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
}

export default function ParentsManagementPage() {
  const [parents, setParents] = useState<Parent[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [form, setForm] = useState(initialForm)
  const [existingParentId, setExistingParentId] = useState("")
  const [existingStudentIds, setExistingStudentIds] = useState<number[]>([])
  const [existingRelationshipType, setExistingRelationshipType] = useState("guardian")
  const [linking, setLinking] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [parentResponse, studentResponse, relationshipResponse] = await Promise.all([
        usersAPI.parents(),
        usersAPI.students(),
        usersAPI.parentRelationships(),
      ])
      setParents(parentResponse.data.results ?? parentResponse.data)
      setStudents(studentResponse.data.results ?? studentResponse.data)
      setRelationships(relationshipResponse.data)
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to load parent records."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const filteredParents = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return parents
    return parents.filter((parent) =>
      `${parent.first_name} ${parent.last_name} ${parent.email} ${parent.phone}`.toLowerCase().includes(term),
    )
  }, [parents, search])

  const updateForm = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }))
  const toggleStudent = (id: number) => setForm((current) => ({
    ...current,
    student_ids: current.student_ids.includes(id)
      ? current.student_ids.filter((studentId) => studentId !== id)
      : [...current.student_ids, id],
  }))

  const createParent = async () => {
    if (!form.first_name || !form.last_name || !form.email || !form.password || !form.student_ids.length) {
      toast.error("Enter the parent details and select at least one child.")
      return
    }
    setSaving(true)
    try {
      await usersAPI.createParent(form)
      toast.success("Parent account and child relationships created.")
      setForm(initialForm)
      await load()
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to create the parent account."))
    } finally {
      setSaving(false)
    }
  }

  const updateRelationship = async (relationship: Relationship, status: string) => {
    try {
      await usersAPI.updateParentRelationshipStatus(relationship.parent, relationship.id, status)
      toast.success(`Relationship ${status}.`)
      await load()
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to update the relationship."))
    }

    const linkExistingParent = async () => {
      if (!existingParentId || !existingStudentIds.length) {
        toast.error("Select an existing parent and at least one student.")
        return
      }
      setLinking(true)
      try {
        await usersAPI.linkExistingParent({
          parent_id: Number(existingParentId),
          student_ids: existingStudentIds,
          relationship_type: existingRelationshipType,
        })
        toast.success("Student link added.")
        setExistingStudentIds([])
        await load()
      } catch (error) {
        toast.error(getErrorMessage(error, "Unable to link the student."))
      } finally {
        setLinking(false)
      }
    }

    const removeRelationship = async (relationship: Relationship) => {
      try {
        await usersAPI.removeParentRelationship(relationship.id)
        toast.success("Student link removed.")
        await load()
      } catch (error) {
        toast.error(getErrorMessage(error, "Unable to remove the student link."))
      }
    }
  }

  return (
    <div className="min-h-full bg-muted/20">
      <div className="mx-auto max-w-[1500px] space-y-8 p-4 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/dashboard/school-admin" className="transition-colors hover:text-foreground">School admin</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-foreground">Parents</span>
            </div>
            <div className="flex items-start gap-4">
              <div className="hidden rounded-2xl bg-primary/10 p-3 text-primary sm:block"><Users className="h-7 w-7" /></div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Parent directory</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">Manage parent accounts and securely connect families to enrolled students.</p>
              </div>
            </div>
          </div>
          <Button className="gap-2 shadow-sm" onClick={() => document.getElementById("create-parent")?.scrollIntoView({ behavior: "smooth" })}>
            <Plus className="h-4 w-4" /> Add parent
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total parents", value: parents.length, hint: "Accounts in your school", icon: Users, color: "text-primary bg-primary/10" },
            { label: "Active accounts", value: parents.filter((parent) => parent.is_active_user).length, hint: "Ready for portal access", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-500/10" },
            { label: "Pending links", value: relationships.filter((item) => item.status === "pending").length, hint: "Need your review", icon: ShieldAlert, color: "text-amber-600 bg-amber-500/10" },
            { label: "Approved links", value: relationships.filter((item) => item.status === "approved").length, hint: "Active family connections", icon: ClipboardList, color: "text-sky-600 bg-sky-500/10" },
          ].map((stat) => {
            const Icon = stat.icon
            return <Card key={stat.label} className="border-border/70 bg-card/90 shadow-sm"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm font-medium text-muted-foreground">{stat.label}</p><p className="mt-2 text-3xl font-bold tracking-tight">{stat.value}</p><p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p></div><div className={`rounded-2xl p-3 ${stat.color}`}><Icon className="h-5 w-5" /></div></CardContent></Card>
          })}
        </div>

        <div id="create-parent" className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden border-border/70 bg-card/95 shadow-sm">
            <CardHeader className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
              <div className="flex items-start gap-3"><div className="rounded-xl bg-primary/15 p-2.5 text-primary"><UserPlus className="h-5 w-5" /></div><div><CardTitle>Create parent account</CardTitle><CardDescription className="mt-1">Create login credentials and connect one or more children in a single step.</CardDescription></div></div>
            </CardHeader>
            <CardContent className="space-y-5 p-5 md:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">First name<Input placeholder="e.g. Ama" value={form.first_name} onChange={(event) => updateForm("first_name", event.target.value)} /></label>
                <label className="space-y-2 text-sm font-medium">Last name<Input placeholder="e.g. Mensah" value={form.last_name} onChange={(event) => updateForm("last_name", event.target.value)} /></label>
                <label className="space-y-2 text-sm font-medium sm:col-span-2">Email address<div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" type="email" placeholder="parent@example.com" value={form.email} onChange={(event) => updateForm("email", event.target.value)} /></div></label>
                <label className="space-y-2 text-sm font-medium">Phone number<div className="relative"><Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="020 000 0000" value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} /></div></label>
                <label className="space-y-2 text-sm font-medium">Temporary password<div className="relative"><KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" type="password" placeholder="Create a secure password" value={form.password} onChange={(event) => updateForm("password", event.target.value)} /></div></label>
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <label className="space-y-2 text-sm font-medium">Relationship to child<select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring" value={form.relationship_type} onChange={(event) => updateForm("relationship_type", event.target.value)}><option value="guardian">Guardian</option><option value="mother">Mother</option><option value="father">Father</option><option value="other">Other</option></select></label>
                <Button className="gap-2" onClick={() => void createParent()} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} {saving ? "Creating..." : "Create account"}</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Users className="h-5 w-5 text-primary" /> Link children</CardTitle><CardDescription>Select the students this parent can access.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground"><span className="font-semibold text-foreground">{form.student_ids.length}</span> student{form.student_ids.length === 1 ? "" : "s"} selected</div>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {students.length ? students.map((student) => {
                  const userId = student.user_id ?? (student as Student & { id?: number }).id
                  if (!userId) return null
                  const selected = form.student_ids.includes(userId)
                  return <label key={userId} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${selected ? "border-primary/50 bg-primary/5" : "border-border/70 hover:bg-muted/50"}`}><input className="h-4 w-4 accent-primary" type="checkbox" checked={selected} onChange={() => toggleStudent(userId)} /><span className="min-w-0"><span className="block truncate text-sm font-medium">{student.first_name} {student.last_name}</span><span className="text-xs text-muted-foreground">{student.student_id || "Student ID unavailable"}</span></span>{selected && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-primary" />}</label>
                }) : <div className="py-8 text-center text-sm text-muted-foreground">No enrolled students available.</div>}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="border-b bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent">
            <div className="flex items-start gap-3"><div className="rounded-xl bg-sky-500/15 p-2.5 text-sky-600"><Users className="h-5 w-5" /></div><div><CardTitle>Link an existing parent</CardTitle><CardDescription className="mt-1">Add another child to a parent account without creating a duplicate profile.</CardDescription></div></div>
          </CardHeader>
          <CardContent className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
            <label className="space-y-2 text-sm font-medium">Existing parent<select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring" value={existingParentId} onChange={(event) => setExistingParentId(event.target.value)}><option value="">Select a parent</option>{parents.map((parent) => <option key={parent.id} value={parent.id}>{parent.first_name} {parent.last_name} — {parent.email}</option>)}</select></label>
            <label className="space-y-2 text-sm font-medium">Relationship<select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring" value={existingRelationshipType} onChange={(event) => setExistingRelationshipType(event.target.value)}><option value="guardian">Guardian</option><option value="mother">Mother</option><option value="father">Father</option><option value="other">Other</option></select></label>
            <div className="md:col-span-2"><p className="mb-2 text-sm font-medium">Students to link</p><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{students.map((student) => { const userId = student.user_id ?? (student as Student & { id?: number }).id; if (!userId) return null; const selected = existingStudentIds.includes(userId); return <label key={userId} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${selected ? "border-sky-500/50 bg-sky-500/5" : "border-border/70 hover:bg-muted/50"}`}><input className="h-4 w-4 accent-sky-600" type="checkbox" checked={selected} onChange={() => setExistingStudentIds((current) => selected ? current.filter((id) => id !== userId) : [...current, userId])} /><span className="text-sm">{student.first_name} {student.last_name}<span className="ml-1 text-xs text-muted-foreground">({student.student_id})</span></span></label> })}</div></div>
            <Button className="w-fit gap-2" onClick={() => void linkExistingParent()} disabled={linking}>{linking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{linking ? "Linking..." : "Add student link"}</Button>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle>Parent accounts</CardTitle><CardDescription className="mt-1">View active accounts and their approved family connections.</CardDescription></div>
            <div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-10 pl-9" placeholder="Search by name, email, or phone" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading parent accounts...</div> : filteredParents.length ? <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-6 py-4 font-medium">Parent</th><th className="px-6 py-4 font-medium">Contact</th><th className="px-6 py-4 font-medium">Children</th><th className="px-6 py-4 font-medium">Account status</th></tr></thead><tbody>{filteredParents.map((parent) => <tr key={parent.id} className="border-t border-border/70 transition-colors hover:bg-muted/30"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{parent.first_name[0]}{parent.last_name[0]}</div><div><p className="font-semibold">{parent.first_name} {parent.last_name}</p><p className="text-xs text-muted-foreground">Parent account</p></div></div></td><td className="px-6 py-4"><p>{parent.email}</p><p className="mt-1 text-xs text-muted-foreground">{parent.phone || "No phone number"}</p></td><td className="px-6 py-4"><div className="flex flex-wrap gap-1.5">{parent.children.length ? parent.children.map((child) => <Badge key={child.id} variant="outline" className="font-normal">{child.student_name}</Badge>) : <span className="text-muted-foreground">No approved links</span>}</div></td><td className="px-6 py-4"><Badge variant="outline" className={parent.is_active_user ? statusStyles.approved : statusStyles.revoked}>{parent.is_active_user ? "Active" : "Suspended"}</Badge></td></tr>)}</tbody></table></div> : <div className="p-12 text-center"><Users className="mx-auto h-10 w-10 text-muted-foreground/40" /><p className="mt-3 font-medium">No parent accounts found</p><p className="mt-1 text-sm text-muted-foreground">{search ? "Try a different search term." : "Create the first parent account above."}</p></div>}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="border-b"><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />Relationship approvals</CardTitle><CardDescription>Review and approve access between parents and students.</CardDescription></CardHeader>
          <CardContent className="space-y-3 p-5">{relationships.length ? relationships.map((relationship) => <div key={relationship.id} className="flex flex-col gap-4 rounded-xl border border-border/70 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="rounded-xl bg-muted p-2.5"><Users className="h-4 w-4 text-muted-foreground" /></div><div><p className="font-medium">{relationship.parent_name} <span className="text-muted-foreground">→</span> {relationship.student_name}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{relationship.relationship_type} relationship</p></div></div><div className="flex items-center gap-3"><Badge variant="outline" className={`capitalize ${statusStyles[relationship.status] || ""}`}>{relationship.status}</Badge>{relationship.status !== "approved" && <Button size="sm" className="gap-1.5" onClick={() => void updateRelationship(relationship, "approved")}><CheckCircle2 className="h-3.5 w-3.5" />Approve</Button>}<Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => void removeRelationship(relationship)}>Remove link</Button></div></div>) : <p className="py-6 text-center text-sm text-muted-foreground">No parent-student relationships to review.</p>}</CardContent>
        </Card>
      </div>
    </div>
  )
}
