import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen, FileText } from "lucide-react"
import type { Subject } from "@/lib/mock-data"

interface SubjectCardProps {
  subject: Subject
  schoolId: string
}

export function SubjectCard({ subject, schoolId }: SubjectCardProps) {
  return (
    <div className="paper-card p-6 relative overflow-hidden group hover:shadow-lg transition-all">
      {/* Colored corner sticker */}
      <div
        className="absolute top-0 right-0 w-16 h-16"
        style={{
          background: `linear-gradient(135deg, transparent 50%, ${subject.colorTag} 50%)`,
        }}
      />

      <h3 className="font-serif text-2xl font-bold text-ink mb-2">{subject.name}</h3>

      <div className="flex items-center gap-4 text-sm text-muted mb-4">
        <div className="flex items-center gap-1">
          <BookOpen className="h-4 w-4" />
          <span>{subject.courseCount} courses</span>
        </div>
        <div className="flex items-center gap-1">
          <FileText className="h-4 w-4" />
          <span>{subject.chapterCount} chapters</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
        <div className="px-3 py-1 bg-primary/20 rounded-full text-xs font-semibold text-ink">
          {subject.compiledCount} Compiled
        </div>
        <div className="px-3 py-1 bg-muted/20 rounded-full text-xs font-semibold text-muted">
          {subject.collectingCount} Collecting
        </div>
      </div>

      <Button className="w-full" asChild>
        <Link href={`/school/${schoolId}/subject/${subject.id}`}>
          Open Room <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}
