"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, LogIn, AlertCircle } from "lucide-react"
import Link from "next/link"
import { joinSchool, useAuth } from "@/lib/auth-store"
import { findSchoolByKey } from "@/lib/workspace-store"

export default function JoinSchoolPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [joinKey, setJoinKey] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    await new Promise((resolve) => setTimeout(resolve, 800))

    const school = findSchoolByKey(joinKey)
    const demoSchools: Record<string, string> = {
      STANFORD2024: "demo",
      DEMO2024: "demo",
    }

    if (!school && !demoSchools[joinKey.toUpperCase()]) {
      setError("Invalid or expired key.")
      setIsSubmitting(false)
      return
    }

    const schoolId = school?.id || "demo"

    if (!user) {
      setError("User not authenticated.")
      setIsSubmitting(false)
      return
    }

    const result = joinSchool(joinKey, user.name, user.email)

    if (result.success && result.user) {
      window.dispatchEvent(new Event("storage"))
      router.push(`/school/${schoolId}`)
    } else {
      setError(result.error || "Invalid or expired key.")
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto paper-card p-12 text-center">
            <p className="text-muted">Redirecting to login...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-[480px] mx-auto">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/gateway">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Link>
          </Button>

          <div className="paper-card p-8 md:p-10 sketch-shadow">
            <div className="mb-8">
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink mb-3">Join a School Room</h1>
              <p className="text-muted leading-relaxed">Ask your school admin for the private join key.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="joinKey" className="text-ink font-semibold">
                  Join Key
                </Label>
                <Input
                  id="joinKey"
                  type="text"
                  placeholder="Enter 6–8 character key"
                  value={joinKey}
                  onChange={(e) => {
                    setJoinKey(e.target.value.toUpperCase())
                    setError(null)
                  }}
                  required
                  className="bg-background font-mono tracking-widest text-center text-lg"
                  maxLength={8}
                  minLength={6}
                />
              </div>

              {error && (
                <div className="paper-card bg-red-50 border-2 border-red-200 p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={joinKey.length < 6 || isSubmitting}>
                {isSubmitting ? (
                  "Joining..."
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" /> Join School
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
