"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User, UserRole } from "@/lib/auth-store"

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
  refreshMemberships: () => void
}

// Create context with a default value to prevent undefined errors
const defaultContextValue: ActiveSchoolContextType = {
  activeSchoolId: null,
  activeMembership: null,
  setActiveSchool: () => {},
  getUserMemberships: () => [],
  refreshMemberships: () => {},
}

const ActiveSchoolContext = createContext<ActiveSchoolContextType>(defaultContextValue)

const ACTIVE_SCHOOL_KEY = "class-memory-active-school"

export function ActiveSchoolProvider({
  children,
  user,
}: {
  children: ReactNode
  user: User | null
}) {
  const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const getUserMemberships = React.useCallback((user: User | null): Membership[] => {
    if (!user || !user.schoolMemberships) return []

    return Object.entries(user.schoolMemberships).map(([schoolId, data]) => ({
      userId: user.id,
      schoolId,
      schoolName: data.schoolName,
      role: data.role,
      joinedAt: data.joinedAt,
    }))
  }, [])

  const refreshMemberships = React.useCallback(() => {
    setRefreshKey(prev => prev + 1)
  }, [])

  // Initialize active school from localStorage or user's current school
  useEffect(() => {
    setIsHydrated(true)
    
    if (!user) {
      setActiveSchoolId(null)
      return
    }

    // Only access localStorage on client side
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(ACTIVE_SCHOOL_KEY)
      const memberships = getUserMemberships(user)

      if (stored && memberships.some((m) => m.schoolId === stored)) {
        setActiveSchoolId(stored)
      } else if (user.currentSchoolId) {
        setActiveSchoolId(user.currentSchoolId)
      } else if (memberships.length > 0) {
        setActiveSchoolId(memberships[0].schoolId)
      }
    }
  }, [user, getUserMemberships, refreshKey])

  const activeMembership: Membership | null = React.useMemo(() => {
    if (!user || !activeSchoolId) {
      return null
    }

    // Get from memberships
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

  const setActiveSchool = React.useCallback((schoolId: string) => {
    setActiveSchoolId(schoolId)
    if (typeof window !== "undefined") {
      localStorage.setItem(ACTIVE_SCHOOL_KEY, schoolId)
    }
  }, [])

  const contextValue = React.useMemo(() => ({
    activeSchoolId,
    activeMembership,
    setActiveSchool,
    getUserMemberships,
    refreshMemberships,
  }), [activeSchoolId, activeMembership, setActiveSchool, getUserMemberships, refreshMemberships])

  return (
    <ActiveSchoolContext.Provider value={contextValue}>
      {children}
    </ActiveSchoolContext.Provider>
  )
}

export function useActiveSchool() {
  const context = useContext(ActiveSchoolContext)
  return context
}
