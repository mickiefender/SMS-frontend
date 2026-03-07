'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { usersAPI, academicsAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronLeft, Edit2, AlertCircle, BookOpen, Camera, Save, X, User, Phone, Mail, MapPin, Calendar, Briefcase, Award, MessageSquare, Download, FileText, Clock, Users, Trash2, Plus } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface TeacherDetail {
  id: number
  user_data?: { id: number; first_name: string; last_name: string; email: string; phone?: string; username: string }
  user?: { id: number; first_name: string; last_name: string; email: string; phone?: string; username: string }
  employee_id?: string
  qualification?: string
  experience_years?: number
  department?: { id: number; name: string } | null
  bio?: string
  gender?: string
  date_of_birth?: string
  address?: string
  specialization?: string
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value || 'N/A'}</p>
      </div>
    </div>
  )
}

function StatCard({ label, value, Icon, color }: { label: string; value: string | number; Icon: React.ElementType; color: string }) {
  return (
    <div className={`${color} rounded-lg p-5 text-white flex items-center gap-4 shadow-md`}>
      <Icon size={28} />
      <div>
        <p className="text-xs opacity-90">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  )
}

export default function TeacherDetailPage() {
  const params = useParams()
  const router = useRouter()
  const teacherId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [teacher, setTeacher] = useState<TeacherDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [classesLoading, setClassesLoading] = useState(true)
  const [subjectsLoading, setSubjectsLoading] = useState(true)
  const [allClasses, setAllClasses] = useState<any[]>([])
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [isFormTutor, setIsFormTutor] = useState(false)
  const [assigningClass, setAssigningClass] = useState(false)

  const [profilePic, setProfilePic] = useState('')
  const [profilePicId, setProfilePicId] = useState<number | null>(null)
  const [picPreview, setPicPreview] = useState('')
  const [picFile, setPicFile] = useState<File | null>(null)
  const [uploadingPic, setUploadingPic] = useState(false)
  const [picError, setPicError] = useState<string | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', gender: '',
    date_of_birth: '', address: '', employee_id: '',
    qualification: '', experience_years: '', bio: '', specialization: ''
  })

  useEffect(() => { loadData() }, [teacherId]) // eslint-disable-line

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await usersAPI.getTeacherById(parseInt(teacherId))
      const t: TeacherDetail = res.data
      setTeacher(t)
      const u = t.user_data || t.user
      setForm({
        first_name: u?.first_name || '', last_name: u?.last_name || '',
        phone: u?.phone || '', gender: t.gender || '',
        date_of_birth: t.date_of_birth || '', address: t.address || '',
        employee_id: t.employee_id || '', qualification: t.qualification || '',
        experience_years: String(t.experience_years || ''), bio: t.bio || '',
        specialization: t.specialization || ''
      })
      if (u?.id) {
        try {
          const picRes = await academicsAPI.profilePictureByUser(u.id)
          const pics = picRes.data.results || picRes.data || []
          if (pics.length > 0) { 
            // Get the best available URL - prefer display_url, fall back to storage_url, then picture
            setProfilePic(pics[0].display_url || pics[0].storage_url || pics[0].picture || ''); 
            setProfilePicId(pics[0].id) 
          }
        } catch { /* no pic */ }
      }
      
      // Get the teacher user ID and profile ID for filtering
      // The backend stores the User ID (not profile ID) in class_teachers and subject_teachers
      const userIdNum = u?.id || null
      const profileIdNum = t.id || null
      
      console.log("Loading classes/subjects for teacher - User ID:", userIdNum, "Profile ID:", profileIdNum, "Teacher ID from URL:", teacherId)
      
      try {
        setClassesLoading(true)
        const [classRes, classesRes] = await Promise.all([
          academicsAPI.classTeachers(),
          academicsAPI.classes()
        ])
        
        const all = classRes.data.results || classRes.data || []
        console.log("All class teachers:", all.slice(0, 3)) // Log first 3 for debugging
        
        // Filter by user ID or profile ID (the backend stores user ID)
        const teacherClasses = all.filter((c: any) => {
          const cTeacher = c.teacher
          const teacherIdValue = typeof cTeacher === 'object' ? cTeacher?.id : cTeacher
          return teacherIdValue === userIdNum || teacherIdValue === profileIdNum || teacherIdValue === parseInt(teacherId)
        })
        console.log("Filtered teacher classes:", teacherClasses)
        setClasses(teacherClasses)
        
        // Also store all available classes for assignment
        const allClassesData = classesRes.data.results || classesRes.data || []
        setAllClasses(allClassesData)
      } catch (err) { 
        console.error("Error loading classes:", err)
        /* skip */ 
      }
      finally { setClassesLoading(false) }
      try {
        setSubjectsLoading(true)
        const subRes = await academicsAPI.classSubjectTeachers()
        const all = subRes.data.results || subRes.data || []
        console.log("All subject teachers:", all.slice(0, 3)) // Log first 3 for debugging
        
        // Filter by user ID or profile ID (the backend stores user ID)
        const teacherSubjects = all.filter((s: any) => {
          const sTeacher = s.teacher
          const teacherIdValue = typeof sTeacher === 'object' ? sTeacher?.id : sTeacher
          return teacherIdValue === userIdNum || teacherIdValue === profileIdNum || teacherIdValue === parseInt(teacherId)
        })
        console.log("Filtered teacher subjects:", teacherSubjects)
        setSubjects(teacherSubjects)
      } catch (err) { 
        console.error("Error loading subjects:", err)
        /* skip */ 
      }
      finally { setSubjectsLoading(false) }
    } catch { setError('Failed to load teacher details') }
    finally { setLoading(false) }
  }

  const tName = () => { if (!teacher) return ''; const u = teacher.user_data || teacher.user; return `${u?.first_name || ''} ${u?.last_name || ''}`.trim() || u?.username || 'Unknown' }
  const tEmail = () => teacher?.user_data?.email || teacher?.user?.email || 'N/A'
  const tPhone = () => teacher?.user_data?.phone || teacher?.user?.phone || 'N/A'
  const tUserId = () => teacher?.user_data?.id || teacher?.user?.id || null
  const tProfileId = () => teacher?.id || null

  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setPicFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPicPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handlePicUpload = async () => {
    if (!picFile) return; const uid = tUserId(); if (!uid) return
    try {
      setUploadingPic(true); setPicError(null)
      if (profilePicId) await academicsAPI.deleteProfilePicture(profilePicId)
      const fd = new FormData(); fd.append('user', String(uid)); fd.append('picture', picFile)
      const res = await academicsAPI.createProfilePicture(fd)
      setProfilePic(res.data.picture); setProfilePicId(res.data.id)
      setPicPreview(''); setPicFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: any) { setPicError(err?.response?.data?.detail || 'Upload failed') }
    finally { setUploadingPic(false) }
  }

  const handleSave = async () => {
    if (!teacher) return
    try {
      setSaving(true); setError(null)
      await usersAPI.updateTeacher(teacher.id, { ...form, experience_years: parseInt(form.experience_years) || 0 })
      setIsEditing(false); loadData()
    } catch (err: any) { setError(err?.response?.data?.detail || 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleAssignClass = async () => {
    if (!selectedClassId || !teacher) return
    
    const teacherUserId = teacher.user_data?.id || teacher.user?.id || parseInt(teacherId)
    
    try {
      setAssigningClass(true)
      await academicsAPI.createClassTeacher({
        class_obj: parseInt(selectedClassId),
        teacher: teacherUserId,
        is_form_tutor: isFormTutor
      })
      setIsAssignDialogOpen(false)
      setSelectedClassId('')
      setIsFormTutor(false)
      // Reload classes
      loadData()
    } catch (err: any) {
      console.error("Error assigning class:", err)
      setError(err?.response?.data?.detail || 'Failed to assign class')
    } finally {
      setAssigningClass(false)
    }
  }

  const handleRemoveFromClass = async (classTeacherId: number) => {
    if (!confirm("Are you sure you want to remove this teacher from the class?")) return
    
    try {
      await academicsAPI.deleteClassTeacher(classTeacherId)
      // Reload classes
      loadData()
    } catch (err: any) {
      console.error("Error removing from class:", err)
      setError(err?.response?.data?.detail || 'Failed to remove from class')
    }
  }

  // Get assigned class IDs for filtering available classes
  const assignedClassIds = new Set(classes.map((c: any) => c.class_obj))
  const availableClassesForAssignment = allClasses.filter((c: any) => !assignedClassIds.has(c.id))

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-600">Loading...</p></div>
  if (error || !teacher) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-red-600 flex flex-col items-center gap-4">
        <AlertCircle size={48} /><p>{error || 'Teacher not found'}</p>
        <Button onClick={() => router.back()} variant="outline">Go Back</Button>
      </div>
    </div>
  )

  const teacherName = tName()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link href="/dashboard/school-admin" className="hover:text-gray-900">Home</Link>
        <span>/</span>
        <Link href="/dashboard/school-admin/teachers" className="hover:text-gray-900">Teachers</Link>
        <span>/</span>
        <span className="font-medium text-gray-900">{teacherName}</span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ChevronLeft size={20} /></Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{teacherName}</h1>
            <p className="text-gray-600">{tEmail()}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                <Save size={16} />{saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="gap-2"><X size={16} />Cancel</Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="gap-2 bg-transparent" onClick={() => setIsEditing(true)}><Edit2 size={18} />Edit Profile</Button>
              <Button variant="outline" className="gap-2 bg-transparent"><MessageSquare size={18} />Message</Button>
              <Button variant="outline" className="gap-2 bg-transparent"><Download size={18} />Report</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Classes Assigned" value={classes.length} Icon={BookOpen} color="bg-blue-500" />
        <StatCard label="Subjects" value={subjects.length} Icon={FileText} color="bg-purple-500" />
        <StatCard label="Experience" value={`${teacher.experience_years || 0} yrs`} Icon={Clock} color="bg-green-500" />
        <StatCard label="Employee ID" value={teacher.employee_id || 'N/A'} Icon={Award} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-5">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Camera size={16} className="text-purple-600" />Profile Picture
            </h2>
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-36 h-36 rounded-xl overflow-hidden bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-md">
                {picPreview ? (
                  <Image src={picPreview} alt="Preview" fill className="object-cover" />
                ) : profilePic ? (
                  <Image src={profilePic} alt={teacherName} fill className="object-cover" />
                ) : (
                  <span className="text-white font-bold text-5xl">{teacherName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              {picError && <p className="text-red-600 text-xs text-center">{picError}</p>}
              {picPreview ? (
                <div className="flex gap-2 w-full">
                  <Button onClick={handlePicUpload} disabled={uploadingPic} size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                    {uploadingPic ? 'Uploading...' : 'Save Photo'}
                  </Button>
                  <Button onClick={() => { setPicPreview(''); setPicFile(null) }} variant="outline" size="sm" className="flex-1">Cancel</Button>
                </div>
              ) : (
                <>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePicChange} className="hidden" id="teacher-pic-upload" />
                  <label htmlFor="teacher-pic-upload" className="flex items-center justify-center gap-2 w-full px-4 py-2 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 text-sm font-medium cursor-pointer hover:bg-purple-50 transition-colors">
                    <Camera size={16} />{profilePic ? 'Change Photo' : 'Upload Photo'}
                  </label>
                </>
              )}
            </div>
            <div className="mt-4 text-center">
              <p className="font-semibold text-gray-900">{teacherName}</p>
              <p className="text-xs text-gray-500 mt-0.5">ID: {teacher.employee_id || 'N/A'}</p>
              <p className="text-xs text-gray-500">{teacher.department?.name || 'No Department'}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={16} className="text-purple-600" />Personal Information
            </h2>
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs text-gray-500">First Name</Label><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="mt-1 h-8 text-sm" /></div>
                  <div><Label className="text-xs text-gray-500">Last Name</Label><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="mt-1 h-8 text-sm" /></div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Gender</Label>
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="mt-1 w-full border rounded px-2 py-1.5 text-sm">
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div><Label className="text-xs text-gray-500">Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="mt-1 h-8 text-sm" /></div>
                <div><Label className="text-xs text-gray-500">Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 h-8 text-sm" /></div>
                <div><Label className="text-xs text-gray-500">Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 h-8 text-sm" /></div>
              </div>
            ) : (
              <div className="space-y-1">
                <InfoRow icon={<User size={14} />} label="Gender" value={teacher.gender} />
                <InfoRow icon={<Calendar size={14} />} label="Date of Birth" value={teacher.date_of_birth} />
                <InfoRow icon={<Phone size={14} />} label="Phone" value={tPhone()} />
                <InfoRow icon={<Mail size={14} />} label="Email" value={tEmail()} />
                <InfoRow icon={<MapPin size={14} />} label="Address" value={teacher.address} />
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase size={16} className="text-purple-600" />Professional Information
            </h2>
            {isEditing ? (
              <div className="space-y-3">
                <div><Label className="text-xs text-gray-500">Employee ID</Label><Input value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} className="mt-1 h-8 text-sm" /></div>
                <div><Label className="text-xs text-gray-500">Qualification</Label><Input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} className="mt-1 h-8 text-sm" /></div>
                <div><Label className="text-xs text-gray-500">Experience (Years)</Label><Input type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} className="mt-1 h-8 text-sm" /></div>
                <div><Label className="text-xs text-gray-500">Specialization</Label><Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="mt-1 h-8 text-sm" /></div>
                <div>
                  <Label className="text-xs text-gray-500">Bio</Label>
                  <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="mt-1 w-full border rounded px-2 py-1.5 text-sm h-20 resize-none" placeholder="Brief bio..." />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <InfoRow icon={<Award size={14} />} label="Employee ID" value={teacher.employee_id} />
                <InfoRow icon={<Award size={14} />} label="Qualification" value={teacher.qualification} />
                <InfoRow icon={<Clock size={14} />} label="Experience" value={teacher.experience_years ? `${teacher.experience_years} years` : undefined} />
                <InfoRow icon={<Briefcase size={14} />} label="Department" value={teacher.department?.name} />
                <InfoRow icon={<FileText size={14} />} label="Specialization" value={teacher.specialization} />
                {teacher.bio && (
                  <div className="pt-2">
                    <p className="text-xs text-gray-500 mb-1">Bio</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{teacher.bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen size={16} className="text-purple-600" />Classes Assigned
              </h2>
              <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Plus size={14} /> Assign
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Teacher to Class</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                        <p className="text-sm">{error}</p>
                      </div>
                    )}
                    <div>
                      <Label>Select Class</Label>
                      <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a class" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableClassesForAssignment.length > 0 ? (
                            availableClassesForAssignment.map((cls: any) => (
                              <SelectItem key={cls.id} value={cls.id.toString()}>
                                {cls.name} {cls.section ? `- ${cls.section}` : ''}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-sm text-gray-500">No classes available</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="form_tutor"
                        checked={isFormTutor}
                        onCheckedChange={(checked) => setIsFormTutor(checked === true)}
                      />
                      <Label htmlFor="form_tutor">Assign as Form Tutor (Class Manager)</Label>
                    </div>
                    <Button 
                      onClick={handleAssignClass} 
                      disabled={!selectedClassId || assigningClass}
                      className="w-full"
                    >
                      {assigningClass ? 'Assigning...' : 'Assign to Class'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {classesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              </div>
            ) : classes.length > 0 ? (
              <div className="space-y-2">
                {classes.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div>
                      <p className="font-medium text-blue-800">{c.class_name || c.class_obj?.name || c.class?.name || `Class ${c.class}`}</p>
                      <p className="text-xs text-blue-600 mt-0.5">
                        {c.is_form_tutor ? (
                          <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Form Tutor</span>
                        ) : (
                          <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">Teacher</span>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFromClass(c.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No classes assigned yet. Click "Assign" to add this teacher to a class.</p>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-purple-600" />Subjects Teaching
            </h2>
            {subjectsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              </div>
            ) : subjects.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {subjects.map((s: any, i: number) => (
                  <div key={i} className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-center">
                    <p className="font-semibold text-purple-800 text-sm">{s.subject_name || s.subject?.name || s.subject || `Subject`}</p>
                    <p className="text-xs text-purple-600 mt-0.5">{s.class_name || s.class_obj?.name || s.class?.name || ''}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No subjects assigned yet.</p>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={16} className="text-purple-600" />Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Link href="/dashboard/school-admin/teacher-assignment">
                <div className="bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg p-4 text-center cursor-pointer transition-colors">
                  <BookOpen size={20} className="mx-auto text-blue-600 mb-2" />
                  <p className="text-sm font-medium text-blue-800">Assign Class</p>
                </div>
              </Link>
              <Link href="/dashboard/school-admin/messaging">
                <div className="bg-green-50 hover:bg-green-100 border border-green-100 rounded-lg p-4 text-center cursor-pointer transition-colors">
                  <MessageSquare size={20} className="mx-auto text-green-600 mb-2" />
                  <p className="text-sm font-medium text-green-800">Send Message</p>
                </div>
              </Link>
              <div className="bg-orange-50 hover:bg-orange-100 border border-orange-100 rounded-lg p-4 text-center cursor-pointer transition-colors">
                <Download size={20} className="mx-auto text-orange-600 mb-2" />
                <p className="text-sm font-medium text-orange-800">Download Report</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
