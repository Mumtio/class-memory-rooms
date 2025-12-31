import { NotesPageContent } from "@/components/notes-page-content"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

interface NotesPageProps {
  params: Promise<{
    chapterId: string
  }>
}

export default async function NotesPage({ params }: NotesPageProps) {
  const { chapterId } = await params
  
  // Check authentication
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    notFound()
  }

  try {
    // Fetch chapter details from API
    const chapterResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/forum/chapters/${chapterId}`, {
      headers: {
        'Cookie': `next-auth.session-token=${session.user.id}` // Pass session
      },
      cache: 'no-store'
    })

    if (!chapterResponse.ok) {
      notFound()
    }

    const chapterData = await chapterResponse.json()
    const chapter = chapterData.chapter

    // Fetch notes from API
    const notesResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/forum/chapters/${chapterId}/notes`, {
      headers: {
        'Cookie': `next-auth.session-token=${session.user.id}`
      },
      cache: 'no-store'
    })

    let initialNotes = null
    let allVersions = []
    
    if (notesResponse.ok) {
      const notesData = await notesResponse.json()
      initialNotes = notesData.notes
      
      // Fetch all versions if available
      const versionsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/forum/chapters/${chapterId}/notes/versions`, {
        headers: {
          'Cookie': `next-auth.session-token=${session.user.id}`
        },
        cache: 'no-store'
      })
      
      if (versionsResponse.ok) {
        const versionsData = await versionsResponse.json()
        allVersions = versionsData.versions || []
      }
    }

    // Fetch contributions to get count
    const contributionsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/forum/chapters/${chapterId}/contributions`, {
      headers: {
        'Cookie': `next-auth.session-token=${session.user.id}`
      },
      cache: 'no-store'
    })

    let contributionCount = 0
    if (contributionsResponse.ok) {
      const contributionsData = await contributionsResponse.json()
      contributionCount = contributionsData.contributions?.length || 0
    }

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
  } catch (error) {
    console.error('Error loading notes page:', error)
    notFound()
  }
}
