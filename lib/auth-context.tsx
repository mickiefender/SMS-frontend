"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authAPI } from "./api"

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: "super_admin" | "school_admin" | "teacher" | "student"
  school_id?: number
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (data: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchUser = async () => {
    try {
      const token = sessionStorage.getItem("authToken")
      if (token) {
        const response = await authAPI.me()
        const userData = response.data
        sessionStorage.setItem("user", JSON.stringify(userData))
        setUser(userData)
      }
    } catch (error) {
      // If fetching user fails, it might mean the token is invalid
      sessionStorage.removeItem("authToken")
      sessionStorage.removeItem("user")
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password })
      const { access } = response.data

      sessionStorage.setItem("authToken", access)
      await fetchUser() // Fetch user data after setting token
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

  return <AuthContext.Provider value={{ user, loading, login, logout, register }}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider")
  }
  return context
}
