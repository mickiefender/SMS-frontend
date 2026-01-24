"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authAPI, schoolsAPI } from "./api"

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: "super_admin" | "school_admin" | "teacher" | "student"
  school_id?: number
  student_id?: string
}

interface School {
  id: number
  name: string
  // Add other school properties as needed
}

interface AuthContextType {
  user: User | null
  school: School | null
  loading: boolean
  login: (credential: string, password:string, loginType?: "email" | "student_id") => Promise<void>
  logout: () => void
  register: (data: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchSchool = async (schoolId: number) => {
    try {
      const response = await schoolsAPI.getById(schoolId)
      setSchool(response.data)
    } catch (error) {
      console.error("Failed to fetch school data", error)
      // Handle error appropriately
    }
  }

  useEffect(() => {
    const token = sessionStorage.getItem("authToken")
    const storedUser = sessionStorage.getItem("user")

    if (token && storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser)
        setUser(parsedUser)
        if (parsedUser.school_id) {
          fetchSchool(parsedUser.school_id)
        }
      } catch (error) {
        sessionStorage.removeItem("authToken")
        sessionStorage.removeItem("user")
      }
    }
    setLoading(false)
  }, [])

  const login = async (credential: string, password: string, loginType: "email" | "student_id" = "email") => {
    try {
      const loginData = loginType === "email" 
        ? { email: credential, password } 
        : { student_id: credential, password }
      
      const response = await authAPI.login(loginData)
      const { access, user: userData } = response.data

      sessionStorage.setItem("authToken", access)
      sessionStorage.setItem("user", JSON.stringify(userData))
      setUser(userData)

      if (userData.school_id) {
        await fetchSchool(userData.school_id)
      }

      router.push("/dashboard")
    } catch (error) {
      throw new Error("Login failed")
    }
  }

  const logout = () => {
    sessionStorage.removeItem("authToken")
    sessionStorage.removeItem("user")
    authAPI.logout()
    setUser(null)
    setSchool(null)
    router.push("/auth/login")
  }

  const register = async (data: any) => {
    try {
      const response = await authAPI.register(data)
      const { access, user: userData } = response.data

      sessionStorage.setItem("authToken", access)
      sessionStorage.setItem("user", JSON.stringify(userData))
      setUser(userData)
      router.push("/dashboard")
    } catch (error) {
      throw new Error("Registration failed")
    }
  }

  return <AuthContext.Provider value={{ user, school, loading, login, logout, register }}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider")
  }
  return context
}
