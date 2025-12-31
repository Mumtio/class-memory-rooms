import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, BookOpen, ImageIcon } from "lucide-react"
import type { Chapter } from "@/types/models"

interface ChapterFolderCardProps {
  chapter: Chapter
  subjectColor?: string
}

export function ChapterFolderCard({ chapter, subjectColor = "#D6FF3F" }: ChapterFolderCardProps) {
  const isCompiled = chapter.status === "Compiled"

  return (
    <div className="paper-card p-6 relative sketch-shadow hover:shadow-lg transition-all">
      {/* Folder tab */}
      <div className="absolute -top-8 left-6">
        <div
          className="px-4 py-2 rounded-t-lg border-2 border-b-0 border-border font-semibold text-sm"
          style={{
            backgroundColor: subjectColor,
            color: "#1E1A16",
          }}
        >
          {chapter.label}
          {chapter.date && <span className="ml-2 opacity-70">• {chapter.date}</span>}
        </div>
      </div>

      {/* Status stamp */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-serif text-xl font-bold text-ink pr-4">{chapter.title}</h3>
        <div
          className={`px-3 py-1 rounded text-xs font-semibold flex-shrink-0 ${
            chapter.status === "Compiled"
              ? "bg-primary/30 text-ink"
              : chapter.status === "AI Ready"
                ? "bg-blue-100 text-blue-900"
                : "bg-orange-100 text-orange-900"
          }`}
        >
          {chapter.status}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 text-sm text-muted mb-6 pb-6 border-b border-border">
        <div className="flex items-center gap-1" title="Contributions">
          <Users className="h-4 w-4" />
          <span>{chapter.contributions}</span>
        </div>
        <div className="flex items-center gap-1" title="Resources">
          <BookOpen className="h-4 w-4" />
          <span>{chapter.resources}</span>
        </div>
        <div className="flex items-center gap-1" title="Note photos">
          <ImageIcon className="h-4 w-4" />
          <span>{chapter.photos}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <Button className="flex-1" asChild>
          <Link href={`/chapter/${chapter.id}`}>Enter Chapter</Link>
        </Button>
        <Button variant="outline" className="flex-1 bg-transparent" disabled={!isCompiled} asChild={isCompiled}>
          {isCompiled ? <Link href={`/chapter/${chapter.id}/notes`}>View Notes</Link> : <span>View Notes</span>}
        </Button>
      </div>
    </div>
  )
}
