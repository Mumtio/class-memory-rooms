"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface KeyboardShortcutsProps {
  onNewContribution?: () => void
  onSave?: () => void
}

export function KeyboardShortcuts({ onNewContribution, onSave }: KeyboardShortcutsProps) {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // / - Focus search
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        router.push("/search")
      }

      // n - New contribution
      if (e.key === "n" && !e.metaKey && !e.ctrlKey && onNewContribution) {
        e.preventDefault()
        onNewContribution()
      }

      // s - Save
      if (e.key === "s" && !e.metaKey && !e.ctrlKey && onSave) {
        e.preventDefault()
        onSave()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [router, onNewContribution, onSave])

  return null
}
