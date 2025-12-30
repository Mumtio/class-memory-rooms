"use client"

import { NotesToolbar } from "@/components/notes-toolbar"
import { TableOfContents } from "@/components/table-of-contents"
import { NotesSection } from "@/components/notes-section"
import { DefinitionCards } from "@/components/definition-cards"
import { FormulaList } from "@/components/formula-list"
import { WorkedExamples } from "@/components/worked-examples"
import { MistakesCallout } from "@/components/mistakes-callout"
import { ResourcesList } from "@/components/resources-list"
import { RevisionSheet } from "@/components/revision-sheet"
import { VersionSwitcher } from "@/components/version-switcher"
import { RegenerateModal } from "@/components/regenerate-modal"
import type { Chapter, UnifiedNotes } from "@/lib/mock-data"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useDemoStore } from "@/lib/demo-store"

interface NotesPageContentProps {
  chapterId: string
  chapter: Chapter
  allVersions: UnifiedNotes[]
  initialNotes: UnifiedNotes | undefined
  contributionCount: number
}

export function NotesPageContent({
  chapterId,
  chapter,
  allVersions,
  initialNotes,
  contributionCount,
}: NotesPageContentProps) {
  const router = useRouter()
  const { addActivity } = useDemoStore()

  const latestVersion = allVersions.length > 0 ? Math.max(...allVersions.map((n) => n.version)) : 1

  const [currentVersion, setCurrentVersion] = useState(latestVersion)
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false })

  useEffect(() => {
    addActivity({ type: "notes", chapterId })
  }, [chapterId])

  const notes = allVersions.find((n) => n.version === currentVersion) || initialNotes

  // If no notes exist, show placeholder
  if (!notes) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto paper-card p-12 text-center">
          <h1 className="font-serif text-3xl font-bold text-ink mb-4">No Notes Available</h1>
          <p className="text-muted mb-6">
            Unified notes haven't been generated for this chapter yet. Check back later!
          </p>
          <button
            onClick={() => router.push(`/chapter/${chapterId}`)}
            className="px-6 py-2 bg-primary text-ink rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Back to Chapter
          </button>
        </div>
      </div>
    )
  }

  const showToast = (message: string) => {
    setToast({ message, visible: true })
    setTimeout(() => setToast({ message: "", visible: false }), 3000)
  }

  const handleRegenerate = () => {
    setRegenerateModalOpen(false)
    showToast("Regenerating notes... (demo)")
  }

  const handleExport = () => {
    showToast("Export started (demo)")
  }

  return (
    <>
      <NotesToolbar
        chapterId={chapterId}
        chapterLabel={chapter.label}
        chapterTitle={chapter.title}
        version={currentVersion}
        contributionCount={contributionCount}
        onRegenerateClick={() => setRegenerateModalOpen(true)}
        onExportClick={handleExport}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Version switcher */}
        {allVersions.length > 1 && (
          <div className="flex justify-end mb-6">
            <VersionSwitcher
              currentVersion={currentVersion}
              totalVersions={allVersions.length}
              onVersionChange={setCurrentVersion}
            />
          </div>
        )}

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left: TOC (sticky) */}
          <div className="lg:col-span-1">
            <TableOfContents />
          </div>

          {/* Right: Content */}
          <div className="lg:col-span-3 space-y-8 max-w-4xl">
            {/* Overview */}
            <NotesSection id="overview" title="Overview">
              <ul className="space-y-3">
                {notes.overview.map((item, index) => (
                  <li key={index} className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
                    <span className="text-ink leading-relaxed text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </NotesSection>

            {/* Key Concepts */}
            <NotesSection id="key-concepts" title="Key Concepts">
              <div className="space-y-5">
                {notes.keyConcepts.map((concept, index) => (
                  <div key={index} className="border-l-4 border-primary pl-5">
                    <h3 className="font-semibold text-ink text-lg mb-2">{concept.title}</h3>
                    <p className="text-ink leading-relaxed">{concept.explanation}</p>
                  </div>
                ))}
              </div>
            </NotesSection>

            {/* Definitions */}
            <NotesSection id="definitions" title="Definitions">
              <DefinitionCards definitions={notes.definitions} />
            </NotesSection>

            {/* Formulas */}
            <NotesSection id="formulas" title="Formulas / Rules">
              <FormulaList formulas={notes.formulas} />
            </NotesSection>

            {/* Step-by-step */}
            <NotesSection id="steps" title="Step-by-step Explanation">
              <ol className="space-y-4">
                {notes.steps.map((step, index) => (
                  <li key={index} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center font-bold text-ink">
                      {index + 1}
                    </span>
                    <span className="text-ink leading-relaxed text-lg flex-1">{step}</span>
                  </li>
                ))}
              </ol>
            </NotesSection>

            {/* Worked Examples */}
            <NotesSection id="examples" title="Worked Examples">
              <WorkedExamples examples={notes.examples} />
            </NotesSection>

            {/* Common Mistakes */}
            <NotesSection id="mistakes" title="Common Mistakes">
              <MistakesCallout mistakes={notes.mistakes} />
            </NotesSection>

            {/* Resources */}
            <NotesSection id="resources" title="Best Resources">
              <ResourcesList resources={notes.resources} notePhotos={notes.bestNotePhotos} />
            </NotesSection>

            {/* Quick Revision */}
            <NotesSection id="revision" title="Quick Revision Sheet">
              <RevisionSheet items={notes.quickRevision} />
            </NotesSection>
          </div>
        </div>
      </div>

      {/* Regenerate Modal */}
      <RegenerateModal
        open={regenerateModalOpen}
        onClose={() => setRegenerateModalOpen(false)}
        onConfirm={handleRegenerate}
      />

      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-8 right-8 bg-ink text-card px-6 py-3 rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-bottom-5">
          {toast.message}
        </div>
      )}
    </>
  )
}
