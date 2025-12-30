"use client"

import { useState, useEffect } from "react"

export type UserRole = "student" | "teacher" | "admin"

export interface User {
  id: string
  name: string
  email: string
  schoolMemberships: Record<string, { role: UserRole; schoolName: string; joinedAt: string }>
  currentSchoolId?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

const STORAGE_KEY = "class-memory-rooms-auth"

// Mock school keys for demo
const VALID_SCHOOL_KEYS: Record<string, { id: string; name: string }> = {
  STANFORD2024: { id: "stanford", name: "Stanford University" },
  DEMO2024: { id: "demo", name: "Demo High School" },
}

function getAuthState(): AuthState {
  if (typeof window === "undefined") return { user: null, isAuthenticated: false }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { user: null, isAuthenticated: false }
    return JSON.parse(stored)
  } catch {
    return { user: null, isAuthenticated: false }
  }
}

function saveAuthState(state: AuthState): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error("Failed to save auth state:", error)
  }
}

export function createSchool(schoolName: string, userName: string, userEmail: string): User {
  const schoolId = schoolName.toLowerCase().replace(/\s+/g, "-")
  const user: User = {
    id: `user-${Date.now()}`,
    name: userName,
    email: userEmail,
    schoolMemberships: {
      [schoolId]: {
        role: "admin",
        schoolName,
        joinedAt: new Date().toISOString(),
      },
    },
    currentSchoolId: schoolId,
  }

  saveAuthState({ user, isAuthenticated: true })
  return user
}

export function joinSchool(
  schoolKey: string,
  userName: string,
  userEmail: string,
): { success: boolean; user?: User; error?: string } {
  const school = VALID_SCHOOL_KEYS[schoolKey.toUpperCase()]

  if (!school) {
    return { success: false, error: "Invalid school key. Please check and try again." }
  }

  const existingState = getAuthState()
  let user: User

  if (existingState.user) {
    // Add school to existing user
    user = {
      ...existingState.user,
      schoolMemberships: {
        ...existingState.user.schoolMemberships,
        [school.id]: {
          role: "student",
          schoolName: school.name,
          joinedAt: new Date().toISOString(),
        },
      },
      currentSchoolId: school.id,
    }
  } else {
    // Create new user
    user = {
      id: `user-${Date.now()}`,
      name: userName,
      email: userEmail,
      schoolMemberships: {
        [school.id]: {
          role: "student",
          schoolName: school.name,
          joinedAt: new Date().toISOString(),
        },
      },
      currentSchoolId: school.id,
    }
  }

  saveAuthState({ user, isAuthenticated: true })
  return { success: true, user }
}

export function logout(): void {
  saveAuthState({ user: null, isAuthenticated: false })
}

export function getCurrentSchoolRole(user: User | null, schoolId?: string): UserRole | null {
  if (!user || !schoolId) return null
  if (!user.schoolMemberships || !user.schoolMemberships[schoolId]) return null
  return user.schoolMemberships[schoolId].role
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({ user: null, isAuthenticated: false })
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Hydrate from localStorage after component mounts
    setAuthState(getAuthState())
    setIsHydrated(true)

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setAuthState(getAuthState())
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const signOut = () => {
    logout()
    setAuthState({ user: null, isAuthenticated: false })
  }

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isHydrated,
    signOut,
  }
}
