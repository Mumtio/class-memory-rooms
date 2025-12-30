"use client"

import type React from "react"

import { ActiveSchoolProvider } from "@/lib/active-school-context"
import { useAuth } from "@/lib/auth-store"
import { HydrationBoundary } from "@/components/hydration-boundary"

export function ActiveSchoolWrapper({ children }: { children: React.ReactNode }) {
  const { user, isHydrated } = useAuth()

  return (
    <HydrationBoundary fallback={<div suppressHydrationWarning>{children}</div>}>
      <ActiveSchoolProvider user={user}>{children}</ActiveSchoolProvider>
    </HydrationBoundary>
  )
}
