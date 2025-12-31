"use client"

import { Button } from "@/components/ui/button"
import { Bookmark, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IllustrationEmptyShelf } from "@/components/illustrations/empty-shelf"

export default function SavedPage() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="font-serif text-5xl text-ink mb-3">Saved</h1>
            <p className="text-lg text-muted">Your personal collection of the best notes and resources</p>
          </div>

          <div className="text-center py-16">
            <div className="flex justify-center mb-6">
              <IllustrationEmptyShelf />
            </div>
            <h3 className="font-serif text-2xl text-ink mb-3">No saved items yet</h3>
            <p className="text-muted mb-6 max-w-md mx-auto text-pretty">
              Save the best student explanations, examples, and resources to build your personal study library.
            </p>
            <Button asChild>
              <Link href="/gateway">Browse Chapters</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
