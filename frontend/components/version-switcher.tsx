"use client"

import { ChevronDown } from "lucide-react"
import { useState } from "react"

interface VersionSwitcherProps {
  currentVersion: number
  versions: number[]
  onVersionChange: (version: number) => void
}

export function VersionSwitcher({ currentVersion, versions, onVersionChange }: VersionSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Sort versions in descending order (latest first)
  const sortedVersions = [...versions].sort((a, b) => b - a)
  const latestVersion = sortedVersions[0]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-card border-2 border-border rounded-lg hover:bg-muted/20 transition-colors"
      >
        <span className="font-semibold text-ink">Version {currentVersion}</span>
        <ChevronDown className={`h-4 w-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 bg-card border-2 border-border rounded-lg shadow-lg z-50 min-w-[160px]">
            {sortedVersions.map((version) => (
              <button
                key={version}
                onClick={() => {
                  onVersionChange(version)
                  setIsOpen(false)
                }}
                className={`block w-full text-left px-4 py-2 hover:bg-muted/20 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  version === currentVersion ? "bg-primary/20 font-semibold" : ""
                }`}
              >
                Version {version}
                {version === latestVersion && <span className="ml-2 text-xs text-muted">(Latest)</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
