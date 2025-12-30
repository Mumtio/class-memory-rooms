import { NotesPageContent } from "@/components/notes-page-content"
import { chapters, getUnifiedNotesByChapter, unifiedNotesByChapter, contributionsByChapter } from "@/lib/mock-data"
import { notFound } from "next/navigation"

interface NotesPageProps {
  params: Promise<{
    chapterId: string
  }>
}

export default async function NotesPage({ params }: NotesPageProps) {
  const { chapterId } = await params
  const chapter = chapters.find((ch) => ch.id === chapterId)

  if (!chapter) {
    notFound()
  }

  // Get all versions for this chapter
  const allVersions = unifiedNotesByChapter[chapterId] || []
  const initialNotes = getUnifiedNotesByChapter(chapterId)

  const contributions = contributionsByChapter[chapterId] || []
  const contributionCount = contributions.length

  return (
    <div className="min-h-screen bg-background">
      <NotesPageContent
        chapterId={chapterId}
        chapter={chapter}
        allVersions={allVersions}
        initialNotes={initialNotes}
        contributionCount={contributionCount}
      />
    </div>
  )
}
