import { ChapterPageContent } from "@/components/chapter-page-content"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

interface ChapterPageProps {
  params: Promise<{
    chapterId: string
  }>
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { chapterId } = await params
  
  // Check authentication
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    notFound()
  }

  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    // Fetch chapter details
    const chapterResponse = await fetch(`${baseUrl}/api/forum/chapters/${chapterId}`, {
      cache: 'no-store'
    })

    if (!chapterResponse.ok) {
      notFound()
    }

    const chapterData = await chapterResponse.json()
    const chapter = chapterData.chapter

    // Fetch contributions
    const contributionsResponse = await fetch(`${baseUrl}/api/forum/chapters/${chapterId}/contributions`, {
      cache: 'no-store'
    })

    let initialContributions = []
    if (contributionsResponse.ok) {
      const contributionsData = await contributionsResponse.json()
      initialContributions = contributionsData.contributions || []
    }

    // Fetch unified notes if available
    const notesResponse = await fetch(`${baseUrl}/api/forum/chapters/${chapterId}/notes`, {
      cache: 'no-store'
    })

    let unifiedNotes = null
    if (notesResponse.ok) {
      const notesData = await notesResponse.json()
      unifiedNotes = notesData.notes
    }

    // Note: course and subject data should come from chapter metadata
    // For now, we'll pass undefined and let the component handle it
    const course = chapter.course || undefined
    const subject = chapter.subject || undefined
    
    // Note stack items would need to be generated from contributions
    // For now, pass empty array
    const noteStackItems = []

    return (
      <div className="min-h-screen bg-background">
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
  } catch (error) {
    console.error('Error loading chapter page:', error)
    notFound()
  }
}
