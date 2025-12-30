"use client"

import { useState, useEffect } from "react"

// Demo state type definitions
export interface DemoState {
  savedContributionIds: string[]
  savedChapterNotes: Array<{ chapterId: string; version: number }>
  recentActivity: Array<{ type: "chapter" | "notes"; chapterId: string; at: string }>
}

const STORAGE_KEY = "class-memory-rooms-demo-state"

// Default seed data for first-time users
const defaultDemoState: DemoState = {
  savedContributionIds: [],
  savedChapterNotes: [],
  recentActivity: [
    {
      type: "notes",
      chapterId: "ch-phy-101-01",
      at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    },
  ],
}

// Get demo state from localStorage
function getDemoState(): DemoState {
  if (typeof window === "undefined") return defaultDemoState

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return defaultDemoState
    return JSON.parse(stored)
  } catch {
    return defaultDemoState
  }
}

// Save demo state to localStorage
function saveDemoState(state: DemoState): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error("Failed to save demo state:", error)
  }
}

// Toggle saved contribution
export function toggleSavedContribution(id: string): void {
  const state = getDemoState()
  const index = state.savedContributionIds.indexOf(id)

  if (index > -1) {
    state.savedContributionIds.splice(index, 1)
  } else {
    state.savedContributionIds.push(id)
  }

  saveDemoState(state)
}

// Toggle saved notes for a chapter
export function toggleSavedNotes(chapterId: string, version: number): void {
  const state = getDemoState()
  const index = state.savedChapterNotes.findIndex((item) => item.chapterId === chapterId && item.version === version)

  if (index > -1) {
    state.savedChapterNotes.splice(index, 1)
  } else {
    state.savedChapterNotes.push({ chapterId, version })
  }

  saveDemoState(state)
}

// Push recent activity (most recent first)
export function pushRecentActivity(item: { type: "chapter" | "notes"; chapterId: string }): void {
  const state = getDemoState()

  // Remove existing activity for this chapter+type
  state.recentActivity = state.recentActivity.filter(
    (activity) => !(activity.chapterId === item.chapterId && activity.type === item.type),
  )

  // Add new activity at the beginning
  state.recentActivity.unshift({
    ...item,
    at: new Date().toISOString(),
  })

  // Keep only the 10 most recent activities
  state.recentActivity = state.recentActivity.slice(0, 10)

  saveDemoState(state)
}

// Get the route to continue where user left off
export function getContinueTarget(): string | null {
  const state = getDemoState()

  if (state.recentActivity.length === 0) return null

  const mostRecent = state.recentActivity[0]

  if (mostRecent.type === "notes") {
    return `/chapter/${mostRecent.chapterId}/notes`
  } else {
    return `/chapter/${mostRecent.chapterId}`
  }
}

// Hook to use demo store in React components
export function useDemoStore() {
  const [state, setState] = useState<DemoState>(() => getDemoState())

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setState(getDemoState())
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const toggleContribution = (id: string) => {
    toggleSavedContribution(id)
    setState(getDemoState())
  }

  const toggleNotes = (chapterId: string, version: number) => {
    toggleSavedNotes(chapterId, version)
    setState(getDemoState())
  }

  const addActivity = (item: { type: "chapter" | "notes"; chapterId: string }) => {
    pushRecentActivity(item)
    setState(getDemoState())
  }

  const isSavedContribution = (id: string) => state.savedContributionIds.includes(id)

  const isSavedNotes = (chapterId: string, version: number) =>
    state.savedChapterNotes.some((item) => item.chapterId === chapterId && item.version === version)

  return {
    state,
    toggleContribution,
    toggleNotes,
    addActivity,
    isSavedContribution,
    isSavedNotes,
    getContinueTarget,
  }
}
