"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Sparkles, Bookmark } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useDemoStore } from "@/lib/demo-store"
import { useAuth } from "@/lib/auth-store"
import { useAIGenerationStore } from "@/lib/ai-generation-store"
import { useActiveSchool } from "@/lib/active-school-context"

interface NotesToolbarProps {
  chapterId: string
  chapterLabel: string
  chapterTitle: string
  version: number
  contributionCount: number
  onRegenerateClick: () => void
  onExportClick: () => void
}

export function NotesToolbar({
  chapterId,
  chapterLabel,
  chapterTitle,
  version,
  contributionCount,
  onRegenerateClick,
  onExportClick,
}: NotesToolbarProps) {
  const { toggleNotes, isSavedNotes } = useDemoStore()
  const { user } = useAuth()
  const { activeMembership } = useActiveSchool()
  const { canGenerate, recordGeneration } = useAIGenerationStore()

  const isSaved = isSavedNotes(chapterId, version)
  const [justSaved, setJustSaved] = useState(false)

  const regenerateState = activeMembership
    ? canGenerate(chapterId, activeMembership.role, contributionCount)
    : { allowed: false, reason: "Sign in to regenerate" }

  const handleSave = () => {
    toggleNotes(chapterId, version)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2000)
  }

  const handleRegenerate = () => {
    if (user && activeMembership && regenerateState.allowed) {
      recordGeneration(chapterId, user.name, activeMembership.role, contributionCount)
      onRegenerateClick()
    }
  }

  return (
    <div className="sticky top-0 z-50 bg-card border-2 border-border shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left - Back button */}
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/chapter/${chapterId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chapter
            </Link>
          </Button>

          {/* Center - Title */}
          <div className="flex-1 text-center min-w-0">
            <h1 className="font-serif text-lg font-bold text-ink truncate">
              Unified Notes • {chapterLabel} • {chapterTitle}
            </h1>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
              {justSaved ? "Saved!" : isSaved ? "Saved" : "Save"}
            </Button>
            <Button variant="outline" size="sm" onClick={onExportClick}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button
              size="sm"
              onClick={handleRegenerate}
              disabled={!regenerateState.allowed}
              title={regenerateState.reason || "Regenerate AI notes"}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {regenerateState.reason || "Regenerate"}
            </Button>
            <span className="px-3 py-1 bg-ai-highlight/30 rounded-full text-sm font-semibold text-ink">v{version}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
