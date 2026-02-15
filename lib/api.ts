import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = sessionStorage.getItem("authToken")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("authToken")
      sessionStorage.removeItem("user")
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login"
      }
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
}

export const academicsAPI = {
  // Generic methods for flexible API calls
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
  
  // Class Teachers (assignment of teachers to classes)
  classTeachers: () => apiClient.get("/academics/class-teachers/"),
  createClassTeacher: (data: any) => apiClient.post("/academics/class-teachers/", data),
  updateClassTeacher: (id: number, data: any) => apiClient.put(`/academics/class-teachers/${id}/`, data),
  deleteClassTeacher: (id: number) => apiClient.delete(`/academics/class-teachers/${id}/`),
  
  // Student Classes (student enrollment in classes)
  studentClasses: () => apiClient.get("/academics/student-classes/"),
  createStudentClass: (data: any) => apiClient.post("/academics/student-classes/", data),
  updateStudentClass: (id: number, data: any) => apiClient.put(`/academics/student-classes/${id}/`, data),
  deleteStudentClass: (id: number) => apiClient.delete(`/academics/student-classes/${id}/`),
  
  // Class Subject Teachers (subject assignment for teachers in classes)
  classSubjectTeachers: () => apiClient.get("/academics/class-subject-teachers/"),
  createClassSubjectTeacher: (data: any) => apiClient.post("/academics/class-subject-teachers/", data),
  updateClassSubjectTeacher: (id: number, data: any) => apiClient.put(`/academics/class-subject-teachers/${id}/`, data),
  deleteClassSubjectTeacher: (id: number) => apiClient.delete(`/academics/class-subject-teachers/${id}/`),
  
  classSubjects: () => apiClient.get("/academics/class-subjects/"),
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
  examResults: () => apiClient.get("/academics/exam-results/"),
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
  // Document Folders
  documentFolders: (params?: any) => apiClient.get("/academics/document-folders/", { params }),
  createDocumentFolder: (data: any) => apiClient.post("/academics/document-folders/", data),
  updateDocumentFolder: (id: number, data: any) => apiClient.put(`/academics/document-folders/${id}/`, data),
  deleteDocumentFolder: (id: number) => apiClient.delete(`/academics/document-folders/${id}/`),
  getFolderChildren: (id: number) => apiClient.get(`/academics/document-folders/${id}/children/`),
  getFolderBreadcrumb: (id: number) => apiClient.get(`/academics/document-folders/${id}/breadcrumb/`),
  
  // Documents
  documents: (params?: any) => apiClient.get("/academics/documents/", { params }),
  uploadDocument: (data: FormData) =>
    apiClient.post("/academics/documents/", data, { headers: { "Content-Type": "multipart/form-data" } }),
  updateDocument: (id: number, data: FormData) =>
    apiClient.put(`/academics/documents/${id}/`, data, { headers: { "Content-Type": "multipart/form-data" } }),
  deleteDocument: (id: number) => apiClient.delete(`/academics/documents/${id}/`),
  moveDocumentToFolder: (id: number, folderId: number | null) =>
    apiClient.patch(`/academics/documents/${id}/move_to_folder/`, { folder_id: folderId }),
  shareDocumentWithClasses: (id: number, classIds: number[]) =>
    apiClient.post(`/academics/documents/${id}/share_with_classes/`, { class_ids: classIds }),
  getDocumentSharedClasses: (id: number) => apiClient.get(`/academics/documents/${id}/shared_classes/`),
  searchDocuments: (query: string) => apiClient.get(`/academics/documents/search/?q=${query}`),
  bulkDeleteDocuments: (documentIds: number[]) =>
    apiClient.post("/academics/documents/bulk_delete/", { document_ids: documentIds }),
  
  // AI Question Generation
  generateQuestionsFromDocument: (docId: number, settings: any) =>
    apiClient.post(`/academics/documents/${docId}/generate_questions/`, settings),
  generateQuestionsFromTopic: (payload: any) =>
    apiClient.post("/academics/documents/generate_questions_from_topic/", payload),
  notices: () => apiClient.get("/academics/notices/"),
  createNotice: (data: any) => apiClient.post("/academics/notices/", data),
  updateNotice: (id: number, data: any) => apiClient.put(`/academics/notices/${id}/`, data),
  deleteNotice: (id: number) => apiClient.delete(`/academics/notices/${id}/`),
  profilePictures: () => apiClient.get("/academics/profile-pictures/"),
  createProfilePicture: (data: FormData) =>
    apiClient.post("/academics/profile-pictures/", data, { headers: { "Content-Type": "multipart/form-data" } }),
  updateProfilePicture: (id: number, data: FormData) =>
    apiClient.put(`/academics/profile-pictures/${id}/`, data, { headers: { "Content-Type": "multipart/form-data" } }),
  deleteProfilePicture: (id: number) => apiClient.delete(`/academics/profile-pictures/${id}/`),
}

export const announcementsAPI = {
  list: () => apiClient.get("/schools/announcements/"),
  create: (data: any) => apiClient.post("/schools/announcements/", data),
  update: (id: number, data: any) => apiClient.put(`/schools/announcements/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/schools/announcements/${id}/`),
}

export const attendanceAPI = {
  list: () => apiClient.get("/attendance/"),
  create: (data: any) => apiClient.post("/attendance/", data),
  bulkCreate: (data: any) => apiClient.post("/attendance/bulk_mark/", data),
  studentReport: (studentId: number) => apiClient.get(`/attendance/student_report/?student_id=${studentId}`),
}

export const gradesAPI = {
  list: () => apiClient.get("/students/grades/"),
  create: (data: any) => apiClient.post("/students/grades/", data),
  update: (id: number, data: any) => apiClient.put(`/students/grades/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/students/grades/${id}/`),
}

export const messagingAPI = {
  // Messages
  messages: () => apiClient.get("/messaging/messages/"),
  sentMessages: () => apiClient.get("/messaging/messages/sent/"),
  createMessage: (data: any) => apiClient.post("/messaging/messages/", data),
  markMessageAsRead: (id: number) => apiClient.post(`/messaging/messages/${id}/mark_as_read/`),
  
  // Announcements
  announcements: () => apiClient.get("/messaging/announcements/"),
  getAnnouncement: (id: number) => apiClient.get(`/messaging/announcements/${id}/`),
  createAnnouncement: (data: any) => apiClient.post("/messaging/announcements/", data),
  updateAnnouncement: (id: number, data: any) => apiClient.put(`/messaging/announcements/${id}/`, data),
  deleteAnnouncement: (id: number) => apiClient.delete(`/messaging/announcements/${id}/`),
  publishAnnouncement: (id: number) => apiClient.post(`/messaging/announcements/${id}/publish/`),
  markAnnouncementAsRead: (id: number) => apiClient.post(`/messaging/announcements/${id}/mark_as_read/`),
  getAnnouncementReadBy: (id: number) => apiClient.get(`/messaging/announcements/${id}/read_by/`),
  
  // Notices
  notices: () => apiClient.get("/messaging/notices/"),
  getNotice: (id: number) => apiClient.get(`/messaging/notices/${id}/`),
  createNotice: (data: any) => apiClient.post("/messaging/notices/", data),
  updateNotice: (id: number, data: any) => apiClient.put(`/messaging/notices/${id}/`, data),
  deleteNotice: (id: number) => apiClient.delete(`/messaging/notices/${id}/`),
  pinNotice: (id: number) => apiClient.post(`/messaging/notices/${id}/pin/`),
}

export const usersAPI = {
  list: () => apiClient.get("/users/users/"),
  getById: (id: number) => apiClient.get(`/users/users/${id}/`),
  teachers: () => apiClient.get("/users/teachers/"),
  getTeacherById: (id: number) => apiClient.get(`/users/teachers/${id}/`),
  students: () => apiClient.get("/users/students/"),
  getStudentById: (id: number) => apiClient.get(`/users/students/${id}/`),
  create: (data: any) => apiClient.post("/users/users/", data),

  createTeacher: async (data: any) => {
    try {
      // Step 1: Create User with role='teacher'
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
      if (!userId) {
        throw new Error("User creation succeeded but no user ID returned")
      }

      // Step 2: Create TeacherProfile linked to the user
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
      // Step 1: Create User with role='student'
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
      if (!userId) {
        throw new Error("User creation succeeded but no user ID returned")
      }

      // Step 2: Create StudentProfile linked to the user
      // Note: student_id will be auto-generated in the backend model's save() method
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
}

export const timetableAPI = {
  list: () => apiClient.get("/academics/timetables/"),
  create: (data: any) => apiClient.post("/academics/timetables/", data),
  update: (id: number, data: any) => apiClient.put(`/academics/timetables/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/academics/timetables/${id}/`),
}

export const assignmentAPI = {
  list: () => apiClient.get("/academics/assignments/"),
  create: (data: any) => apiClient.post("/academics/assignments/", data),
  update: (id: number, data: any) => apiClient.put(`/academics/assignments/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/academics/assignments/${id}/`),
  submissions: () => apiClient.get("/academics/assignments/submissions/"),
  gradeSubmission: (id: number, data: any) => apiClient.post(`/academics/assignments/submissions/${id}/grade/`, data),
}

export const billingAPI = {
  // Fee Types Management
  fees: () => apiClient.get("/billing/fees/"),
  createFee: (data: any) => apiClient.post("/billing/fees/", data),
  updateFee: (id: number, data: any) => apiClient.put(`/billing/fees/${id}/`, data),
  deleteFee: (id: number) => apiClient.delete(`/billing/fees/${id}/`),
  
  // School-wide Fee Assignments
  schoolFeeAssignments: () => apiClient.get("/billing/school-fee-assignments/"),
  createSchoolFeeAssignment: (data: any) => apiClient.post("/billing/school-fee-assignments/", data),
  updateSchoolFeeAssignment: (id: number, data: any) => apiClient.put(`/billing/school-fee-assignments/${id}/`, data),
  deleteSchoolFeeAssignment: (id: number) => apiClient.delete(`/billing/school-fee-assignments/${id}/`),
  applySchoolFeeToStudents: (id: number) => apiClient.post(`/billing/school-fee-assignments/${id}/apply_to_students/`),
  
  // Class Fee Assignments
  classFeeAssignments: () => apiClient.get("/billing/class-fee-assignments/"),
  createClassFeeAssignment: (data: any) => apiClient.post("/billing/class-fee-assignments/", data),
  updateClassFeeAssignment: (id: number, data: any) => apiClient.put(`/billing/class-fee-assignments/${id}/`, data),
  deleteClassFeeAssignment: (id: number) => apiClient.delete(`/billing/class-fee-assignments/${id}/`),
  applyClassFeeToStudents: (id: number) => apiClient.post(`/billing/class-fee-assignments/${id}/apply_to_students/`),
  
  // Individual Student Fee Assignments
  studentFeeAssignments: () => apiClient.get("/billing/student-fee-assignments/"),
  createStudentFeeAssignment: (data: any) => apiClient.post("/billing/student-fee-assignments/", data),
  updateStudentFeeAssignment: (id: number, data: any) => apiClient.put(`/billing/student-fee-assignments/${id}/`, data),
  deleteStudentFeeAssignment: (id: number) => apiClient.delete(`/billing/student-fee-assignments/${id}/`),
  myFees: () => apiClient.get("/billing/student-fee-assignments/my_fees/"),
  markFeePaid: (id: number) => apiClient.post(`/billing/student-fee-assignments/${id}/mark_paid/`),
  
  // Invoices
  invoices: () => apiClient.get("/billing/invoices/"),
  createInvoice: (data: any) => apiClient.post("/billing/invoices/", data),
  updateInvoice: (id: number, data: any) => apiClient.put(`/billing/invoices/${id}/`, data),
  deleteInvoice: (id: number) => apiClient.delete(`/billing/invoices/${id}/`),
  
  // Payments
  payments: () => apiClient.get("/billing/payments/"),
  createPayment: (data: any) => apiClient.post("/billing/payments/", data),
  updatePayment: (id: number, data: any) => apiClient.put(`/billing/payments/${id}/`, data),
  deletePayment: (id: number) => apiClient.delete(`/billing/payments/${id}/`),
}
