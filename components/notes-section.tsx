import type { ReactNode } from "react"

interface NotesSectionProps {
  id: string
  title: string
  children: ReactNode
}

export function NotesSection({ id, title, children }: NotesSectionProps) {
  return (
    <section id={id} className="paper-card p-8 scroll-mt-24">
      <h2 className="font-serif text-2xl font-bold text-ink mb-6 pb-3 border-b-2 border-border">{title}</h2>
      {children}
    </section>
  )
}
