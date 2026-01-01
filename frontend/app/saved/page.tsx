"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, BookOpen, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IllustrationEmptyShelf } from "@/components/illustrations/empty-shelf"
import { useDemoStore } from "@/lib/demo-store"
import { useEffect, useState } from "react"

interface SavedContribution {
  id: string
  title: string
  content: string
  type: string
  chapterId: string
  chapterName: string
  authorName: string
}

interface SavedNote {
  chapterId: string
  chapterName: string
  version: number
  generatedAt: string
}

export default function SavedPage() {
  const router = useRouter()
  const { state } = useDemoStore()
  const [savedContributions, setSavedContributions] = useState<SavedContribution[]>([])
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSavedItems() {
      setLoading(true)
      
      // Fetch saved contributions
      const contributions: SavedContribution[] = []
      for (const contributionId of state.savedContributionIds) {
        try {
          const res = await fetch(`/api/forum/contributions/${contributionId}`)
          if (res.ok) {
            const data = await res.json()
            contributions.push({
              id: data.id,
              title: data.title || 'Untitled',
              content: data.content || '',
              type: data.type || 'contribution',
              chapterId: data.chapterId || '',
              chapterName: data.chapterName || 'Unknown Chapter',
              authorName: data.authorName || 'Unknown',
            })
          }
        } catch (error) {
          console.error(`Failed to fetch contribution ${contributionId}:`, error)
        }
      }
      setSavedContributions(contributions)

      // Fetch saved notes
      const notes: SavedNote[] = []
      for (const savedNote of state.savedChapterNotes) {
        try {
          const res = await fetch(`/api/forum/chapters/${savedNote.chapterId}`)
          if (res.ok) {
            const data = await res.json()
            notes.push({
              chapterId: savedNote.chapterId,
              chapterName: data.chapter?.title || 'Unknown Chapter',
              version: savedNote.version,
              generatedAt: new Date().toISOString(),
            })
          }
        } catch (error) {
          console.error(`Failed to fetch chapter ${savedNote.chapterId}:`, error)
        }
      }
      setSavedNotes(notes)
      
      setLoading(false)
    }

    fetchSavedItems()
  }, [state.savedContributionIds, state.savedChapterNotes])

  const hasItems = savedContributions.length > 0 || savedNotes.length > 0

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="font-serif text-5xl text-ink mb-3">Saved</h1>
            <p className="text-lg text-muted">Your personal collection of the best notes and resources</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !hasItems ? (
            <div className="text-center py-16">
              <div className="flex justify-center mb-6">
                <IllustrationEmptyShelf />
              </div>
              <h3 className="font-serif text-2xl text-ink mb-3">No saved items yet</h3>
              <p className="text-muted mb-6 max-w-md mx-auto text-pretty">
                Save the best student explanations, examples, and resources to build your personal study library.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Saved Notes Section */}
              {savedNotes.length > 0 && (
                <section>
                  <h2 className="font-serif text-2xl text-ink mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Saved Notes
                  </h2>
                  <div className="grid gap-4">
                    {savedNotes.map((note) => (
                      <div key={`${note.chapterId}-${note.version}`} className="paper-card p-5 hover:shadow-md transition-shadow">
                        <h3 className="text-lg font-medium text-ink mb-2">{note.chapterName}</h3>
                        <p className="text-sm text-muted mb-3">Version {note.version}</p>
                        <Button asChild size="sm">
                          <Link href={`/chapter/${note.chapterId}/notes`}>View Notes</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Saved Contributions Section */}
              {savedContributions.length > 0 && (
                <section>
                  <h2 className="font-serif text-2xl text-ink mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Saved Contributions
                  </h2>
                  <div className="grid gap-4">
                    {savedContributions.map((contribution) => (
                      <div key={contribution.id} className="paper-card p-5 hover:shadow-md transition-shadow">
                        <h3 className="text-lg font-medium text-ink mb-2">{contribution.title}</h3>
                        <p className="text-sm text-muted mb-1">
                          {contribution.chapterName} • by {contribution.authorName}
                        </p>
                        <p className="text-sm text-muted mb-3 line-clamp-2">
                          {contribution.content}
                        </p>
                        <Button asChild size="sm">
                          <Link href={`/chapter/${contribution.chapterId}`}>View Chapter</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
