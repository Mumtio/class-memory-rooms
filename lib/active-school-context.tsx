"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User, UserRole } from "@/lib/auth-store"
import { isDemoSchool, getDemoSchoolRole, DEMO_SCHOOL_NAME } from "@/lib/demo-school"

export interface Membership {
  userId: string
  schoolId: string
  schoolName: string
  role: UserRole
  joinedAt: string
}

export interface ActiveSchoolContextType {
  activeSchoolId: string | null
  activeMembership: Membership | null
  setActiveSchool: (schoolId: string) => void
  getUserMemberships: (user: User | null) => Membership[]
}

const ActiveSchoolContext = createContext<ActiveSchoolContextType | undefined>(undefined)

const ACTIVE_SCHOOL_KEY = "class-memory-active-school"

export function ActiveSchoolProvider({
  children,
  user,
}: {
  children: ReactNode
  user: User | null
}) {
  const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null)

  // Initialize active school from localStorage or user's current school
  useEffect(() => {
    if (!user) {
      setActiveSchoolId(null)
      return
    }

    const stored = localStorage.getItem(ACTIVE_SCHOOL_KEY)
    const memberships = getUserMemberships(user)

    if (stored && memberships.some((m) => m.schoolId === stored)) {
      setActiveSchoolId(stored)
    } else if (user.currentSchoolId) {
      setActiveSchoolId(user.currentSchoolId)
    } else if (memberships.length > 0) {
      setActiveSchoolId(memberships[0].schoolId)
    }
  }, [user])

  const getUserMemberships = (user: User | null): Membership[] => {
    if (!user || !user.schoolMemberships) return []

    return Object.entries(user.schoolMemberships).map(([schoolId, data]) => ({
      userId: user.id,
      schoolId,
      schoolName: data.schoolName,
      role: data.role,
      joinedAt: data.joinedAt,
    }))
  }

  const activeMembership: Membership | null = React.useMemo(() => {
    if (!user || !activeSchoolId) {
      return null
    }

    if (isDemoSchool(activeSchoolId)) {
      return {
        userId: user.id,
        schoolId: activeSchoolId,
        schoolName: DEMO_SCHOOL_NAME,
        role: getDemoSchoolRole(), // Always "student" in demo
        joinedAt: new Date().toISOString(),
      }
    }

    // Regular school - get from memberships
    if (!user.schoolMemberships?.[activeSchoolId]) {
      return null
    }

    const data = user.schoolMemberships[activeSchoolId]
    return {
      userId: user.id,
      schoolId: activeSchoolId,
      schoolName: data.schoolName,
      role: data.role,
      joinedAt: data.joinedAt,
    }
  }, [user, activeSchoolId])

  const setActiveSchool = (schoolId: string) => {
    setActiveSchoolId(schoolId)
    localStorage.setItem(ACTIVE_SCHOOL_KEY, schoolId)
  }

  return (
    <ActiveSchoolContext.Provider
      value={{
        activeSchoolId,
        activeMembership,
        setActiveSchool,
        getUserMemberships,
      }}
    >
      {children}
    </ActiveSchoolContext.Provider>
  )
}

export function useActiveSchool() {
  const context = useContext(ActiveSchoolContext)
  if (context === undefined) {
    throw new Error("useActiveSchool must be used within an ActiveSchoolProvider")
  }
  return context
}
