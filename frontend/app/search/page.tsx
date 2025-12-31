"use client"

import { useState, Suspense } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, ExternalLink, BookOpen, FileText, Bookmark } from "lucide-react"
import { chapters, subjects, courses, contributionsByChapter, unifiedNotesByChapter } from "@/types/models"
import type { Chapter, Contribution, UnifiedNotes } from "@/types/models"
import Link from "next/link"
import { IllustrationSearch } from "@/components/illustrations/search"
import { useDemoStore } from "@/lib/demo-store"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

type SearchResult =
  | { type: "chapter"; data: Chapter; course: string; subject: string }
  | { type: "contribution"; data: Contribution; chapterTitle: string }
  | { type: "notes"; data: UnifiedNotes; chapterTitle: string; course: string }

function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search for chapters, contributions, or notes..."
        className="pl-12 h-14 text-lg paper-card"
      />
    </div>
  )
}

function SearchPageContent() {
  const [query, setQuery] = useState("")
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [contentTypes, setContentTypes] = useState<string[]>(["chapters", "contributions", "notes"])
  const [hasImage, setHasImage] = useState(false)
  const [hasLink, setHasLink] = useState(false)
  const [onlyCompiled, setOnlyCompiled] = useState(false)
  const { toggleContribution, toggleNotes, isSavedContribution, isSavedNotes } = useDemoStore()

  // Perform search
  const results: SearchResult[] = []

  if (query.trim()) {
    const lowerQuery = query.toLowerCase()

    // Search chapters
    if (contentTypes.includes("chapters")) {
      chapters.forEach((chapter) => {
        const course = courses.find((c) => c.id === chapter.courseId)
        if (!course) return

        const subject = subjects.find((s) => s.id === course.subjectId)
        if (!subject) return

        // Apply filters
        if (selectedSubjects.length > 0 && !selectedSubjects.includes(subject.id)) return
        if (selectedCourses.length > 0 && !selectedCourses.includes(course.id)) return
        if (onlyCompiled && chapter.status !== "Compiled") return

        // Match query
        const matchesTitle = chapter.title.toLowerCase().includes(lowerQuery)
        const matchesCourse = course.title.toLowerCase().includes(lowerQuery)
        const matchesSubject = subject.name.toLowerCase().includes(lowerQuery)

        if (matchesTitle || matchesCourse || matchesSubject) {
          results.push({
            type: "chapter",
            data: chapter,
            course: `${course.code} - ${course.title}`,
            subject: subject.name,
          })
        }
      })
    }

    // Search contributions
    if (contentTypes.includes("contributions")) {
      Object.entries(contributionsByChapter).forEach(([chapterId, contributions]) => {
        const chapter = chapters.find((ch) => ch.id === chapterId)
        if (!chapter) return

        const course = courses.find((c) => c.id === chapter.courseId)
        if (!course) return

        const subject = subjects.find((s) => s.id === course.subjectId)
        if (!subject) return

        // Apply filters
        if (selectedSubjects.length > 0 && !selectedSubjects.includes(subject.id)) return
        if (selectedCourses.length > 0 && !selectedCourses.includes(course.id)) return

        contributions.forEach((contrib) => {
          // Apply content filters
          if (hasImage && !contrib.image) return
          if (hasLink && !contrib.link) return

          // Match query
          const matchesContent = contrib.content?.toLowerCase().includes(lowerQuery)
          const matchesTitle = contrib.title?.toLowerCase().includes(lowerQuery)

          if (matchesContent || matchesTitle) {
            results.push({
              type: "contribution",
              data: contrib,
              chapterTitle: `${chapter.label}: ${chapter.title}`,
            })
          }
        })
      })
    }

    // Search notes
    if (contentTypes.includes("notes")) {
      Object.entries(unifiedNotesByChapter).forEach(([chapterId, noteVersions]) => {
        const chapter = chapters.find((ch) => ch.id === chapterId)
        if (!chapter) return

        const course = courses.find((c) => c.id === chapter.courseId)
        if (!course) return

        const subject = subjects.find((s) => s.id === course.subjectId)
        if (!subject) return

        // Apply filters
        if (selectedSubjects.length > 0 && !selectedSubjects.includes(subject.id)) return
        if (selectedCourses.length > 0 && !selectedCourses.includes(course.id)) return

        // Get latest version
        const latestNotes = noteVersions.reduce((latest, current) =>
          current.version > latest.version ? current : latest,
        )

        // Match query
        const matchesOverview = latestNotes.overview.some((item) => item.toLowerCase().includes(lowerQuery))
        const matchesDefinitions = latestNotes.definitions.some(
          (def) => def.term.toLowerCase().includes(lowerQuery) || def.meaning.toLowerCase().includes(lowerQuery),
        )
        const matchesConcepts = latestNotes.keyConcepts.some(
          (concept) =>
            concept.title.toLowerCase().includes(lowerQuery) || concept.explanation.toLowerCase().includes(lowerQuery),
        )

        if (matchesOverview || matchesDefinitions || matchesConcepts) {
          results.push({
            type: "notes",
            data: latestNotes,
            chapterTitle: `${chapter.label}: ${chapter.title}`,
            course: `${course.code} - ${course.title}`,
          })
        }
      })
    }
  }

  const TYPE_BADGES: Record<string, { label: string; className: string }> = {
    takeaway: { label: "Takeaway", className: "bg-blue-100 text-blue-900" },
    notes_photo: { label: "Notes Photo", className: "bg-purple-100 text-purple-900" },
    resource: { label: "Resource", className: "bg-green-100 text-green-900" },
    solved_example: { label: "Solved Example", className: "bg-orange-100 text-orange-900" },
    confusion: { label: "Confusion", className: "bg-red-100 text-red-900" },
  }

  const availableCourses = courses.filter((course) =>
    selectedSubjects.length === 0 ? true : selectedSubjects.includes(course.subjectId),
  )

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-ink mb-3">Subjects</h3>
        <div className="space-y-2">
          {subjects.map((subject) => (
            <div key={subject.id} className="flex items-center gap-2">
              <Checkbox
                id={`subject-${subject.id}`}
                checked={selectedSubjects.includes(subject.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedSubjects([...selectedSubjects, subject.id])
                  } else {
                    setSelectedSubjects(selectedSubjects.filter((id) => id !== subject.id))
                    // Clear course selections for this subject
                    const subjectCourseIds = courses.filter((c) => c.subjectId === subject.id).map((c) => c.id)
                    setSelectedCourses(selectedCourses.filter((id) => !subjectCourseIds.includes(id)))
                  }
                }}
              />
              <Label htmlFor={`subject-${subject.id}`} className="text-sm cursor-pointer">
                {subject.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-ink mb-3">Courses</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {availableCourses.map((course) => (
            <div key={course.id} className="flex items-center gap-2">
              <Checkbox
                id={`course-${course.id}`}
                checked={selectedCourses.includes(course.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedCourses([...selectedCourses, course.id])
                  } else {
                    setSelectedCourses(selectedCourses.filter((id) => id !== course.id))
                  }
                }}
              />
              <Label htmlFor={`course-${course.id}`} className="text-sm cursor-pointer">
                {course.code}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-ink mb-3">Content Type</h3>
        <div className="space-y-2">
          {[
            { id: "chapters", label: "Chapters" },
            { id: "contributions", label: "Contributions" },
            { id: "notes", label: "Unified Notes" },
          ].map((type) => (
            <div key={type.id} className="flex items-center gap-2">
              <Checkbox
                id={`type-${type.id}`}
                checked={contentTypes.includes(type.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setContentTypes([...contentTypes, type.id])
                  } else {
                    setContentTypes(contentTypes.filter((t) => t !== type.id))
                  }
                }}
              />
              <Label htmlFor={`type-${type.id}`} className="text-sm cursor-pointer">
                {type.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-ink mb-3">Filters</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox id="has-image" checked={hasImage} onCheckedChange={(checked) => setHasImage(!!checked)} />
            <Label htmlFor="has-image" className="text-sm cursor-pointer">
              Has image
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="has-link" checked={hasLink} onCheckedChange={(checked) => setHasLink(!!checked)} />
            <Label htmlFor="has-link" className="text-sm cursor-pointer">
              Has link
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="only-compiled"
              checked={onlyCompiled}
              onCheckedChange={(checked) => setOnlyCompiled(!!checked)}
            />
            <Label htmlFor="only-compiled" className="text-sm cursor-pointer">
              Only compiled chapters
            </Label>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full bg-transparent"
        onClick={() => {
          setSelectedSubjects([])
          setSelectedCourses([])
          setHasImage(false)
          setHasLink(false)
          setOnlyCompiled(false)
        }}
      >
        Clear Filters
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <aside className="hidden lg:block">
            <div className="paper-card p-6 sticky top-24">
              <h2 className="font-serif text-xl text-ink mb-6 flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </h2>
              <FilterPanel />
            </div>
          </aside>

          <div className="min-w-0">
            {/* Header with icon, title, and search */}
            <div className="mb-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0">
                  <IllustrationSearch />
                </div>
                <div>
                  <h1 className="font-serif text-4xl text-ink mb-2 text-balance">Search the Class Memory</h1>
                  <p className="text-muted text-pretty">
                    Find chapters, notes, and the best student contributions across all your classes.
                  </p>
                </div>
              </div>

              {/* Search bar */}
              <Suspense fallback={<div className="h-14 paper-card animate-pulse" />}>
                <SearchInput value={query} onChange={setQuery} />
              </Suspense>
            </div>

            {/* Results */}
            {query.trim() === "" ? (
              <div className="text-center py-16 text-muted">
                <Search className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Start typing to search across all class content</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-16 text-muted">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">No results found for "{query}"</p>
                <p className="text-sm">Try adjusting your filters or search query</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl text-ink">
                    {results.length} {results.length === 1 ? "result" : "results"}
                  </h2>
                </div>

                {results.map((result, index) => {
                  if (result.type === "chapter") {
                    const STATUS_STYLES = {
                      Collecting: "bg-yellow-100 text-yellow-900",
                      "AI Ready": "bg-blue-100 text-blue-900",
                      Compiled: "bg-green-100 text-green-900",
                    }

                    return (
                      <div
                        key={`chapter-${result.data.id}-${index}`}
                        className="paper-card p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {result.subject}
                              </Badge>
                              <span className="text-sm text-muted">{result.course}</span>
                            </div>
                            <h3 className="font-serif text-xl text-ink mb-2">
                              {result.data.label}: {result.data.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-muted mb-4">
                              <span>{result.data.contributions} contributions</span>
                              <span>•</span>
                              <span>{result.data.resources} resources</span>
                              {result.data.photos > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{result.data.photos} photos</span>
                                </>
                              )}
                            </div>
                            <div
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[result.data.status]}`}
                            >
                              {result.data.status}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button asChild size="sm">
                              <Link href={`/chapter/${result.data.id}`}>Open Chapter</Link>
                            </Button>
                            {result.data.status === "Compiled" && (
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/chapter/${result.data.id}/notes`}>Open Notes</Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  if (result.type === "contribution") {
                    const badge = TYPE_BADGES[result.data.type]
                    const isSaved = isSavedContribution(result.data.id)

                    return (
                      <div
                        key={`contribution-${result.data.id}-${index}`}
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
                            onClick={() => toggleContribution(result.data.id)}
                          >
                            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                          </Button>
                        </div>
                        {result.data.title && (
                          <h3 className="font-semibold text-lg text-ink mb-2">{result.data.title}</h3>
                        )}
                        {result.data.content && (
                          <p className="text-ink leading-relaxed mb-4 line-clamp-3">{result.data.content}</p>
                        )}
                        {result.data.link && (
                          <div className="flex items-center gap-2 text-sm text-muted mb-4">
                            <ExternalLink className="h-4 w-4" />
                            <span>{result.data.link.title}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <div className="flex items-center gap-2 text-sm text-muted">
                            <span>{result.chapterTitle}</span>
                            <span>•</span>
                            <span>{result.data.createdAt}</span>
                          </div>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/chapter/${result.data.chapterId}#contribution-${result.data.id}`}>
                              Jump to post
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )
                  }

                  if (result.type === "notes") {
                    const isSaved = isSavedNotes(result.data.chapterId, result.data.version)

                    return (
                      <div
                        key={`notes-${result.data.id}-${index}`}
                        className="paper-card p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <BookOpen className="h-5 w-5 text-muted" />
                              <Badge className="bg-[#FFE45C] text-ink">Unified Notes v{result.data.version}</Badge>
                            </div>
                            <h3 className="font-serif text-xl text-ink mb-2">{result.chapterTitle}</h3>
                            <p className="text-sm text-muted mb-4">{result.course}</p>
                            <ul className="space-y-2 mb-4">
                              {result.data.overview.slice(0, 3).map((item, i) => (
                                <li key={i} className="text-sm text-ink flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span className="flex-1">{item}</span>
                                </li>
                              ))}
                              {result.data.overview.length > 3 && (
                                <li className="text-sm text-muted italic">
                                  + {result.data.overview.length - 3} more points
                                </li>
                              )}
                            </ul>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button asChild size="sm">
                              <Link href={`/chapter/${result.data.chapterId}/notes`}>Open Notes</Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={() => toggleNotes(result.data.chapterId, result.data.version)}
                            >
                              <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                              {isSaved ? "Saved" : "Save"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return null
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="lg" className="rounded-full shadow-lg gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <div className="py-6">
                <h2 className="font-serif text-xl text-ink mb-6">Filters</h2>
                <FilterPanel />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </main>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  )
}
