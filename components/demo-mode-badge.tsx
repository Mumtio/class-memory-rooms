"use client"

import { Info } from "lucide-react"
import { useState } from "react"

export function DemoModeBadge() {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFE45C] border-2 border-border text-ink text-sm font-medium hover:bg-[#FFE45C]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Demo mode information"
      >
        <Info className="h-3.5 w-3.5" />
        <span>Demo Mode</span>
      </button>

      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 w-64 p-3 paper-card text-sm text-ink z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="font-semibold mb-1">Using mock data</p>
          <p className="text-muted">
            Backend powered by <span className="font-semibold">Foru.ms</span> (coming next)
          </p>
        </div>
      )}
    </div>
  )
}
