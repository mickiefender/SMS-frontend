'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { usersAPI, academicsAPI, attendanceAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronLeft, Edit2, AlertCircle, BookOpen, DollarSign, Flag, FileText, Camera, Save, X, User, Phone, Mail, MapPin, Calendar, Briefcase, Heart, Users, MessageSquare, Download } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface StudentDetail {
  id: number
  user_data?: { id: number; first_name: string; last_name: string; email: string; phone?: string; username: string }
  user?: { id: number; first_name: string; last_name: string; email: string; phone?: string; username: string }
  student_id?: string
  level?: { id: number; name: string; section?: string }
  enrollment_date?: string
  gender?: string
  father_name?: string
  mother_name?: string
  date_of_birth?: string
  religion?: string
  father_occupation?: string
  address?: string
  roll_number?: string
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

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [examResults, setExamResults] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any>(null)
  const [notices, setNotices] = useState<any[]>([])
  const [dueFees, setDueFees] = useState(0)
  const [upcomingExams, setUpcomingExams] = useState(0)
  const [eventsCount, setEventsCount] = useState(0)
  const [docsCount, setDocsCount] = useState(0)

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
    father_name: '', mother_name: '', date_of_birth: '',
    religion: '', father_occupation: '', address: '', roll_number: ''
  })

  useEffect(() => { loadData() }, [studentId]) // eslint-disable-line

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await usersAPI.getStudentById(parseInt(studentId))
      const s: StudentDetail = res.data
      setStudent(s)
      const u = s.user_data || s.user
      setForm({
        first_name: u?.first_name || '', last_name: u?.last_name || '',
        phone: u?.phone || '', gender: s.gender || '',
        father_name: s.father_name || '', mother_name: s.mother_name || '',
        date_of_birth: s.date_of_birth || '', religion: s.religion || '',
        father_occupation: s.father_occupation || '', address: s.address || '',
        roll_number: s.roll_number || ''
      })
      if (u?.id) {
        try {
          const picRes = await academicsAPI.profilePictureByUser(u.id)
          const pics = picRes.data.results || picRes.data || []
          if (pics.length > 0) { 
            // Get the best available URL - prefer display_url, fall back to picture
            setProfilePic(pics[0].display_url || pics[0].storage_url || pics[0].picture || ''); 
            setProfilePicId(pics[0].id) 
          }
        } catch { /* no pic */ }
      }
      try {
        const examRes = await academicsAPI.examResults()
        const all = examRes.data.results || examRes.data || []
        setExamResults(all.filter((r: any) => r.student?.id === parseInt(studentId) || r.student === parseInt(studentId)).slice(0, 6))
      } catch { /* skip */ }
      try { 
        const a = await attendanceAPI.studentReport(parseInt(studentId)); 
        console.log("Student attendance response:", a.data)
        setAttendance(a.data) 
      } catch (err: any) { 
        console.log("Attendance error:", err?.response?.data || err.message)
        /* skip */ 
      }
      try {
        const feesRes = await academicsAPI.schoolFees()
        const sf = (feesRes.data.results || feesRes.data || []).filter((f: any) => f.student?.id === parseInt(studentId) || f.student === parseInt(studentId))
        setDueFees(sf.filter((f: any) => f.status === 'pending' || f.status === 'partial').reduce((s: number, f: any) => s + (parseFloat(f.amount_due) || 0) - (parseFloat(f.amount_paid) || 0), 0))
      } catch { /* skip */ }
      try { const e = await academicsAPI.exams(); setUpcomingExams((e.data.results || e.data || []).filter((x: any) => new Date(x.exam_date) > new Date()).length) } catch { /* skip */ }
      try { const ev = await academicsAPI.events(); setEventsCount(ev.data.results?.length || 0) } catch { /* skip */ }
      try { const d = await academicsAPI.documents(); setDocsCount(d.data.results?.length || 0) } catch { /* skip */ }
      try { const n = await academicsAPI.notices(); setNotices((n.data.results || n.data || []).slice(0, 5)) } catch { /* skip */ }
    } catch { setError('Failed to load student details') }
    finally { setLoading(false) }
  }

  const name = () => { if (!student) return ''; const u = student.user_data || student.user; return `${u?.first_name || ''} ${u?.last_name || ''}`.trim() || u?.username || 'Unknown' }
  const email = () => student?.user_data?.email || student?.user?.email || 'N/A'
  const phone = () => student?.user_data?.phone || student?.user?.phone || 'N/A'
  const userId = () => student?.user_data?.id || student?.user?.id || null

  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setPicFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPicPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handlePicUpload = async () => {
    if (!picFile) return; const uid = userId(); if (!uid) return
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
    if (!student) return
    try {
      setSaving(true); setError(null)
      await usersAPI.updateStudent(student.id, form)
      setIsEditing(false); loadData()
    } catch (err: any) { setError(err?.response?.data?.detail || 'Failed to save') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-600">Loading...</p></div>
  if (error || !student) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-red-600 flex flex-col items-center gap-4">
        <AlertCircle size={48} /><p>{error || 'Student not found'}</p>
        <Button onClick={() => router.back()} variant="outline">Go Back</Button>
      </div>
    </div>
  )

  const studentName = name()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link href="/dashboard/school-admin" className="hover:text-gray-900">Home</Link>
        <span>/</span>
        <Link href="/dashboard/school-admin/students" className="hover:text-gray-900">Students</Link>
        <span>/</span>
        <span className="font-medium text-gray-900">{studentName}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ChevronLeft size={20} /></Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{studentName}</h1>
            <p className="text-gray-600">{email()}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                <Save size={16} />{saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="gap-2">
                <X size={16} />Cancel
              </Button>
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Upcoming Exams" value={upcomingExams} Icon={BookOpen} color="bg-green-500" />
        <StatCard label="Due Fees" value={`$${dueFees.toFixed(2)}`} Icon={DollarSign} color="bg-red-500" />
        <StatCard label="Events" value={eventsCount} Icon={Flag} color="bg-blue-500" />
        <StatCard label="Documents" value={docsCount} Icon={FileText} color="bg-yellow-500" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-5">

          {/* Profile Picture Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Camera size={16} className="text-purple-600" />Profile Picture
            </h2>
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-36 h-36 rounded-xl overflow-hidden bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-md">
                {picPreview ? (
                  <Image src={picPreview} alt="Preview" fill className="object-cover" />
                ) : profilePic ? (
                  <Image src={profilePic} alt={studentName} fill className="object-cover" />
                ) : (
                  <span className="text-white font-bold text-5xl">{studentName.charAt(0).toUpperCase()}</span>
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
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePicChange} className="hidden" id="pic-upload" />
                  <label htmlFor="pic-upload" className="flex items-center justify-center gap-2 w-full px-4 py-2 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 text-sm font-medium cursor-pointer hover:bg-purple-50 transition-colors">
                    <Camera size={16} />{profilePic ? 'Change Photo' : 'Upload Photo'}
                  </label>
                </>
              )}
            </div>
            <div className="mt-4 text-center">
              <p className="font-semibold text-gray-900">{studentName}</p>
              <p className="text-xs text-gray-500 mt-0.5">ID: {student.student_id || 'N/A'}</p>
              <p className="text-xs text-gray-500">{student.level?.name || 'No Class Assigned'}</p>
            </div>
          </div>

          {/* Personal Info */}
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
                <div><Label className="text-xs text-gray-500">Religion</Label><Input value={form.religion} onChange={(e) => setForm({ ...form, religion: e.target.value })} className="mt-1 h-8 text-sm" /></div>
                <div><Label className="text-xs text-gray-500">Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 h-8 text-sm" /></div>
                <div><Label className="text-xs text-gray-500">Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 h-8 text-sm" /></div>
              </div>
            ) : (
              <div className="space-y-1">
                <InfoRow icon={<User size={14} />} label="Gender" value={student.gender} />
                <InfoRow icon={<Calendar size={14} />} label="Date of Birth" value={student.date_of_birth} />
                <InfoRow icon={<Heart size={14} />} label="Religion" value={student.religion} />
                <InfoRow icon={<Phone size={14} />} label="Phone" value={phone()} />
                <InfoRow icon={<Mail size={14} />} label="Email" value={email()} />
                <InfoRow icon={<MapPin size={14} />} label="Address" value={student.address} />
              </div>
            )}
          </div>

          {/* Family Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={16} className="text-purple-600" />Family Information
            </h2>
            {isEditing ? (
              <div className="space-y-3">
                <div><Label className="text-xs text-gray-500">Father&apos;s Name</Label><Input value={form.father_name} onChange={(e) => setForm({ ...form, father_name: e.target.value })} className="mt-1 h-8 text-sm" /></div>
                <div><Label className="text-xs text-gray-500">Mother&apos;s Name</Label><Input value={form.mother_name} onChange={(e) => setForm({ ...form, mother_name: e.target.value })} className="mt-1 h-8 text-sm" /></div>
                <div><Label className="text-xs text-gray-500">Father&apos;s Occupation</Label><Input value={form.father_occupation} onChange={(e) => setForm({ ...form, father_occupation: e.target.value })} className="mt-1 h-8 text-sm" /></div>
              </div>
            ) : (
              <div className="space-y-1">
                <InfoRow icon={<Users size={14} />} label="Father's Name" value={student.father_name} />
                <InfoRow icon={<Users size={14} />} label="Mother's Name" value={student.mother_name} />
                <InfoRow icon={<Briefcase size={14} />} label="Father's Occupation" value={student.father_occupation} />
              </div>
            )}
          </div>

          {/* Academic Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen size={16} className="text-purple-600" />Academic Information
            </h2>
            {isEditing ? (
              <div><Label className="text-xs text-gray-500">Roll Number</Label><Input value={form.roll_number} onChange={(e) => setForm({ ...form, roll_number: e.target.value })} className="mt-1 h-8 text-sm" /></div>
            ) : (
              <div className="space-y-1">
                <InfoRow icon={<FileText size={14} />} label="Student ID" value={student.student_id} />
                <InfoRow icon={<BookOpen size={14} />} label="Class / Level" value={student.level?.name} />
                <InfoRow icon={<BookOpen size={14} />} label="Section" value={student.level?.section} />
                <InfoRow icon={<FileText size={14} />} label="Roll Number" value={student.roll_number} />
                <InfoRow icon={<Calendar size={14} />} label="Admission Date" value={student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : undefined} />
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Attendance */}
          {attendance && attendance.total_days > 0 ? (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <FileText size={16} className="text-purple-600" />Attendance Summary
                </h2>
                <div className="text-sm text-gray-500">
                  Last 30 days
                </div>
              </div>
              
              {/* Circular Progress */}
              <div className="flex justify-center mb-6">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="none"
                      strokeDasharray={351.86}
                      strokeDashoffset={351.86 - (351.86 * (attendance.presence_percentage || 0)) / 100}
                      className={`${(attendance.presence_percentage || 0) >= 75 ? 'text-green-500' : (attendance.presence_percentage || 0) >= 50 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-1000`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-bold ${(attendance.presence_percentage || 0) >= 75 ? 'text-green-600' : (attendance.presence_percentage || 0) >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {(attendance.presence_percentage || 0).toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500">Present</span>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-blue-700">{attendance.total_days || 0}</p>
                  <p className="text-xs text-blue-600">Total Days</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-green-700">{attendance.present_days || 0}</p>
                  <p className="text-xs text-green-600">Present</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-red-700">{attendance.absent_days || 0}</p>
                  <p className="text-xs text-red-600">Absent</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-yellow-700">{attendance.late_days || 0}</p>
                  <p className="text-xs text-yellow-600">Late</p>
                </div>
              </div>

              {/* Detailed Records Table */}
              {attendance.records && attendance.records.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Attendance Records</h3>
                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Date</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Subject</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Class</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Teacher</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {attendance.records.slice(0, 10).map((record: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2">{record.date}</td>
                            <td className="px-3 py-2">{record.subject_name || 'N/A'}</td>
                            <td className="px-3 py-2">{record.class_name || 'N/A'}</td>
                            <td className="px-3 py-2">{record.teacher_name || 'N/A'}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                ${record.status === 'present' ? 'bg-green-100 text-green-800' : 
                                  record.status === 'absent' ? 'bg-red-100 text-red-800' : 
                                  record.status === 'late' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-gray-100 text-gray-800'}`}>
                                {record.status?.charAt(0).toUpperCase() + record.status?.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <FileText size={16} className="text-purple-600" />Attendance Summary
              </h2>
              <p className="text-gray-500 text-sm mt-4">No attendance records found for this student.</p>
            </div>
          )}

          {/* Notice Board */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Notice Board</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {notices.length > 0 ? notices.map((n: any) => (
                <div key={n.id} className="pb-3 border-b last:border-0">
                  <p className="text-xs text-gray-400">{n.created_at}</p>
                  <p className="text-sm font-semibold text-blue-600">{n.author}</p>
                  <p className="text-sm text-gray-700 mt-1">{n.content}</p>
                </div>
              )) : <p className="text-gray-500 text-sm">No notices available.</p>}
            </div>
          </div>

          {/* Exam Results */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Exam Results</h2>
              <div className="flex gap-2">
                <input type="text" placeholder="Search by Exam..." className="px-3 py-1.5 border rounded-lg text-sm" />
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">Search</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Exam Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Subject</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Grade Point</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Percentage</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {examResults.length > 0 ? examResults.map((r: any) => (
                    <tr key={r.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{r.exam_name || r.exam?.name || 'N/A'}</td>
                      <td className="px-4 py-3">{r.subject_name || r.subject?.name || 'N/A'}</td>
                      <td className="px-4 py-3">{r.grade_point?.toFixed(2) || 'N/A'}</td>
                      <td className="px-4 py-3">{r.percentage || 'N/A'}</td>
                      <td className="px-4 py-3">{r.date || (r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A')}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No exam results found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
