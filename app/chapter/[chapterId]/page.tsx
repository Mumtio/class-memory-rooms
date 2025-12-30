import { Navbar } from "@/components/navbar"
import { ChapterPageContent } from "@/components/chapter-page-content"
import {
  chapters,
  getCourse,
  getSubjectByCourse,
  getContributionsByChapter,
  getNoteStackByChapter,
  getUnifiedNotesByChapter,
} from "@/lib/mock-data"
import { notFound } from "next/navigation"

interface ChapterPageProps {
  params: Promise<{
    chapterId: string
  }>
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { chapterId } = await params
  const chapter = chapters.find((ch) => ch.id === chapterId)

  if (!chapter) {
    notFound()
  }

  const course = getCourse(chapter.courseId)
  const subject = course ? getSubjectByCourse(chapter.courseId) : undefined
  const initialContributions = getContributionsByChapter(chapterId)
  const noteStackItems = getNoteStackByChapter(chapterId)
  const unifiedNotes = getUnifiedNotesByChapter(chapterId)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <ChapterPageContent
          chapterId={chapterId}
          chapter={chapter}
          course={course}
          subject={subject}
          initialContributions={initialContributions}
          noteStackItems={noteStackItems}
          unifiedNotes={unifiedNotes}
        />
      </div>
    </div>
  )
}
