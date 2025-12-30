"use client"

import { Button } from "@/components/ui/button"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { ContributionCard } from "@/components/contribution-card"
import { NoteStack } from "@/components/note-stack"
import { ContributionComposerModal } from "@/components/contribution-composer-modal"
import { UnifiedNotesPreview } from "@/components/unified-notes-preview"
import type {
  Chapter,
  Course,
  Subject,
  Contribution,
  ContributionType,
  NoteStackItem,
  UnifiedNotes,
} from "@/lib/mock-data"
import { Bookmark, Share2, Sparkles, Filter } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useDemoStore } from "@/lib/demo-store"
import { useAuth } from "@/lib/auth-store"
import { useAIGenerationStore } from "@/lib/ai-generation-store"
import { useActiveSchool } from "@/lib/active-school-context"

interface ChapterPageContentProps {
  chapterId: string
  chapter: Chapter
  course: Course | undefined
  subject: Subject | undefined
  initialContributions: Contribution[]
  noteStackItems: NoteStackItem[]
  unifiedNotes: UnifiedNotes | undefined
}

type TabType = "contributions" | "notes" | "resources"

export function ChapterPageContent({
  chapterId,
  chapter,
  course,
  subject,
  initialContributions,
  noteStackItems,
  unifiedNotes,
}: ChapterPageContentProps) {
  const { addActivity } = useDemoStore()
  const { user } = useAuth()
  const { activeMembership } = useActiveSchool()
  const { canGenerate, recordGeneration, getLastGeneration } = useAIGenerationStore()

  const [activeTab, setActiveTab] = useState<TabType>("contributions")
  const [contributions, setContributions] = useState<Contribution[]>(initialContributions)
  const [composerOpen, setComposerOpen] = useState(false)
  const [resourceFilter, setResourceFilter] = useState<string>("all")
  const [shareToast, setShareToast] = useState(false)

  const breadcrumbItems = [
    { label: "School", href: `/school/demo` },
    { label: subject?.name || "Subject", href: `/school/demo/subject/${subject?.id}` },
    { label: course?.code || "Course", href: `/course/${course?.id}` },
    { label: chapter.label, href: `/chapter/${chapterId}` },
  ]

  const handleAddContribution = (data: {
    type: ContributionType
    title?: string
    content?: string
    link?: { url: string; title: string }
    anonymous: boolean
  }) => {
    const newContribution: Contribution = {
      id: `cont-new-${crypto.randomUUID()}`,
      chapterId,
      type: data.type,
      title: data.title,
      content: data.content,
      link: data.link,
      anonymous: data.anonymous,
      authorName: data.anonymous ? "Anonymous Student" : "You",
      createdAt: "Just now",
      helpfulCount: 0,
      replies: [],
    }

    setContributions([newContribution, ...contributions])
  }

  const resourceContributions = contributions.filter(
    (c) => c.type === "resource" || c.type === "notes_photo" || c.link || c.image,
  )

  const filteredResources =
    resourceFilter === "all"
      ? resourceContributions
      : resourceFilter === "links"
        ? resourceContributions.filter((c) => c.link)
        : resourceFilter === "photos"
          ? resourceContributions.filter((c) => c.image)
          : resourceContributions

  const contributionCount = contributions.length
  const generationState = activeMembership
    ? canGenerate(chapterId, activeMembership.role, contributionCount)
    : { allowed: false, reason: "Sign in to generate notes" }

  const handleGenerateNotes = () => {
    if (user && activeMembership && generationState.allowed) {
      recordGeneration(chapterId, user.name, activeMembership.role, contributionCount)
      window.location.href = `/chapter/${chapterId}/notes`
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: `${chapter.label}: ${chapter.title}`,
      text: `Check out this chapter from ${course?.code}`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log("[v0] Share cancelled")
      }
    } else {
      // Fallback: copy link
      navigator.clipboard.writeText(window.location.href)
      setShareToast(true)
      setTimeout(() => setShareToast(false), 2000)
    }
  }

  useEffect(() => {
    addActivity({ type: "chapter", chapterId })
  }, [chapterId]) // Only track activity when chapterId changes, not when addActivity function reference changes

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div className="mt-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-block px-3 py-1.5 bg-primary/20 border-2 border-primary rounded-lg text-sm font-bold text-ink">
                {chapter.label}
              </span>
              <span
                className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold ${
                  chapter.status === "Compiled"
                    ? "bg-primary/30 text-ink"
                    : chapter.status === "AI Ready"
                      ? "bg-blue-100 text-blue-900"
                      : "bg-orange-100 text-orange-900"
                }`}
              >
                {chapter.status}
              </span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink mb-2">{chapter.title}</h1>
            <p className="text-muted">
              {course?.term} • {course?.section && `Section ${course.section} • `}
              {course?.teacher} • Last updated 2h ago
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button onClick={() => setComposerOpen(true)} size="lg">
              Add Contribution
            </Button>
            <Button
              variant="outline"
              size="lg"
              disabled={!generationState.allowed}
              title={generationState.reason || "Generate AI study notes"}
              onClick={handleGenerateNotes}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {generationState.reason || "Generate Unified Notes"}
            </Button>
            <Button variant="ghost" size="icon">
              <Bookmark className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare} title="Share this chapter">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="mb-6 border-b-2 border-border">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("contributions")}
            className={`px-6 py-3 font-semibold transition-all relative ${
              activeTab === "contributions"
                ? "text-ink bg-card border-2 border-b-0 border-border rounded-t-lg"
                : "text-muted hover:text-ink"
            }`}
          >
            Contributions
            {activeTab === "contributions" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`px-6 py-3 font-semibold transition-all relative ${
              activeTab === "notes"
                ? "text-ink bg-card border-2 border-b-0 border-border rounded-t-lg"
                : "text-muted hover:text-ink"
            }`}
          >
            Unified Notes
            {activeTab === "notes" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
          <button
            onClick={() => setActiveTab("resources")}
            className={`px-6 py-3 font-semibold transition-all relative ${
              activeTab === "resources"
                ? "text-ink bg-card border-2 border-b-0 border-border rounded-t-lg"
                : "text-muted hover:text-ink"
            }`}
          >
            Resources
            {activeTab === "resources" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Main feed */}
        <div className="lg:col-span-2 space-y-4">
          {activeTab === "contributions" && (
            <>
              {contributions.length === 0 ? (
                <div className="paper-card p-12 text-center">
                  <p className="text-muted mb-4">No contributions yet. Be the first to share!</p>
                  <Button onClick={() => setComposerOpen(true)}>Add First Contribution</Button>
                </div>
              ) : (
                contributions.map((contribution) => (
                  <ContributionCard
                    key={contribution.id}
                    contribution={contribution}
                    onHelpful={() => console.log("[v0] Helpful clicked")}
                    onReply={() => console.log("[v0] Reply clicked")}
                    onSave={() => console.log("[v0] Save clicked")}
                  />
                ))
              )}
            </>
          )}

          {activeTab === "notes" && (
            <>
              {unifiedNotes ? (
                <UnifiedNotesPreview chapterId={chapterId} notes={unifiedNotes} />
              ) : (
                <div className="paper-card p-12 text-center">
                  <Sparkles className="h-16 w-16 text-ai-highlight mx-auto mb-4" />
                  <h2 className="font-serif text-2xl font-bold text-ink mb-3">Unified Notes Coming Soon</h2>
                  <p className="text-muted mb-6">
                    AI will compile all contributions into a comprehensive study guide. Check back when this chapter
                    reaches "Compiled" status!
                  </p>
                  <Button asChild>
                    <Link href={`/chapter/${chapterId}`}>Back to Contributions</Link>
                  </Button>
                </div>
              )}
            </>
          )}

          {activeTab === "resources" && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-muted" />
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setResourceFilter("all")}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      resourceFilter === "all" ? "bg-primary text-ink" : "bg-muted/50 text-muted hover:bg-muted"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setResourceFilter("links")}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      resourceFilter === "links" ? "bg-primary text-ink" : "bg-muted/50 text-muted hover:bg-muted"
                    }`}
                  >
                    Links
                  </button>
                  <button
                    onClick={() => setResourceFilter("photos")}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      resourceFilter === "photos" ? "bg-primary text-ink" : "bg-muted/50 text-muted hover:bg-muted"
                    }`}
                  >
                    Note Photos
                  </button>
                </div>
              </div>

              {filteredResources.length === 0 ? (
                <div className="paper-card p-12 text-center">
                  <p className="text-muted">No resources found.</p>
                </div>
              ) : (
                filteredResources.map((contribution) => (
                  <ContributionCard
                    key={contribution.id}
                    contribution={contribution}
                    onHelpful={() => console.log("[v0] Helpful clicked")}
                    onReply={() => console.log("[v0] Reply clicked")}
                    onSave={() => console.log("[v0] Save clicked")}
                  />
                ))
              )}
            </>
          )}
        </div>

        {/* Right column - NoteStack (sticky on desktop) */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <NoteStack
            items={noteStackItems}
            chapterId={chapterId}
            stats={{
              contributions: chapter.contributions,
              resources: chapter.resources,
              photos: chapter.photos,
            }}
          />
        </div>
      </div>

      {/* Contribution composer modal */}
      <ContributionComposerModal open={composerOpen} onOpenChange={setComposerOpen} onSubmit={handleAddContribution} />

      {/* Share toast notification */}
      {shareToast && (
        <div className="fixed bottom-8 right-8 bg-ink text-card px-6 py-3 rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-bottom-5">
          Link copied to clipboard!
        </div>
      )}
    </>
  )
}
