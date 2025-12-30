"use client"

import type React from "react"

interface EmptyStateProps {
  illustration: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ illustration, title, description, action }: EmptyStateProps) {
  return (
    <div className="paper-card p-12 text-center max-w-2xl mx-auto">
      <div className="mb-6 flex justify-center">{illustration}</div>
      <h3 className="font-serif text-2xl font-bold text-ink mb-2">{title}</h3>
      <p className="text-muted text-lg mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-primary text-ink font-semibold rounded-xl hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
