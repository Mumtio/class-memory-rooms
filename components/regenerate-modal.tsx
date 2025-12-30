"use client"

import { Button } from "@/components/ui/button"
import { Sparkles, X } from "lucide-react"

interface RegenerateModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export function RegenerateModal({ open, onClose, onConfirm }: RegenerateModalProps) {
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border-2 border-border rounded-2xl shadow-xl z-50 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Sparkles className="h-6 w-6 text-ink" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-ink">Regenerate Notes?</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-ink leading-relaxed mb-6">
          This will create a new version from the latest contributions. Your current notes will be saved as version
          history.
        </p>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            <Sparkles className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
        </div>
      </div>
    </>
  )
}
