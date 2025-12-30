"use client"

import type React from "react"

import { ActiveSchoolProvider } from "@/lib/active-school-context"
import { useAuth } from "@/lib/auth-store"

export function ActiveSchoolWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  return <ActiveSchoolProvider user={user}>{children}</ActiveSchoolProvider>
}
