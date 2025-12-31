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
} from "@/types/models"
import { Bookmark, Share2, Sparkles, Filter, Loader2 } from "lucide-react"
import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  const router = useRouter()
  const { addActivity } = useDemoStore()
  const { user } = useAuth()
  const { activeMembership } = useActiveSchool()
  const { canGenerate, recordGeneration, getLastGeneration } = useAIGenerationStore()
  const [isPending, startTransition] = useTransition()

  const [activeTab, setActiveTab] = useState<TabType>("contributions")
  const [contributions, setContributions] = useState<Contribution[]>(initialContributions)
  const [composerOpen, setComposerOpen] = useState(false)
  const [resourceFilter, setResourceFilter] = useState<string>("all")
  const [shareToast, setShareToast] = useState(false)
  const [likedContributions, setLikedContributions] = useState<Set<string>>(new Set())
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [currentNotes, setCurrentNotes] = useState<UnifiedNotes | undefined>(unifiedNotes)

  const breadcrumbItems = [
    { label: "School", href: `/school/demo` },
    { label: subject?.name || "Subject", href: `/school/demo/subject/${subject?.id}` },
    { label: course?.code || "Course", href: `/course/${course?.id}` },
    { label: chapter.label, href: `/chapter/${chapterId}` },
  ]

  const handleLikeContribution = async (contributionId: string) => {
    if (!user) return

    const isLiked = likedContributions.has(contributionId)
    
    try {
      if (isLiked) {
        // Unlike
        await fetch(`/api/forum/posts/${contributionId}/helpful?userId=${user.id}`, {
          method: 'DELETE',
        })
        setLikedContributions(prev => {
          const next = new Set(prev)
          next.delete(contributionId)
          return next
        })
        // Update local count
        setContributions(prev => prev.map(c => 
          c.id === contributionId ? { ...c, helpfulCount: Math.max(0, (c.helpfulCount || 0) - 1) } : c
        ))
      } else {
        // Like
        await fetch(`/api/forum/posts/${contributionId}/helpful`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        })
        setLikedContributions(prev => new Set(prev).add(contributionId))
        // Update local count
        setContributions(prev => prev.map(c => 
          c.id === contributionId ? { ...c, helpfulCount: (c.helpfulCount || 0) + 1 } : c
        ))
      }
    } catch (err) {
      console.error("Error toggling like:", err)
    }
  }

  const handleAddContribution = async (data: {
    type: ContributionType
    title?: string
    content?: string
    link?: { url: string; title: string }
    image?: { url: string; alt: string }
    anonymous: boolean
  }) => {
    // Create contribution via API
    try {
      const response = await fetch(`/api/forum/chapters/${chapterId}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: data.type,
          title: data.title,
          content: data.content || '',
          imageUrl: data.image?.url,
          links: data.link ? [data.link.url] : [],
          anonymous: data.anonymous,
          userId: user?.id,
          authorName: user?.name,
        }),
      })

      if (!response.ok) {
        console.error('Failed to create contribution')
        return
      }

      // Add to local state for immediate feedback
      const newContribution: Contribution = {
        id: `cont-new-${crypto.randomUUID()}`,
        chapterId,
        type: data.type,
        title: data.title,
        content: data.content,
        link: data.link,
        image: data.image,
        anonymous: data.anonymous,
        authorName: data.anonymous ? "Anonymous Student" : (user?.name || "You"),
        createdAt: "Just now",
        helpfulCount: 0,
        replies: [],
      }

      setContributions([newContribution, ...contributions])
    } catch (error) {
      console.error('Error creating contribution:', error)
    }
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

  const handleGenerateNotes = async () => {
    if (!user || !activeMembership || !generationState.allowed) return
    
    setIsGenerating(true)
    setGenerationError(null)
    setActiveTab("notes") // Switch to notes tab to show loading
    
    try {
      const response = await fetch(`/api/forum/chapters/${chapterId}/generate-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userRole: activeMembership.role,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        recordGeneration(chapterId, user.name, activeMembership.role, contributionCount)
        setCurrentNotes(data.notes)
      } else {
        const error = await response.json()
        setGenerationError(error.error || "Failed to generate notes")
      }
    } catch (err) {
      setGenerationError("Failed to generate notes. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleViewNotes = () => {
    if (currentNotes) {
      startTransition(() => {
        router.push(`/chapter/${chapterId}/notes`)
      })
    } else {
      // No notes exist, trigger generation
      handleGenerateNotes()
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
              disabled={!generationState.allowed || isGenerating}
              title={generationState.reason || "Generate AI study notes"}
              onClick={handleGenerateNotes}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {isGenerating ? "Generating..." : (generationState.reason || "Generate Unified Notes")}
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
                    onHelpful={() => handleLikeContribution(contribution.id)}
                    onReply={() => console.log("[v0] Reply clicked")}
                    onSave={() => console.log("[v0] Save clicked")}
                  />
                ))
              )}
            </>
          )}

          {activeTab === "notes" && (
            <>
              {isGenerating ? (
                <div className="paper-card p-12 text-center">
                  <div className="relative mx-auto w-24 h-24 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    <Sparkles className="absolute inset-0 m-auto h-10 w-10 text-primary animate-pulse" />
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-ink mb-3">Generating Unified Notes</h2>
                  <p className="text-muted mb-2">
                    AI is compiling {contributionCount} contributions into comprehensive study notes...
                  </p>
                  <p className="text-sm text-muted/70">This may take a few moments</p>
                </div>
              ) : generationError ? (
                <div className="paper-card p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-ink mb-3">Generation Failed</h2>
                  <p className="text-muted mb-6">{generationError}</p>
                  <Button onClick={handleGenerateNotes} disabled={!generationState.allowed}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : currentNotes ? (
                <UnifiedNotesPreview chapterId={chapterId} notes={currentNotes} />
              ) : (
                <div className="paper-card p-12 text-center">
                  <Sparkles className="h-16 w-16 text-ai-highlight mx-auto mb-4" />
                  <h2 className="font-serif text-2xl font-bold text-ink mb-3">Unified Notes Coming Soon</h2>
                  <p className="text-muted mb-6">
                    {generationState.allowed 
                      ? "Click the button below to generate AI-compiled study notes from all contributions!"
                      : generationState.reason || "AI will compile all contributions into a comprehensive study guide."}
                  </p>
                  <Button 
                    onClick={handleGenerateNotes} 
                    disabled={!generationState.allowed}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {generationState.allowed ? "Generate Notes Now" : generationState.reason}
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
                    onHelpful={() => handleLikeContribution(contribution.id)}
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
            hasNotes={!!currentNotes}
            onGenerateNotes={handleGenerateNotes}
            isGenerating={isGenerating}
          />
        </div>
      </div>

      {/* Contribution composer modal */}
      <ContributionComposerModal 
        open={composerOpen} 
        onOpenChange={setComposerOpen} 
        chapterId={chapterId}
        schoolId={chapter.courseId ? undefined : undefined}
        onSubmit={handleAddContribution} 
      />

      {/* Share toast notification */}
      {shareToast && (
        <div className="fixed bottom-8 right-8 bg-ink text-card px-6 py-3 rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-bottom-5">
          Link copied to clipboard!
        </div>
      )}
    </>
  )
}
