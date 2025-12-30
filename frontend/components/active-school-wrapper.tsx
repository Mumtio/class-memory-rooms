"use client"

import type React from "react"

import { ActiveSchoolProvider } from "@/lib/active-school-context"
import { useAuth } from "@/lib/auth-store"

export function ActiveSchoolWrapper({ children }: { children: React.ReactNode }) {
  const { user, isHydrated } = useAuth()

  // Always provide the context, but pass null user until hydrated
  return (
    <ActiveSchoolProvider user={isHydrated ? user : null}>
      {children}
    </ActiveSchoolProvider>
  )
}
