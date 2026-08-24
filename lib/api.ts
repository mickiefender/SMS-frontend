import axios from "axios"
import { loadingManager } from "./loading-manager"

export const authLoading = {
  hold: () => loadingManager.hold(),
  release: () => loadingManager.release(),
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/"

export const resolveImageUrl = (url?: string | null): string => {
  if (!url) return ""
  const trimmed = String(url).trim()
  if (!trimmed) return ""

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  const base = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL
  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`
  return `${base}${normalizedPath}`
}

/**
 * Extract a human-friendly, custom error message from an API error.
 *
 * Handles the common response shapes (DRF `detail`, field errors, string
 * bodies, network failures) and falls back to a caller-supplied default.
 */
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!error) return fallback

  const err = error as {
    response?: { data?: unknown; status?: number }
    message?: string
  }

  if (err.response?.data) {
    const raw = err.response.data

    // DRF detail / non-field errors
    if (typeof raw === "string" && raw.trim()) return raw

    const data = raw as Record<string, unknown>

    if (typeof data.detail === "string" && data.detail.trim()) return data.detail
    if (typeof data.error === "string" && data.error.trim()) return data.error
    if (typeof data.message === "string" && data.message.trim()) return data.message

    // non_field_errors can be a string or an array of strings
    const nfe = data.non_field_errors
    if (typeof nfe === "string" && nfe.trim()) return nfe
    if (Array.isArray(nfe) && typeof nfe[0] === "string" && nfe[0].trim()) return nfe[0]

    // Field-level errors: pick the first non-empty message
    const entries = Object.entries(data) as Array<[string, unknown]>
    const fieldError = entries.find(
      ([, value]) =>
        (typeof value === "string" && value.trim().length > 0) ||
        (Array.isArray(value) && typeof value[0] === "string" && value[0].trim().length > 0),
    )
    if (fieldError) {
      const [field, value] = fieldError
      const message = Array.isArray(value) ? String(value[0]) : String(value)
      return `${field}: ${message}`
    }
  }

  if (err.message?.trim()) return err.message

  return fallback
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

/**
 * Background fetch — GET that does NOT block the global page loader.
 * Use for secondary/child-component fetches (profile pictures, charts, etc.)
 * that should load in the background after the main page data is ready.
 */
export const bgFetch = {
  get: <T = any>(url: string, config?: any) =>
    apiClient.get<T>(url, { ...config, _trackLoading: false }),
}

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined" && process.env.NODE_ENV === 'development') {
    console.log('[API Request]', config.method?.toUpperCase(), config.url)
  }
  if (typeof window !== "undefined") {
    const token = sessionStorage.getItem("authToken")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  // Track data (GET) requests so the global loader stays until data is ready.
  // Mutations (POST/PUT/PATCH/DELETE) keep their own inline spinners and are not tracked.
  // Components can pass { _trackLoading: false } in request config to skip global tracking
  // (useful for background/secondary fetches that shouldn't block the page loader).
  if (typeof window !== "undefined" && config.method === "get" && (config as any)._trackLoading !== false) {
    loadingManager.beginRequest()
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => {
    // Every tracked request must be released exactly once, success or failure.
    if (typeof window !== "undefined" && response.config.method === "get" && (response.config as any)._trackLoading !== false) {
      loadingManager.endRequest()
    }
    return response
  },
  (error) => {
    if (typeof window !== "undefined" && error.config?.method === "get" && (error.config as any)._trackLoading !== false) {
      loadingManager.endRequest()
    }
    const status = error.response?.status
    const url = error.config?.url
    const details = error.response?.data
    
    if (status === 401) {
      console.error('[API 401] Auth failed:', { url, details })
      // Let auth-context handle cleanup and redirect to avoid double-handling
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('authError'))
      }
      const currentPath = typeof window !== "undefined" ? window.location.pathname : ""
      if (!currentPath.startsWith("/auth/") && !currentPath.startsWith("/dashboard/")) {
        console.warn('[API] Clearing invalid token, redirecting to login')
        sessionStorage.removeItem("authToken")
        sessionStorage.removeItem("user")
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login"
        }
      }
    } else if (status >= 500) {
      console.error('[API Error]', { status, url, details })
    }
    
    return Promise.reject(error)
  },
)

export const authAPI = {
  login: (credentials: { email?: string; student_id?: string; password: string }) => apiClient.post("/users/auth/login/", credentials),
  register: (data: any) => apiClient.post("/users/auth/register/", data),
  logout: () => {
    sessionStorage.removeItem("authToken")
    sessionStorage.removeItem("user")
  },
  me: () => apiClient.get("/users/me/"),
}

export const schoolsAPI = {
  list: () => apiClient.get("/schools/schools/"),
  create: (data: any) => apiClient.post("/schools/schools/", data),
  update: (id: number, data: any) => apiClient.put(`/schools/schools/${id}/`, data),
  suspend: (id: number) => apiClient.post(`/schools/schools/${id}/suspend/`),
  activate: (id: number) => apiClient.post(`/schools/schools/${id}/activate/`),
  uploadLogo: (formData: FormData) => 
    apiClient.post("/schools/schools/upload_logo/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getDashboardStats: () => apiClient.get("/schools/schools/dashboard_stats/"),
  invalidateCache: () => apiClient.post("/schools/schools/invalidate_cache/"),
}

export const academicsAPI = {
  get: (endpoint: string, params?: any) => apiClient.get(`/academics${endpoint}`, { params }),
  post: (endpoint: string, data: any, config?: any) => apiClient.post(`/academics${endpoint}`, data, config),
  put: (endpoint: string, data: any, config?: any) => apiClient.put(`/academics${endpoint}`, data, config),
  delete: (endpoint: string) => apiClient.delete(`/academics${endpoint}`),

  faculties: () => apiClient.get("/academics/faculties/"),
  departments: () => apiClient.get("/academics/departments/"),
  classes: () => apiClient.get("/academics/classes/"),
  subjects: () => apiClient.get("/academics/subjects/"),
  enrollments: () => apiClient.get("/academics/enrollments/"),
  timetables: () => apiClient.get("/academics/timetables/"),
  createTimetable: (data: any) => apiClient.post("/academics/timetables/", data),
  updateTimetable: (id: number, data: any) => apiClient.put(`/academics/timetables/${id}/`, data),
  deleteTimetable: (id: number) => apiClient.delete(`/academics/timetables/${id}/`),
  
  classTeachers: () => apiClient.get("/academics/class-teachers/"),
  createClassTeacher: (data: any) => apiClient.post("/academics/class-teachers/", data),
  updateClassTeacher: (id: number, data: any) => apiClient.put(`/academics/class-teachers/${id}/`, data),
  deleteClassTeacher: (id: number) => apiClient.delete(`/academics/class-teachers/${id}/`),
  
  studentClasses: () => apiClient.get("/academics/student-classes/"),
  createStudentClass: (data: any) => apiClient.post("/academics/student-classes/", data),
  updateStudentClass: (id: number, data: any) => apiClient.put(`/academics/student-classes/${id}/`, data),
  deleteStudentClass: (id: number) => apiClient.delete(`/academics/student-classes/${id}/`),
  
  classSubjectTeachers: () => apiClient.get("/academics/class-subject-teachers/"),
  createClassSubjectTeacher: (data: any) => apiClient.post("/academics/class-subject-teachers/", data),
  updateClassSubjectTeacher: (id: number, data: any) => apiClient.put(`/academics/class-subject-teachers/${id}/`, data),
  deleteClassSubjectTeacher: (id: number) => apiClient.delete(`/academics/class-subject-teachers/${id}/`),
  
  classSubjects: () => apiClient.get("/academics/class-subjects/"),
  getTeacherClassSubjects: (classId: number) => apiClient.get(`/academics/classes/my_class_subjects/?class_obj=${classId}`),
  createClassSubject: (data: any) => apiClient.post("/academics/class-subjects/", data),

  updateClassSubject: (id: number, data: any) => apiClient.put(`/academics/class-subjects/${id}/`, data),
  deleteClassSubject: (id: number) => apiClient.delete(`/academics/class-subjects/${id}/`),
  createSubject: (data: any) => apiClient.post("/academics/subjects/", data),
  createFaculty: (data: any) => apiClient.post("/academics/faculties/", data),
  createDepartment: (data: any) => apiClient.post("/academics/departments/", data),
  createClass: (data: any) => apiClient.post("/academics/classes/", data),
  createEnrollment: (data: any) => apiClient.post("/academics/enrollments/", data),
  updateEnrollment: (id: number, data: any) => apiClient.put(`/academics/enrollments/${id}/`, data),
  deleteEnrollment: (id: number) => apiClient.delete(`/academics/enrollments/${id}/`),
  updateClass: (id: number, data: any) => apiClient.put(`/academics/classes/${id}/`, data),
  updateSubject: (id: number, data: any) => apiClient.put(`/academics/subjects/${id}/`, data),
  updateFaculty: (id: number, data: any) => apiClient.put(`/academics/faculties/${id}/`, data),
  updateDepartment: (id: number, data: any) => apiClient.put(`/academics/departments/${id}/`, data),
  deleteClass: (id: number) => apiClient.delete(`/academics/classes/${id}/`),
  deleteSubject: (id: number) => apiClient.delete(`/academics/subjects/${id}/`),
  classPerformance: () => apiClient.get("/academics/classes/performance-detail/"),
  classPerformanceWithAttendance: () => apiClient.get("/academics/classes/performance/"),
  calendarEvents: () => apiClient.get("/academics/calendar-events/"),
  createCalendarEvent: (data: any) => apiClient.post("/academics/calendar-events/", data),
  updateCalendarEvent: (id: number, data: any) => apiClient.put(`/academics/calendar-events/${id}/`, data),
  deleteCalendarEvent: (id: number) => apiClient.delete(`/academics/calendar-events/${id}/`),
  levels: () => apiClient.get("/academics/levels/"),
  createLevel: (data: any) => apiClient.post("/academics/levels/", data),
  updateLevel: (id: number, data: any) => apiClient.put(`/academics/levels/${id}/`, data),
  deleteLevel: (id: number) => apiClient.delete(`/academics/levels/${id}/`),
  exams: () => apiClient.get("/academics/exams/"),
  createExam: (data: any) => apiClient.post("/academics/exams/", data),
  updateExam: (id: number, data: any) => apiClient.put(`/academics/exams/${id}/`, data),
  deleteExam: (id: number) => apiClient.delete(`/academics/exams/${id}/`),
  examResults: (params?: any) => apiClient.get("/academics/exam-results/", { params }),
  createExamResult: (data: any) => apiClient.post("/academics/exam-results/", data),
  updateExamResult: (id: number, data: any) => apiClient.put(`/academics/exam-results/${id}/`, data),
  deleteExamResult: (id: number) => apiClient.delete(`/academics/exam-results/${id}/`),
  schoolFees: () => apiClient.get("/academics/school-fees/"),
  createSchoolFee: (data: any) => apiClient.post("/academics/school-fees/", data),
  updateSchoolFee: (id: number, data: any) => apiClient.put(`/academics/school-fees/${id}/`, data),
  deleteSchoolFee: (id: number) => apiClient.delete(`/academics/school-fees/${id}/`),
  events: () => apiClient.get("/academics/events/"),
  createEvent: (data: any) => apiClient.post("/academics/events/", data),
  updateEvent: (id: number, data: any) => apiClient.put(`/academics/events/${id}/`, data),
  deleteEvent: (id: number) => apiClient.delete(`/academics/events/${id}/`),
  documentFolders: (params?: any) => apiClient.get("/academics/document-folders/", { params }),
  createDocumentFolder: (data: any) => apiClient.post("/academics/document-folders/", data),
  updateDocumentFolder: (id: number, data: any) => apiClient.put(`/academics/document-folders/${id}/`, data),
  deleteDocumentFolder: (id: number) => apiClient.delete(`/academics/document-folders/${id}/`),
  getFolderChildren: (id: number) => apiClient.get(`/academics/document-folders/${id}/children/`),
  getFolderBreadcrumb: (id: number) => apiClient.get(`/academics/document-folders/${id}/breadcrumb/`),
  documents: (params?: any) => apiClient.get("/academics/documents/", { params }),
  uploadDocument: (data: FormData) => apiClient.post("/academics/documents/", data, { headers: { "Content-Type": "multipart/form-data" } }),
  updateDocument: (id: number, data: FormData) => apiClient.put(`/academics/documents/${id}/`, data, { headers: { "Content-Type": "multipart/form-data" } }),
  deleteDocument: (id: number) => apiClient.delete(`/academics/documents/${id}/`),
  moveDocumentToFolder: (id: number, folderId: number | null) => apiClient.patch(`/academics/documents/${id}/move_to_folder/`, { folder_id: folderId }),
  shareDocumentWithClasses: (id: number, classIds: number[]) => apiClient.post(`/academics/documents/${id}/share_with_classes/`, { class_ids: classIds }),
  getDocumentSharedClasses: (id: number) => apiClient.get(`/academics/documents/${id}/shared_classes/`),
  searchDocuments: (query: string) => apiClient.get(`/academics/documents/search/?q=${query}`),
  bulkDeleteDocuments: (documentIds: number[]) => apiClient.post("/academics/documents/bulk_delete/", { document_ids: documentIds }),
  generateQuestionsFromDocument: (docId: number, settings: any) => apiClient.post(`/academics/documents/${docId}/generate_questions/`, settings),
  generateSummaryFromDocument: (docId: number, settings: any) => apiClient.post(`/academics/documents/${docId}/generate_summary/`, settings),
  generateQuestionsFromTopic: (payload: any) => apiClient.post("/academics/documents/generate_questions_from_topic/", payload),
  notices: () => apiClient.get("/academics/notices/"),
  createNotice: (data: any) => apiClient.post("/academics/notices/", data),
  updateNotice: (id: number, data: any) => apiClient.put(`/academics/notices/${id}/`, data),
  deleteNotice: (id: number) => apiClient.delete(`/academics/notices/${id}/`),
  profilePictures: () => apiClient.get("/academics/profile-pictures/"),
  profilePictureByUser: (userId: number) => apiClient.get(`/academics/profile-pictures/?user=${userId}`),
  createProfilePicture: (data: FormData) => apiClient.post("/academics/profile-pictures/", data, { headers: { "Content-Type": "multipart/form-data" } }),
  updateProfilePicture: (id: number, data: FormData) => apiClient.put(`/academics/profile-pictures/${id}/`, data, { headers: { "Content-Type": "multipart/form-data" } }),
  deleteProfilePicture: (id: number) => apiClient.delete(`/academics/profile-pictures/${id}/`),
  academicSessions: () => apiClient.get("/academics/academic-sessions/"),
  academicSessionsCurrent: () => apiClient.get("/academics/academic-sessions/current/"),
  createAcademicSession: (data: any) => apiClient.post("/academics/academic-sessions/", data),
  updateAcademicSession: (id: number, data: any) => apiClient.put(`/academics/academic-sessions/${id}/`, data),
  deleteAcademicSession: (id: number) => apiClient.delete(`/academics/academic-sessions/${id}/`),
  gradingPolicies: (params?: any) => apiClient.get("/academics/grading-policies/", { params }),
  gradingPoliciesBySession: (sessionId: number) => apiClient.get(`/academics/grading-policies/by_session/?session_id=${sessionId}`),
  createGradingPolicy: (data: any) => apiClient.post("/academics/grading-policies/", data),
  updateGradingPolicy: (id: number, data: any) => apiClient.put(`/academics/grading-policies/${id}/`, data),
  deleteGradingPolicy: (id: number) => apiClient.delete(`/academics/grading-policies/${id}/`),
  bulkCreateGradingPolicies: (data: any) => apiClient.post("/academics/grading-policies/bulk_create/", data),
  terminalReportTemplates: () => apiClient.get("/academics/terminal-report-templates/"),
  templatePreview: (templateId: number, data: any) => apiClient.post(`/academics/terminal-report-templates/${templateId}/preview_render/`, data),
  templatePdf: (templateId: number, data: any) => apiClient.post(`/academics/terminal-report-templates/${templateId}/generate_pdf/`, data, { responseType: 'blob' }),
  createTerminalReportTemplate: (data: any) => apiClient.post("/academics/terminal-report-templates/", data),
  updateTerminalReportTemplate: (id: number, data: any) => apiClient.put(`/academics/terminal-report-templates/${id}/`, data),
  deleteTerminalReportTemplate: (id: number) => apiClient.delete(`/academics/terminal-report-templates/${id}/`),
  setTemplateDefault: (id: number) => apiClient.post(`/academics/terminal-report-templates/${id}/set_default/`),
  terminalReports: (params?: any) => apiClient.get("/academics/terminal-reports/", { params }),
  terminalReportDetail: (id: number) => apiClient.get(`/academics/terminal-reports/${id}/`),
  generateTerminalReport: (data: any) => apiClient.post("/academics/terminal-reports/generate_report/", data),
  calculatePositions: (data: any) => apiClient.post("/academics/terminal-reports/calculate_positions/", data),
  // Rich per-class payload: every student's terminal report with subject scores,
  // positions, attendance, plus the active grading system and assessments.
  classReports: (params?: any) => apiClient.get("/academics/terminal-reports/class_reports/", { params }),
  // Generate/regenerate terminal reports for ALL students in a class at once.
  computeClassReports: (data: any) => apiClient.post("/academics/terminal-reports/compute_class_reports/", data),
  publishTerminalReport: (id: number) => apiClient.post(`/academics/terminal-reports/${id}/publish/`),
  addTerminalReportRemarks: (id: number, data: any) => apiClient.post(`/academics/terminal-reports/${id}/add_remarks/`, data),
}

export const promotionAPI = {
  // Academic years
  academicYears: (params?: any) => apiClient.get("/academics/academic-years/", { params }),
  createAcademicYear: (data: any) => apiClient.post("/academics/academic-years/", data),
  updateAcademicYear: (id: number, data: any) => apiClient.put(`/academics/academic-years/${id}/`, data),
  deleteAcademicYear: (id: number) => apiClient.delete(`/academics/academic-years/${id}/`),

  // Configurable promotion rules (FROM class -> TO class; null TO = graduate)
  promotionRules: () => apiClient.get("/academics/promotion-rules/"),
  createPromotionRule: (data: any) => apiClient.post("/academics/promotion-rules/", data),
  updatePromotionRule: (id: number, data: any) => apiClient.put(`/academics/promotion-rules/${id}/`, data),
  deletePromotionRule: (id: number) => apiClient.delete(`/academics/promotion-rules/${id}/`),

  // Per-school promotion policy (promote_all / average_threshold / grading_scale / manual_review)
  promotionPolicy: () => apiClient.get("/academics/promotion-policy/"),
  savePromotionPolicy: (data: any) => apiClient.post("/academics/promotion-policy/", data),
  updatePromotionPolicy: (id: number, data: any) => apiClient.put(`/academics/promotion-policy/${id}/`, data),

  // Preview (read-only, never mutates enrollments)
  previewPromotion: (data: { source_academic_year: number; destination_academic_year: number; class_ids?: number[] }) =>
    apiClient.post("/academics/promotion/preview/", data),

  // Bulk promotion — ONE request for the whole school (atomic, idempotent)
  bulkPromotion: (data: { source_academic_year: number; destination_academic_year: number; decisions?: any[] }) =>
    apiClient.post("/academics/promotion/bulk/", data),

  // Individual student promotion
  promoteStudent: (studentId: number, data: any) =>
    apiClient.post(`/academics/students/${studentId}/promote/`, data),

  // Promotion history
  promotionHistory: (params?: any) => apiClient.get("/academics/promotion-batches/", { params }),
  promotionBatchDetail: (id: number, params?: any) =>
    apiClient.get(`/academics/promotion-batches/${id}/`, { params }),

  // Student academic history (permanent, per-year enrollment timeline)
  academicHistory: (studentId: number) =>
    apiClient.get(`/academics/students/${studentId}/academic-history/`),
}

export const announcementsAPI = {
  list: () => apiClient.get("/schools/announcements/"),
  create: (data: any) => apiClient.post("/schools/announcements/", data),
  update: (id: number, data: any) => apiClient.put(`/schools/announcements/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/schools/announcements/${id}/`),
}

export const newsAPI = {
  list: (params?: any) => apiClient.get("/schools/news/", { params }),
  get: (id: number) => apiClient.get(`/schools/news/${id}/`),
  create: (data: any) => apiClient.post("/schools/news/", data),
  update: (id: number, data: any) => apiClient.put(`/schools/news/${id}/`, data),
  patch: (id: number, data: any) => apiClient.patch(`/schools/news/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/schools/news/${id}/`),
  banners: () => apiClient.get("/schools/news/banners/"),
  uploadBanner: (id: number, formData: FormData) =>
    apiClient.post(`/schools/news/${id}/upload-banner/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
}

export const attendanceAPI = {
  list: () => apiClient.get("/attendance/"),
  create: (data: any) => apiClient.post("/attendance/", data),
  bulkCreate: (data: any) => apiClient.post("/attendance/bulk_mark/", data),
  studentReport: (studentId: number) => apiClient.get(`/attendance/student_report/?student_id=${studentId}`),
  studentReportByDateRange: (studentId: number, startDate: string, endDate: string) => apiClient.get(`/attendance/student_report/?student_id=${studentId}&start_date=${startDate}&end_date=${endDate}`),
  classAttendance: (classId: number, date: string) => apiClient.get(`/attendance/?class_obj=${classId}&date=${date}`),
  classReport: (classId?: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (classId) params.append('class_id', classId.toString())
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    return apiClient.get(`/attendance/class_report/?${params.toString()}`)
  },
  overallReport: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    return apiClient.get(`/attendance/overall_report/?${params.toString()}`)
  },
  subjectReport: (classId?: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (classId) params.append('class_id', classId.toString())
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    return apiClient.get(`/attendance/subject_report/?${params.toString()}`)
  },
  myStudentsSummary: (classId?: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (classId) params.append('class_id', classId.toString())
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    return apiClient.get(`/attendance/my_students_summary/?${params.toString()}`)
  },
  exportMyStudentsSummaryExcel: (classId?: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (classId) params.append('class_id', classId.toString())
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    return apiClient.get(`/attendance/export_my_students_summary/?${params.toString()}`, { 
      responseType: 'blob' 
    })
  },
}

export const gradesAPI = {
  list: (params?: any) => apiClient.get("/students/grades/", { params }),
  create: (data: any) => apiClient.post("/students/grades/", data),
  update: (id: number, data: any) => apiClient.put(`/students/grades/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/students/grades/${id}/`),
  lock: (id: number) => apiClient.post(`/students/grades/${id}/lock/`),
  unlock: (id: number) => apiClient.post(`/students/grades/${id}/unlock/`),
  lock_by_class: (data: any) => apiClient.post("/students/grades/lock_by_class/", data),
  unlock_by_class: (data: any) => apiClient.post("/students/grades/unlock_by_class/", data),
  gradeEntryData: (classId: number) => apiClient.get(`/students/grades/grade_entry_data/?class_id=${classId}`),
  validateGradeAccess: (data: any) => apiClient.post("/students/grades/validate-grade-access/", data),
}

/**
 * Fetch EVERY row of the paginated grades endpoint by walking all pages.
 *
 * DRF paginates list responses (PAGE_SIZE=20) and returns `count`, `next`,
 * `previous`, `results`. Callers that only read `results` see a truncated
 * slice of the data — e.g. a student's detail page showing only the 3 grades
 * that happened to land on page 1. This helper requests the largest allowed
 * page (500 rows) and follows `next` until every grade is collected.
 *
 * Usage: const grades = await fetchAllGrades({ student: 12 })
 */
export async function fetchAllGrades<T = any>(
  params: Record<string, any> = {},
  pageSize = 500,
): Promise<T[]> {
  const all: T[] = []
  let page = 1
  for (;;) {
    const res = await gradesAPI.list({ ...params, page_size: pageSize, page })
    const data = res.data
    // Unpaginated response (plain array) — nothing more to walk.
    if (Array.isArray(data)) {
      all.push(...(data as T[]))
      break
    }
    const body = data as { results?: T[]; next?: string | null } | null
    const results = body?.results || []
    all.push(...results)
    if (!body || !body.next) break
    page += 1
  }
  return all
}

export const messagingAPI = {
  messages: () => apiClient.get("/messaging/messages/"),
  sentMessages: () => apiClient.get("/messaging/messages/sent/"),
  createMessage: (data: any) => apiClient.post("/messaging/messages/", data),
  markMessageAsRead: (id: number) => apiClient.post(`/messaging/messages/${id}/mark_as_read/`),
  announcements: () => apiClient.get("/messaging/announcements/"),
  getAnnouncement: (id: number) => apiClient.get(`/messaging/announcements/${id}/`),
  createAnnouncement: (data: any) => apiClient.post("/messaging/announcements/", data),
  updateAnnouncement: (id: number, data: any) => apiClient.post(`/messaging/announcements/${id}/publish/`),
  deleteAnnouncement: (id: number) => apiClient.delete(`/messaging/announcements/${id}/`),
  markAnnouncementAsRead: (id: number) => apiClient.post(`/messaging/announcements/${id}/mark_as_read/`),
  getAnnouncementReadBy: (id: number) => apiClient.get(`/messaging/announcements/${id}/read_by/`),
  notices: () => apiClient.get("/messaging/notices/"),
  getNotice: (id: number) => apiClient.get(`/messaging/notices/${id}/`),
  createNotice: (data: any) => apiClient.post("/messaging/notices/", data),
  updateNotice: (id: number, data: any) => apiClient.put(`/messaging/notices/${id}/`, data),
  deleteNotice: (id: number) => apiClient.delete(`/messaging/notices/${id}/`),
  pinNotice: (id: number) => apiClient.post(`/messaging/notices/${id}/pin/`),  
  sendPersonalNotice: (studentId: number, data: { title: string; content: string }) => apiClient.post("/messaging/notices/send_personal_notice/", { student_id: studentId, ...data }),  
  personalNotices: () => apiClient.get("/messaging/notices/my_personal_notices/"),  
  // Directory of students + teachers in the school, for the recipient picker
  recipientsDirectory: (params?: { role?: "student" | "teacher"; search?: string }) =>
    apiClient.get("/messaging/notices/recipients/", { params }),
}

export const usersAPI = {
  list: () => apiClient.get("/users/users/"),
  listGlobal: (params?: any) => apiClient.get("/users/users/", { params }),
  banUser: (id: number) => apiClient.post(`/users/users/${id}/ban_user/`),
  suspendUser: (id: number) => apiClient.post(`/users/users/${id}/suspend_user/`),
  resetPassword: (id: number, new_password: string) => apiClient.post(`/users/users/${id}/reset_password/`, { new_password }),
  assignGlobalRole: (id: number, role: string) => apiClient.post(`/users/users/${id}/assign_global_role/`, { role }),
  globalStats: () => apiClient.get("/users/users/global_stats/"),
  getById: (id: number) => apiClient.get(`/users/users/${id}/`),
  teachers: () => apiClient.get("/users/teachers/"),
  getTeacherById: (id: number) => apiClient.get(`/users/teachers/${id}/`),
  students: (params?: any) => apiClient.get("/users/students/", { params }),
  getStudentById: (id: number) => apiClient.get(`/users/students/${id}/`),
  myStudents: () => apiClient.get("/users/students/my_students/"),
  teacherClasses: () => apiClient.get("/users/students/my_classes/"),
  create: (data: any) => apiClient.post("/users/users/", data),
  createTeacher: async (data: any) => {
    try {
      const userData = {
        username: data.username,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        password: data.password,
        password2: data.password,
        role: "teacher",
        phone: data.phone || "",
        school: data.school_id,
      }
      console.log("[v0] Creating teacher user with data:", JSON.stringify(userData, null, 2))
      const userResponse = await apiClient.post("/users/auth/register/", userData)
      console.log("[v0] Teacher user created:", userResponse.data)
      const userId = userResponse.data.user?.id
      if (!userId) throw new Error("User creation succeeded but no user ID returned")
      const profileData = {
        user: userId,
        employee_id: data.employee_id || `EMP${userId}`,
        qualification: data.qualification || "",
        experience_years: data.experience_years || 0,
        department: data.department || null,
        bio: data.bio || "",
      }
      console.log("[v0] Creating teacher profile with data:", JSON.stringify(profileData, null, 2))
      const profileResponse = await apiClient.post("/users/teachers/", profileData)
      console.log("[v0] Teacher profile created:", profileResponse.data)
      return profileResponse
    } catch (error: any) {
      console.error("[v0] Teacher creation error details:", {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message,
      })
      throw error
    }
  },
  createStudent: async (data: any) => {
    try {
      const userData = {
        username: data.username,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        password: data.password,
        password2: data.password,
        role: "student",
        phone: data.phone || "",
        school: data.school_id,
      }
      console.log("[v0] Creating student user with data:", JSON.stringify(userData, null, 2))
      const userResponse = await apiClient.post("/users/auth/register/", userData)
      console.log("[v0] Student user created:", userResponse.data)
      const userId = userResponse.data.user?.id
      if (!userId) throw new Error("User creation succeeded but no user ID returned")
      const profileData = {
        user: userId,
        level: data.level || null,
        department: data.department || null,
      }
      console.log("[v0] Creating student profile with data:", JSON.stringify(profileData, null, 2))
      const profileResponse = await apiClient.post("/users/students/", profileData)
      console.log("[v0] Student profile created:", profileResponse.data)
      return profileResponse
    } catch (error: any) {
      console.error("[v0] Student creation error details:", {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message,
      })
      throw error
    }
  },
  update: (id: number, data: any) => apiClient.put(`/users/users/${id}/`, data),
  updateTeacher: (id: number, data: any) => apiClient.put(`/users/teachers/${id}/`, data),
  updateStudent: (id: number, data: any) => apiClient.put(`/users/students/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/users/users/${id}/`),
  deleteTeacher: (id: number) => apiClient.delete(`/users/teachers/${id}/`),
  deleteStudent: (id: number) => apiClient.delete(`/users/students/${id}/`),  
  adminStaff: {
    list: () => apiClient.get("/users/admin-staff/"),
    create: (data: any) => apiClient.post("/users/admin-staff/", data),
    updatePermissions: (id: number, permissions: string[]) => apiClient.put(`/users/admin-staff/${id}/permissions/`, { permissions }),
    delete: (id: number) => apiClient.delete(`/users/admin-staff/${id}/`),
  },
}

export const timetableAPI = {
  list: () => apiClient.get("/academics/timetables/"),
  create: (data: any) => apiClient.post("/academics/timetables/", data),
  update: (id: number, data: any) => apiClient.put(`/academics/timetables/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/academics/timetables/${id}/`),
}

export const assignmentAPI = {
  list: () => apiClient.get("/assignments/"),
  create: (data: any) => apiClient.post("/assignments/", data),
  update: (id: number, data: any) => apiClient.put(`/assignments/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/assignments/${id}/`),
  submissions: () => apiClient.get("/assignments/submissions/"),
  submitAssignment: (data: FormData) => apiClient.post("/assignments/submissions/", data, { headers: { "Content-Type": "multipart/form-data" } }),
  gradeSubmission: (id: number, data: any) => apiClient.post(`/assignments/submissions/${id}/grade/`, data),
}

export const billingAPI = {
  fees: () => apiClient.get("/billing/fees/"),
  superAdminOverview: () => apiClient.get("/billing/super-admin/overview/"),
  superAdminRevenueAnalytics: () => apiClient.get("/billing/super-admin/revenue_analytics/"),
  superAdminAssignPlan: (data: { school_id: number; plan_id: number; end_date: string }) =>
    apiClient.post("/billing/super-admin/assign_plan/", data),
  superAdminGatewayConfig: () => apiClient.get("/billing/super-admin/gateway_config/"),
  feeTypes: () => apiClient.get("/billing/fees/"),
  createFee: (data: any) => apiClient.post("/billing/fees/", data),
  createFeeType: (data: any) => apiClient.post("/billing/fees/", data),
  updateFee: (id: number, data: any) => apiClient.put(`/billing/fees/${id}/`, data),
  updateFeeType: (id: number, data: any) => apiClient.put(`/billing/fees/${id}/`, data),
  deleteFee: (id: number) => apiClient.delete(`/billing/fees/${id}/`),
  deleteFeeType: (id: number) => apiClient.delete(`/billing/fees/${id}/`),
  schoolFeeAssignments: () => apiClient.get("/billing/school-fee-assignments/"),
  createSchoolFeeAssignment: (data: any) => apiClient.post("/billing/school-fee-assignments/", data),
  updateSchoolFeeAssignment: (id: number, data: any) => apiClient.put(`/billing/school-fee-assignments/${id}/`, data),
  deleteSchoolFeeAssignment: (id: number) => apiClient.delete(`/billing/school-fee-assignments/${id}/`),
  applySchoolFeeToStudents: (id: number) => apiClient.post(`/billing/school-fee-assignments/${id}/apply_to_students/`),
  classFeeAssignments: () => apiClient.get("/billing/class-fee-assignments/"),
  createClassFeeAssignment: (data: any) => apiClient.post("/billing/class-fee-assignments/", data),
  updateClassFeeAssignment: (id: number, data: any) => apiClient.put(`/billing/class-fee-assignments/${id}/`, data),
  deleteClassFeeAssignment: (id: number) => apiClient.delete(`/billing/class-fee-assignments/${id}/`),
  applyClassFeeToStudents: (id: number) => apiClient.post(`/billing/class-fee-assignments/${id}/apply_to_students/`),
  studentFeeAssignments: () => apiClient.get("/billing/student-fee-assignments/"),
  studentFeeAssignmentsByStudent: (studentId: number) => apiClient.get(`/billing/student-fee-assignments/?student=${studentId}`),
  createStudentFeeAssignment: (data: any) => apiClient.post("/billing/student-fee-assignments/", data),
  updateStudentFeeAssignment: (id: number, data: any) => apiClient.patch(`/billing/student-fee-assignments/${id}/`, data),
  deleteStudentFeeAssignment: (id: number) => apiClient.delete(`/billing/student-fee-assignments/${id}/`),
  myFees: () => apiClient.get("/billing/student-fee-assignments/my_fees/"),
  markFeePaid: (id: number) => apiClient.post(`/billing/student-fee-assignments/${id}/mark_paid/`),
  manualPayments: () => apiClient.get("/billing/manual-payments/"),
  manualPaymentsByStudent: (studentId: number) => {
    if (!Number.isFinite(studentId) || studentId <= 0) {
      return Promise.reject(new Error(`Invalid studentId for manualPaymentsByStudent: ${studentId}`))
    }
    return apiClient.get(`/billing/manual-payments/by_student/?student_id=${studentId}`)
  },
  manualPaymentsBySchool: () => apiClient.get("/billing/manual-payments/by_school/"),
  recordManualPayment: (data: any) => apiClient.post("/billing/manual-payments/", data),
  onlinePayments: () => apiClient.get("/billing/online-payments/"),
  onlinePaymentsByStudent: (studentId: number) => {
    if (!Number.isFinite(studentId) || studentId <= 0) {
      return Promise.reject(new Error(`Invalid studentId for onlinePaymentsByStudent: ${studentId}`))
    }
    return apiClient.get(`/billing/online-payments/by_student/?student_id=${studentId}`)
  },
  onlinePaymentsBySchool: () => apiClient.get("/billing/online-payments/by_school/"),
  recordOnlinePayment: (data: any) => apiClient.post("/billing/online-payments/", data),
  invoices: () => apiClient.get("/billing/invoices/"),
  createInvoice: (data: any) => apiClient.post("/billing/invoices/", data),
  updateInvoice: (id: number, data: any) => apiClient.put(`/billing/invoices/${id}/`, data),
  deleteInvoice: (id: number) => apiClient.delete(`/billing/invoices/${id}/`),
  payments: () => apiClient.get("/billing/payments/"),
  createPayment: (data: any) => apiClient.post("/billing/payments/", data),
  updatePayment: (id: number, data: any) => apiClient.put(`/billing/payments/${id}/`, data),
  deletePayment: (id: number) => apiClient.delete(`/billing/payments/${id}/`),
  getSchoolFeesStats: async () => {
    try {
      const [assignmentsRes, manualRes, onlineRes] = await Promise.all([
        apiClient.get("/billing/student-fee-assignments/?school=my_school"),
        apiClient.get("/billing/manual-payments/by_school/"),
        apiClient.get("/billing/online-payments/by_school/")
      ]);
      const assignments = assignmentsRes.data?.results || assignmentsRes.data || [];
      const manualPayments = manualRes.data?.results || manualRes.data || [];
      const onlinePayments = onlineRes.data?.results || onlineRes.data || [];
      const totalExpected = assignments.reduce((sum: number, assignment: any) => sum + (parseFloat(assignment.amount) || 0), 0);
      const totalCollected = [...manualPayments, ...onlinePayments].reduce((sum: number, payment: any) => sum + (parseFloat(payment.amount) || 0), 0);
      return {
        total_expected: totalExpected,
        total_collected: totalCollected,
        pending_fees: Math.max(0, totalExpected - totalCollected),
        collection_rate: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0,
      };
    } catch (error) {
      console.error('Failed to fetch fees stats:', error);
      return { total_expected: 0, total_collected: 0, pending_fees: 0, collection_rate: 0 };
    }
  },
}

export const superAdminAPI = {
  usage: () => apiClient.get("/schools/schools/super_admin_usage/"),
  analytics: () => apiClient.get("/schools/schools/super_admin_analytics/"),
}

export const platformAPI = {
  // Dashboard
  overview: () => apiClient.get("/platform/overview/"),
  health: () => apiClient.get("/platform/health/"),

  // Roles & permissions (RBAC)
  roles: (params?: any) => apiClient.get("/platform/roles/", { params }),
  createRole: (data: any) => apiClient.post("/platform/roles/", data),
  updateRole: (id: number, data: any) => apiClient.put(`/platform/roles/${id}/`, data),
  deleteRole: (id: number) => apiClient.delete(`/platform/roles/${id}/`),
  assignRole: (roleId: number, userId: number) => apiClient.post(`/platform/roles/${roleId}/assign/`, { user_id: userId }),
  unassignRole: (roleId: number, userId: number) => apiClient.post(`/platform/roles/${roleId}/unassign/`, { user_id: userId }),
  roleAssignments: () => apiClient.get("/platform/roles/assignments/"),

  // Audit logs
  auditLogs: (params?: any) => apiClient.get("/platform/audit-logs/", { params }),

  // Impersonation
  impersonations: () => apiClient.get("/platform/impersonate/"),
  startImpersonation: (targetUserId: number, reason: string) =>
    apiClient.post("/platform/impersonate/", { target_user_id: targetUserId, reason }),
  stopImpersonation: () => apiClient.delete("/platform/impersonate/"),

  // Support center
  tickets: (params?: any) => apiClient.get("/platform/tickets/", { params }),
  ticketDetail: (id: number) => apiClient.get(`/platform/tickets/${id}/`),
  createTicket: (data: any) => apiClient.post("/platform/tickets/", data),
  updateTicket: (id: number, data: any) => apiClient.put(`/platform/tickets/${id}/`, data),
  ticketComments: (id: number) => apiClient.get(`/platform/tickets/${id}/comments/`),
  addTicketComment: (id: number, data: any) => apiClient.post(`/platform/tickets/${id}/comments/`, data),

  // Feature flags
  featureFlags: (params?: any) => apiClient.get("/platform/feature-flags/", { params }),
  createFeatureFlag: (data: any) => apiClient.post("/platform/feature-flags/", data),
  updateFeatureFlag: (id: number, data: any) => apiClient.put(`/platform/feature-flags/${id}/`, data),
  deleteFeatureFlag: (id: number) => apiClient.delete(`/platform/feature-flags/${id}/`),

  // System settings
  settings: (params?: any) => apiClient.get("/platform/settings/", { params }),
  createSetting: (data: any) => apiClient.post("/platform/settings/", data),
  updateSetting: (id: number, data: any) => apiClient.put(`/platform/settings/${id}/`, data),

  // Notification campaigns
  campaigns: (params?: any) => apiClient.get("/platform/campaigns/", { params }),
  createCampaign: (data: any) => apiClient.post("/platform/campaigns/", data),
  updateCampaign: (id: number, data: any) => apiClient.put(`/platform/campaigns/${id}/`, data),
  sendCampaign: (id: number) => apiClient.post(`/platform/campaigns/${id}/send/`),
  deleteCampaign: (id: number) => apiClient.delete(`/platform/campaigns/${id}/`),

  // API keys & webhooks
  apiKeys: () => apiClient.get("/platform/api-keys/"),
  createApiKey: (data: any) => apiClient.post("/platform/api-keys/", data),
  revokeApiKey: (id: number) => apiClient.delete(`/platform/api-keys/${id}/`),
  apiKeyUsage: (id: number) => apiClient.get(`/platform/api-keys/${id}/usage/`),
  webhooks: () => apiClient.get("/platform/webhooks/"),
  createWebhook: (data: any) => apiClient.post("/platform/webhooks/", data),
  updateWebhook: (id: number, data: any) => apiClient.put(`/platform/webhooks/${id}/`, data),
  deleteWebhook: (id: number) => apiClient.delete(`/platform/webhooks/${id}/`),

  // Security
  securityEvents: (params?: any) => apiClient.get("/platform/security-events/", { params }),
  sessions: (params?: any) => apiClient.get("/platform/sessions/", { params }),
  revokeSession: (id: number) => apiClient.post(`/platform/sessions/${id}/revoke/`),

  // Moderation
  moderationReports: (params?: any) => apiClient.get("/platform/moderation-reports/", { params }),
  updateModerationReport: (id: number, data: any) => apiClient.put(`/platform/moderation-reports/${id}/`, data),
  patchModerationReport: (id: number, data: any) => apiClient.patch(`/platform/moderation-reports/${id}/`, data),

  // Finance
  coupons: () => apiClient.get("/platform/coupons/"),
  createCoupon: (data: any) => apiClient.post("/platform/coupons/", data),
  updateCoupon: (id: number, data: any) => apiClient.put(`/platform/coupons/${id}/`, data),
  deleteCoupon: (id: number) => apiClient.delete(`/platform/coupons/${id}/`),
  invoices: (params?: any) => apiClient.get("/platform/invoices/", { params }),
  createInvoice: (data: any) => apiClient.post("/platform/invoices/", data),
  markInvoicePaid: (id: number) => apiClient.post(`/platform/invoices/${id}/mark_paid/`),
  refunds: () => apiClient.get("/platform/refunds/"),
  createRefund: (data: any) => apiClient.post("/platform/refunds/", data),
  processRefund: (id: number) => apiClient.post(`/platform/refunds/${id}/process/`),

  // Storage
  storageQuotas: () => apiClient.get("/platform/storage-quotas/"),
  upsertStorageQuota: (data: any) => apiClient.post("/platform/storage-quotas/", data),
  recomputeStorage: () => apiClient.post("/platform/storage-quotas/recompute/"),

  // Monitoring
  monitoring: (params?: any) => apiClient.get("/platform/monitoring/", { params }),
}

/**
 * Super Admin Feed Supervisor — global supervision over the EXISTING
 * Alara Feed (FeedLesson / FeedReport). All endpoints require the
 * super_admin role and are audited server-side.
 */
export const feedSupervisorAPI = {
  // Overview stats (cached server-side for 60s)
  overview: () => apiClient.get("/feed/supervisor/overview/", { _trackLoading: false } as any),

  // All posts across every school — paginated + filterable
  posts: (params?: any) => apiClient.get("/feed/supervisor/posts/", { params }),
  moderatePost: (postId: number, data: { action: string; notes?: string }) =>
    apiClient.post(`/feed/supervisor/posts/${postId}/moderate/`, data),

  // Reported content queue
  reports: (params?: any) => apiClient.get("/feed/supervisor/reports/", { params }),
  handleReport: (
    reportId: number,
    data: {
      action:
        | "dismiss"
        | "hide_post"
        | "remove_post"
        | "warn_creator"
        | "restrict_creator"
        | "suspend_creator"
      notes?: string
    },
  ) => apiClient.post(`/feed/supervisor/reports/${reportId}/handle/`, data),

  // Creator monitoring
  creators: (params?: any) => apiClient.get("/feed/supervisor/creators/", { params }),
  creatorDetail: (teacherId: number) =>
    apiClient.get(`/feed/supervisor/creators/${teacherId}/`),
  restrictCreator: (teacherId: number, notes?: string) =>
    apiClient.post(`/feed/supervisor/creators/${teacherId}/restrict/`, { notes }),
  suspendCreator: (teacherId: number, notes?: string) =>
    apiClient.post(`/feed/supervisor/creators/${teacherId}/suspend/`, { notes }),
  unrestrictCreator: (teacherId: number, notes?: string) =>
    apiClient.post(`/feed/supervisor/creators/${teacherId}/unrestrict/`, { notes }),

  // School monitoring
  schools: (params?: any) => apiClient.get("/feed/supervisor/schools/", { params }),

  // Feed moderation policies
  settings: () => apiClient.get("/feed/supervisor/settings/"),
  updateSettings: (data: Record<string, unknown>) =>
    apiClient.put("/feed/supervisor/settings/", data),
}

export default {
  authAPI,
  schoolsAPI,
  academicsAPI,
  promotionAPI,
  announcementsAPI,
  attendanceAPI,
  gradesAPI,
  messagingAPI,
  usersAPI,
  timetableAPI,
  assignmentAPI,
  billingAPI,
  superAdminAPI,
  platformAPI,
  feedSupervisorAPI,
}
