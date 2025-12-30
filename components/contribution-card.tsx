"use client"

import type { Contribution } from "@/lib/mock-data"
import { MessageSquare, ThumbsUp, Bookmark, ExternalLink, ImageIcon, ChevronDown } from "lucide-react"
import { Button } from "./ui/button"
import { useState } from "react"
import { useDemoStore } from "@/lib/demo-store"

interface ContributionCardProps {
  contribution: Contribution
  onHelpful?: () => void
  onReply?: () => void
}

const TYPE_BADGES: Record<string, { label: string; className: string }> = {
  takeaway: { label: "Takeaway", className: "bg-blue-100 text-blue-900" },
  notes_photo: { label: "Notes Photo", className: "bg-purple-100 text-purple-900" },
  resource: { label: "Resource", className: "bg-green-100 text-green-900" },
  solved_example: { label: "Solved Example", className: "bg-orange-100 text-orange-900" },
  confusion: { label: "Confusion", className: "bg-red-100 text-red-900" },
}

export function ContributionCard({ contribution, onHelpful, onReply }: ContributionCardProps) {
  const [showReplies, setShowReplies] = useState(false)
  const badge = TYPE_BADGES[contribution.type]
  const { toggleContribution, isSavedContribution } = useDemoStore()
  const isSaved = isSavedContribution(contribution.id)

  return (
    <div
      id={`contribution-${contribution.id}`}
      className="paper-card p-6 hover:shadow-lg transition-all duration-200 hover:-rotate-[0.3deg] relative"
    >
      {/* Paper clip decoration */}
      <div className="absolute -top-3 right-8 w-8 h-12 border-2 border-border rounded-full opacity-40" />

      {/* Type badge */}
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badge.className}`}>{badge.label}</span>
        {/* Wire up save toggle */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleContribution(contribution.id)}>
          <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
        </Button>
      </div>

      {/* Title */}
      {contribution.title && <h3 className="font-semibold text-lg text-ink mb-2">{contribution.title}</h3>}

      {/* Content */}
      {contribution.content && (
        <p className="text-ink leading-relaxed mb-4 whitespace-pre-line">{contribution.content}</p>
      )}

      {/* Link preview */}
      {contribution.link && (
        <a
          href={contribution.link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block border-2 border-border rounded-lg p-4 mb-4 hover:bg-muted/20 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="font-semibold text-ink mb-1">{contribution.link.title}</p>
              <p className="text-sm text-muted">{new URL(contribution.link.url).hostname}</p>
            </div>
            <ExternalLink className="h-5 w-5 text-muted flex-shrink-0" />
          </div>
        </a>
      )}

      {/* Image placeholder */}
      {contribution.image && (
        <div className="border-2 border-border border-dashed rounded-lg p-8 mb-4 flex flex-col items-center justify-center bg-muted/10">
          <ImageIcon className="h-12 w-12 text-muted mb-3" />
          <p className="text-sm text-muted mb-2">{contribution.image.alt}</p>
          <Button size="sm" variant="outline">
            Open Image
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="font-medium">{contribution.authorName}</span>
          <span>•</span>
          <span>{contribution.createdAt}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onHelpful} className="gap-1.5">
            <ThumbsUp className="h-4 w-4" />
            Helpful ({contribution.helpfulCount})
          </Button>
          <Button variant="ghost" size="sm" onClick={onReply} className="gap-1.5">
            <MessageSquare className="h-4 w-4" />
            Reply {contribution.replies && contribution.replies.length > 0 && `(${contribution.replies.length})`}
          </Button>
        </div>
      </div>

      {/* Replies section */}
      {contribution.replies && contribution.replies.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-2 text-sm font-medium text-muted hover:text-ink transition-colors"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showReplies ? "rotate-180" : ""}`} />
            {showReplies ? "Hide" : "Show"} {contribution.replies.length}{" "}
            {contribution.replies.length === 1 ? "reply" : "replies"}
          </button>

          {showReplies && (
            <div className="mt-3 space-y-3 pl-4 border-l-2 border-border">
              {contribution.replies.map((reply) => (
                <div key={reply.id} className="bg-background/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <span className="font-medium text-ink">{reply.anonymous ? "Anonymous Student" : reply.author}</span>
                    <span className="text-muted">•</span>
                    <span className="text-muted">{reply.createdAt}</span>
                  </div>
                  <p className="text-sm text-ink leading-relaxed">{reply.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
