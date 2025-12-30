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
const STORAGE_TOKEN_KEY = "class-memory-rooms-token"

function getAuthState(): AuthState {
  if (typeof window === "undefined") return { user: null, isAuthenticated: false }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { user: null, isAuthenticated: false }
    
    return JSON.parse(stored)
  } catch (error) {
    console.error("Failed to get auth state:", error)
    return { user: null, isAuthenticated: false }
  }
}

function saveAuthState(state: AuthState, token?: string): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    if (token) {
      localStorage.setItem(STORAGE_TOKEN_KEY, token)
    }
  } catch (error) {
    console.error("Failed to save auth state:", error)
  }
}

export async function register(
  username: string,
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // Call Next.js API route which proxies to Foru.ms
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        login: username,
        password: password,
        email: email,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error || 'Registration failed. Please try again.',
      }
    }

    const data = await response.json()
    
    const user: User = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      schoolMemberships: {},
      currentSchoolId: undefined,
    }

    saveAuthState({ user, isAuthenticated: true }, data.token)
    
    // Trigger auth state update across all components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-change"))
    }
    
    return { success: true, user }
  } catch (error) {
    console.error("Registration failed:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Registration failed. Please try again." 
    }
  }
}

export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // Call Next.js API route which proxies to Foru.ms
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        login: username,
        password: password,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error || 'Login failed. Please check your credentials.',
      }
    }

    const data = await response.json()

    const user: User = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      schoolMemberships: {},
      currentSchoolId: undefined,
    }

    saveAuthState({ user, isAuthenticated: true }, data.token)
    
    // Trigger auth state update across all components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-change"))
    }
    
    return { success: true, user }
  } catch (error) {
    console.error("Login failed:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Login failed. Please check your credentials." 
    }
  }
}

export async function createSchool(
  schoolName: string,
  userName: string,
  userEmail: string
): Promise<{ success: boolean; schoolId?: string; joinKey?: string; error?: string }> {
  try {
    const existingState = getAuthState();
    const user = existingState.user;

    if (!user) {
      return {
        success: false,
        error: 'You must be logged in to create a school.',
      };
    }

    // Call Next.js API route to create school in Foru.ms
    const response = await fetch('/api/schools/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: schoolName,
        description: '',
        userId: user.id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Failed to create school. Please try again.',
      };
    }

    const data = await response.json();

    // Update user's school memberships in local state
    const updatedUser: User = {
      ...user,
      schoolMemberships: {
        ...user.schoolMemberships,
        [data.schoolId]: {
          role: 'admin',
          schoolName: schoolName,
          joinedAt: new Date().toISOString(),
        },
      },
      currentSchoolId: data.schoolId,
    };

    saveAuthState({ user: updatedUser, isAuthenticated: true });

    // Trigger auth state update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-change'));
    }

    return {
      success: true,
      schoolId: data.schoolId,
      joinKey: data.joinKey,
    };
  } catch (error) {
    console.error('Create school failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create school. Please try again.',
    };
  }
}

export function joinSchool(
  schoolKey: string,
  userName: string,
  userEmail: string,
): { success: boolean; user?: User; error?: string } {
  // This will be replaced with actual API call in the service layer
  // For now, keeping the mock implementation
  const existingState = getAuthState()
  let user: User

  if (existingState.user) {
    // Add school to existing user
    const schoolId = `school-${schoolKey.toLowerCase()}`
    user = {
      ...existingState.user,
      schoolMemberships: {
        ...existingState.user.schoolMemberships,
        [schoolId]: {
          role: "student",
          schoolName: `School ${schoolKey}`,
          joinedAt: new Date().toISOString(),
        },
      },
      currentSchoolId: schoolId,
    }
  } else {
    // Create new user
    const schoolId = `school-${schoolKey.toLowerCase()}`
    user = {
      id: `user-${crypto.randomUUID()}`,
      name: userName,
      email: userEmail,
      schoolMemberships: {
        [schoolId]: {
          role: "student",
          schoolName: `School ${schoolKey}`,
          joinedAt: new Date().toISOString(),
        },
      },
      currentSchoolId: schoolId,
    }
  }

  saveAuthState({ user, isAuthenticated: true })
  return { success: true, user }
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_TOKEN_KEY)
  }
}

export function getCurrentSchoolRole(user: User | null, schoolId?: string): UserRole | null {
  if (!user || !schoolId) return null
  if (!user.schoolMemberships || !user.schoolMemberships[schoolId]) return null
  return user.schoolMemberships[schoolId].role
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Initialize with localStorage value if available
    if (typeof window !== "undefined") {
      return getAuthState()
    }
    return { user: null, isAuthenticated: false }
  })
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Hydrate from localStorage after component mounts
    const currentState = getAuthState()
    setAuthState(currentState)
    setIsHydrated(true)

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setAuthState(getAuthState())
      }
    }

    // Custom event for same-tab auth updates
    const handleAuthChange = () => {
      setAuthState(getAuthState())
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("auth-change", handleAuthChange)
    
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("auth-change", handleAuthChange)
    }
  }, [])

  const signOut = () => {
    logout()
    setAuthState({ user: null, isAuthenticated: false })
    window.dispatchEvent(new Event("auth-change"))
  }

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isHydrated,
    signOut,
  }
}
