"use client"

import { ChapterPageContent } from "@/components/chapter-page-content"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-store"

interface ChapterPageProps {
  params: Promise<{
    chapterId: string
  }>
}

export default function ChapterPage({ params }: ChapterPageProps) {
  const router = useRouter()
  const { user, isAuthenticated, isHydrated } = useAuth()
  const [chapterId, setChapterId] = useState<string | null>(null)
  const [chapter, setChapter] = useState<any>(null)
  const [contributions, setContributions] = useState<any[]>([])
  const [unifiedNotes, setUnifiedNotes] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Resolve params
  useEffect(() => {
    params.then(p => setChapterId(p.chapterId))
  }, [params])

  // Check authentication
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/login")
    }
  }, [isHydrated, isAuthenticated, router])

  // Fetch chapter data
  useEffect(() => {
    if (!chapterId || !isAuthenticated) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch all data in parallel for speed
        const [chapterResponse, contributionsResponse, notesResponse] = await Promise.all([
          fetch(`/api/forum/chapters/${chapterId}`),
          fetch(`/api/forum/chapters/${chapterId}/contributions`),
          fetch(`/api/forum/chapters/${chapterId}/notes`),
        ])
        
        if (!chapterResponse.ok) {
          if (chapterResponse.status === 404) {
            setError("Chapter not found")
          } else {
            setError("Failed to load chapter")
          }
          setLoading(false)
          return
        }

        const chapterData = await chapterResponse.json()
        setChapter(chapterData.chapter)

        // Handle contributions
        if (contributionsResponse.ok) {
          const contributionsData = await contributionsResponse.json()
          setContributions(contributionsData.contributions || [])
        }

        // Handle unified notes
        if (notesResponse.ok) {
          const notesData = await notesResponse.json()
          setUnifiedNotes(notesData.notes)
        }
      } catch (err) {
        console.error("Error loading chapter:", err)
        setError("Failed to load chapter")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [chapterId, isAuthenticated])

  // Show loading while hydrating
  if (!isHydrated) {
    return null
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null
  }

  // Show loading state with animation
  if (loading || !chapterId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-muted">Loading chapter...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="paper-card p-8 text-center max-w-md">
          <h2 className="font-serif text-2xl font-bold text-ink mb-2">Error</h2>
          <p className="text-muted mb-4">{error}</p>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Show chapter not found
  if (!chapter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="paper-card p-8 text-center max-w-md">
          <h2 className="font-serif text-2xl font-bold text-ink mb-2">Chapter Not Found</h2>
          <p className="text-muted mb-4">The chapter you're looking for doesn't exist.</p>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <ChapterPageContent
          chapterId={chapterId}
          chapter={chapter}
          course={chapter.course}
          subject={chapter.subject}
          initialContributions={contributions}
          noteStackItems={[]}
          unifiedNotes={unifiedNotes}
        />
      </div>
    </div>
  )
}
