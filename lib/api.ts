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
  login: (credentials: { email: string; password: string }) => apiClient.post("/users/auth/login/", credentials),
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
  faculties: () => apiClient.get("/academics/faculties/"),
  departments: () => apiClient.get("/academics/departments/"),
  classes: () => apiClient.get("/academics/classes/"),
  subjects: () => apiClient.get("/academics/subjects/"),
  enrollments: () => apiClient.get("/academics/enrollments/"),
  timetables: () => apiClient.get("/academics/timetables/"),
  classSubjects: () => apiClient.get("/academics/class-subjects/"),
  createClass: (data: any) => apiClient.post("/academics/classes/", data),
  createSubject: (data: any) => apiClient.post("/academics/subjects/", data),
  createFaculty: (data: any) => apiClient.post("/academics/faculties/", data),
  createDepartment: (data: any) => apiClient.post("/academics/departments/", data),
  createEnrollment: (data: any) => apiClient.post("/academics/enrollments/", data),
  createClassSubject: (data: any) => apiClient.post("/academics/class-subjects/", data),
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
  bulkCreate: (data: any) => apiClient.post("/attendance/bulk/", data),
}

export const gradesAPI = {
  list: () => apiClient.get("/students/grades/"),
  create: (data: any) => apiClient.post("/students/grades/", data),
  bulkCreate: (data: any) => apiClient.post("/students/grades/bulk/", data),
}

export const usersAPI = {
  list: () => apiClient.get("/users/users/"),
  teachers: () => apiClient.get("/users/teachers/"),
  students: () => apiClient.get("/users/students/"),
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
      const profileData = {
        user: userId,
        student_id: data.student_id || `STU${userId}`,
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
  list: () => apiClient.get("/assignments/"),
  create: (data: any) => apiClient.post("/assignments/", data),
  update: (id: number, data: any) => apiClient.put(`/assignments/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/assignments/${id}/`),
  submissions: () => apiClient.get("/assignments/submissions/"),
}
