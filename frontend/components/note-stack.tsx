"use client"

import type { NoteStackItem } from "@/types/models"
import { FileText, Sparkles } from "lucide-react"
import { Button } from "./ui/button"
import Link from "next/link"

interface NoteStackProps {
  items: NoteStackItem[]
  chapterId: string
  stats: {
    contributions: number
    resources: number
    photos: number
  }
}

const MARKER_COLORS: Record<string, string> = {
  R: "bg-green-100 text-green-900",
  N: "bg-blue-100 text-blue-900",
  E: "bg-orange-100 text-orange-900",
  Q: "bg-red-100 text-red-900",
  P: "bg-purple-100 text-purple-900",
  "✨": "bg-yellow-100 text-yellow-900",
}

export function NoteStack({ items, chapterId, stats }: NoteStackProps) {
  const scrollToContribution = (contributionId?: string) => {
    if (!contributionId) return
    const element = document.getElementById(`contribution-${contributionId}`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" })
      element.classList.add("ring-2", "ring-primary", "ring-offset-2")
      setTimeout(() => {
        element.classList.remove("ring-2", "ring-primary", "ring-offset-2")
      }, 2000)
    }
  }

  return (
    <div className="paper-card p-5">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-5 w-5 text-ink" />
          <h3 className="font-serif text-lg font-bold text-ink">Chapter Stash</h3>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-background/50 rounded-lg p-2">
            <div className="text-xl font-bold text-ink">{stats.contributions}</div>
            <div className="text-xs text-muted">Notes</div>
          </div>
          <div className="bg-background/50 rounded-lg p-2">
            <div className="text-xl font-bold text-ink">{stats.resources}</div>
            <div className="text-xs text-muted">Links</div>
          </div>
          <div className="bg-background/50 rounded-lg p-2">
            <div className="text-xl font-bold text-ink">{stats.photos}</div>
            <div className="text-xs text-muted">Photos</div>
          </div>
        </div>
      </div>

      {/* Stack items */}
      <div className="space-y-2 mb-4">
        {items.map((item, index) => {
          const isAI = item.kind === "ai_note_preview"
          return (
            <button
              key={item.id}
              onClick={() => scrollToContribution(item.targetContributionId)}
              disabled={isAI}
              className={`w-full text-left transition-all duration-200 hover:translate-x-1 hover:shadow-md group ${
                isAI ? "cursor-default" : "cursor-pointer"
              }`}
              style={{
                transform: `translateX(${index * 2}px)`,
                zIndex: items.length - index,
              }}
            >
              <div
                className={`border-2 border-border rounded-lg p-3 ${
                  isAI ? "bg-ai-highlight border-dashed" : "bg-card"
                } group-hover:bg-background/80`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded ${
                        MARKER_COLORS[item.marker] || "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {item.marker}
                    </span>
                    <span className="text-xs text-muted font-mono">{item.label}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink line-clamp-2 leading-snug">{item.title}</p>
                    {isAI && (
                      <div className="flex items-center gap-1 mt-1">
                        <Sparkles className="h-3 w-3 text-yellow-600" />
                        <span className="text-xs text-yellow-700 font-medium">AI Generated</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Open Notes button */}
      <Button asChild className="w-full" size="sm">
        <Link href={`/chapter/${chapterId}/notes`}>
          <Sparkles className="h-4 w-4 mr-2" />
          Open Unified Notes
        </Link>
      </Button>
    </div>
  )
}
