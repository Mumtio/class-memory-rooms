"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bookmark, ExternalLink, BookOpen, LinkIcon } from "lucide-react"
import { useDemoStore } from "@/lib/demo-store"
import { contributionsByChapter, unifiedNotesByChapter, chapters, courses, type Contribution } from "@/types/models"
import Link from "next/link"
import { IllustrationEmptyShelf } from "@/components/illustrations/empty-shelf"

export default function SavedPage() {
  const { state, toggleContribution, toggleNotes, isSavedContribution, isSavedNotes } = useDemoStore()

  // Get saved contributions
  const savedContributions: Array<{ contribution: Contribution; chapterTitle: string; chapterId: string }> = []
  state.savedContributionIds.forEach((contribId) => {
    Object.entries(contributionsByChapter).forEach(([chapterId, contribs]) => {
      const contrib = contribs.find((c) => c.id === contribId)
      if (contrib) {
        const chapter = chapters.find((ch) => ch.id === chapterId)
        savedContributions.push({
          contribution: contrib,
          chapterTitle: chapter ? `${chapter.label}: ${chapter.title}` : "Unknown Chapter",
          chapterId,
        })
      }
    })
  })

  // Get saved notes
  const savedNotes = state.savedChapterNotes
    .map((item) => {
      const notes = unifiedNotesByChapter[item.chapterId]?.find((n) => n.version === item.version)
      const chapter = chapters.find((ch) => ch.id === item.chapterId)
      const course = courses.find((c) => c.id === chapter?.courseId)
      return {
        notes,
        chapterId: item.chapterId,
        chapterTitle: chapter ? `${chapter.label}: ${chapter.title}` : "Unknown Chapter",
        course: course ? `${course.code} - ${course.title}` : "",
      }
    })
    .filter((item) => item.notes)

  // Extract resources from saved contributions
  const savedResources = savedContributions
    .filter((item) => item.contribution.link)
    .map((item) => ({
      contribution: item.contribution,
      chapterTitle: item.chapterTitle,
      chapterId: item.chapterId,
    }))

  const TYPE_BADGES: Record<string, { label: string; className: string }> = {
    takeaway: { label: "Takeaway", className: "bg-blue-100 text-blue-900" },
    notes_photo: { label: "Notes Photo", className: "bg-purple-100 text-purple-900" },
    resource: { label: "Resource", className: "bg-green-100 text-green-900" },
    solved_example: { label: "Solved Example", className: "bg-orange-100 text-orange-900" },
    confusion: { label: "Confusion", className: "bg-red-100 text-red-900" },
  }

  const EmptyState = ({ title, description }: { title: string; description: string }) => (
    <div className="text-center py-16">
      <div className="flex justify-center mb-6">
        <IllustrationEmptyShelf />
      </div>
      <h3 className="font-serif text-2xl text-ink mb-3">{title}</h3>
      <p className="text-muted mb-6 max-w-md mx-auto text-pretty">{description}</p>
      <Button asChild>
        <Link href="/school/demo">Browse Chapters</Link>
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="font-serif text-5xl text-ink mb-3">Saved</h1>
            <p className="text-lg text-muted">Your personal collection of the best notes and resources</p>
          </div>

          <Tabs defaultValue="contributions" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="contributions">Contributions ({savedContributions.length})</TabsTrigger>
              <TabsTrigger value="notes">Notes ({savedNotes.length})</TabsTrigger>
              <TabsTrigger value="resources">Resources ({savedResources.length})</TabsTrigger>
            </TabsList>

            {/* Contributions Tab */}
            <TabsContent value="contributions">
              {savedContributions.length === 0 ? (
                <EmptyState
                  title="No saved contributions yet"
                  description="Save the best student explanations, examples, and resources to build your personal study library."
                />
              ) : (
                <div className="space-y-4">
                  {savedContributions.map((item, index) => {
                    const badge = TYPE_BADGES[item.contribution.type]
                    return (
                      <div
                        key={`${item.contribution.id}-${index}`}
                        className="paper-card p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badge.className}`}>
                            {badge.label}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleContribution(item.contribution.id)}
                          >
                            <Bookmark className="h-4 w-4 fill-current" />
                          </Button>
                        </div>

                        {item.contribution.title && (
                          <h3 className="font-semibold text-lg text-ink mb-2">{item.contribution.title}</h3>
                        )}

                        {item.contribution.content && (
                          <p className="text-ink leading-relaxed mb-4 line-clamp-2">{item.contribution.content}</p>
                        )}

                        {item.contribution.link && (
                          <div className="flex items-center gap-2 text-sm text-muted mb-4">
                            <ExternalLink className="h-4 w-4" />
                            <span>{item.contribution.link.title}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <div className="text-sm text-muted">{item.chapterTitle}</div>
                          <div className="flex gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/chapter/${item.chapterId}#contribution-${item.contribution.id}`}>Open</Link>
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => toggleContribution(item.contribution.id)}>
                              Unsave
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes">
              {savedNotes.length === 0 ? (
                <EmptyState
                  title="No saved notes yet"
                  description="Save your favorite AI-compiled study notes to review them anytime without searching."
                />
              ) : (
                <div className="space-y-4">
                  {savedNotes.map((item, index) => (
                    <div
                      key={`${item.chapterId}-${index}`}
                      className="paper-card p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <BookOpen className="h-5 w-5 text-muted" />
                            <Badge className="bg-[#FFE45C] text-ink">Unified Notes v{item.notes!.version}</Badge>
                          </div>
                          <h3 className="font-serif text-xl text-ink mb-2">{item.chapterTitle}</h3>
                          <p className="text-sm text-muted mb-4">{item.course}</p>
                          <p className="text-sm text-ink-muted">
                            {item.notes!.definitions.length} definitions • {item.notes!.keyConcepts.length} key concepts
                            • {item.notes!.formulas.length} formulas
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button asChild size="sm">
                            <Link href={`/chapter/${item.chapterId}/notes`}>Open Notes</Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleNotes(item.chapterId, item.notes!.version)}
                          >
                            Unsave
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources">
              {savedResources.length === 0 ? (
                <EmptyState
                  title="No saved resources yet"
                  description="Save helpful links and resources shared by classmates to build your own reference library."
                />
              ) : (
                <div className="space-y-4">
                  {savedResources.map((item, index) => (
                    <div
                      key={`${item.contribution.id}-${index}`}
                      className="paper-card p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-muted/20 border-2 border-border flex items-center justify-center flex-shrink-0">
                          <LinkIcon className="h-6 w-6 text-muted" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-ink mb-1">{item.contribution.link!.title}</h3>
                          <p className="text-sm text-muted mb-2">{new URL(item.contribution.link!.url).hostname}</p>
                          {item.contribution.content && (
                            <p className="text-sm text-ink-muted mb-3 line-clamp-2">{item.contribution.content}</p>
                          )}
                          <p className="text-xs text-muted">{item.chapterTitle}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button asChild size="sm">
                            <a href={item.contribution.link!.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open
                            </a>
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => toggleContribution(item.contribution.id)}>
                            Unsave
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
