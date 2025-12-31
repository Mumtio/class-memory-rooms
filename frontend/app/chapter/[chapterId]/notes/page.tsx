"use client"

import { NotesPageContent } from "@/components/notes-page-content"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-store"
import type { Chapter, UnifiedNotes } from "@/types/models"
import { Sparkles, Loader2 } from "lucide-react"

interface NotesPageProps {
  params: Promise<{
    chapterId: string
  }>
}

export default function NotesPage({ params }: NotesPageProps) {
  const router = useRouter()
  const { user, isAuthenticated, isHydrated } = useAuth()
  const [chapterId, setChapterId] = useState<string | null>(null)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [initialNotes, setInitialNotes] = useState<UnifiedNotes | null>(null)
  const [allVersions, setAllVersions] = useState<UnifiedNotes[]>([])
  const [contributionCount, setContributionCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

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

  // Generate notes function
  const generateNotes = useCallback(async () => {
    if (!chapterId || !user) return
    
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/forum/chapters/${chapterId}/generate-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userRole: 'student',
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setInitialNotes(data.notes)
        setAllVersions([data.notes])
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to generate notes")
      }
    } catch (err) {
      setError("Failed to generate notes")
    } finally {
      setIsGenerating(false)
    }
  }, [chapterId, user])

  // Fetch data
  useEffect(() => {
    if (!chapterId || !isAuthenticated) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch all data in parallel for speed
        const [chapterResponse, notesResponse, contributionsResponse] = await Promise.all([
          fetch(`/api/forum/chapters/${chapterId}`),
          fetch(`/api/forum/chapters/${chapterId}/notes`),
          fetch(`/api/forum/chapters/${chapterId}/contributions`),
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

        // Handle notes
        if (notesResponse.ok) {
          const notesData = await notesResponse.json()
          setInitialNotes(notesData.notes)
          
          // Fetch all versions if available
          try {
            const versionsResponse = await fetch(`/api/forum/chapters/${chapterId}/notes/versions`)
            if (versionsResponse.ok) {
              const versionsData = await versionsResponse.json()
              setAllVersions(versionsData.versions || [])
            }
          } catch {
            // Versions endpoint may not exist, that's ok
          }
        }

        // Handle contributions count
        if (contributionsResponse.ok) {
          const contributionsData = await contributionsResponse.json()
          setContributionCount(contributionsData.contributions?.length || 0)
        }
      } catch (err) {
        console.error("Error loading notes page:", err)
        setError("Failed to load notes")
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

  // Show loading state with nice animation
  if (loading || !chapterId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-muted">Loading notes...</p>
        </div>
      </div>
    )
  }

  // Show generating state
  if (isGenerating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            <Sparkles className="absolute inset-0 m-auto h-10 w-10 text-primary animate-pulse" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-ink mb-3">Generating Unified Notes</h2>
          <p className="text-muted mb-2">
            AI is compiling contributions into comprehensive study notes...
          </p>
          <p className="text-sm text-muted/70">This may take a few moments</p>
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

  // If no notes exist, show option to generate
  if (!initialNotes && !isGenerating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="paper-card p-12 text-center max-w-md">
          <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold text-ink mb-3">No Notes Yet</h2>
          <p className="text-muted mb-6">
            {contributionCount >= 2 
              ? "Ready to generate AI-compiled study notes from contributions!"
              : `Need at least 2 contributions to generate notes. Currently have ${contributionCount}.`}
          </p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => router.push(`/chapter/${chapterId}`)}
              className="px-4 py-2 border-2 border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              Back to Chapter
            </button>
            {contributionCount >= 2 && (
              <button 
                onClick={generateNotes}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Generate Notes
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NotesPageContent
        chapterId={chapterId}
        chapter={chapter}
        allVersions={allVersions}
        initialNotes={initialNotes || undefined}
        contributionCount={contributionCount}
      />
    </div>
  )
}
