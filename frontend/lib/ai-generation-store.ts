"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { UserRole } from "./auth-store"

interface GenerationRecord {
  chapterId: string
  timestamp: number
  generatedBy: string
  generatorRole: UserRole
  contributionCount: number
}

interface AIGenerationStore {
  generations: GenerationRecord[]
  recordGeneration: (chapterId: string, generatedBy: string, generatorRole: UserRole, contributionCount: number) => void
  getLastGeneration: (chapterId: string) => GenerationRecord | undefined
  canGenerate: (
    chapterId: string,
    role: UserRole,
    contributionCount: number,
  ) => {
    allowed: boolean
    reason?: string
  }
}

// Minimum contribution threshold
const MIN_CONTRIBUTIONS = 5

// Cooldown periods in milliseconds
const STUDENT_COOLDOWN = 2 * 60 * 60 * 1000 // 2 hours
const TEACHER_COOLDOWN = 30 * 60 * 1000 // 30 minutes
const ADMIN_COOLDOWN = 0 // No cooldown

export const useAIGenerationStore = create<AIGenerationStore>()(
  persist(
    (set, get) => ({
      generations: [],

      recordGeneration: (chapterId, generatedBy, generatorRole, contributionCount) => {
        set((state) => ({
          generations: [
            ...state.generations.filter((g) => g.chapterId !== chapterId),
            {
              chapterId,
              timestamp: Date.now(),
              generatedBy,
              generatorRole,
              contributionCount,
            },
          ],
        }))
      },

      getLastGeneration: (chapterId) => {
        return get().generations.find((g) => g.chapterId === chapterId)
      },

      canGenerate: (chapterId, role, contributionCount) => {
        // Check minimum contributions
        if (contributionCount < MIN_CONTRIBUTIONS) {
          return {
            allowed: false,
            reason: `Need ${MIN_CONTRIBUTIONS} contributions`,
          }
        }

        // Check cooldown based on role
        const lastGen = get().getLastGeneration(chapterId)
        if (!lastGen) {
          return { allowed: true }
        }

        const cooldownPeriod =
          role === "student" ? STUDENT_COOLDOWN : role === "teacher" ? TEACHER_COOLDOWN : ADMIN_COOLDOWN

        const timeSinceLastGen = Date.now() - lastGen.timestamp

        if (timeSinceLastGen < cooldownPeriod) {
          const remainingMinutes = Math.ceil((cooldownPeriod - timeSinceLastGen) / (60 * 1000))
          return {
            allowed: false,
            reason: `AI recently generated — try again in ${remainingMinutes}min`,
          }
        }

        return { allowed: true }
      },
    }),
    {
      name: "ai-generation-storage",
    },
  ),
)
