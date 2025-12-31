"use client"

import { useState, Suspense } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, FileText } from "lucide-react"
import Link from "next/link"
import { IllustrationSearch } from "@/components/illustrations/search"

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

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
          ) : (
            <div className="text-center py-16 text-muted">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg mb-2">Search is being set up</p>
              <p className="text-sm mb-6">Join a school to start searching through notes and contributions</p>
              <Button asChild>
                <Link href="/gateway">Go to Gateway</Link>
              </Button>
            </div>
          )}
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
