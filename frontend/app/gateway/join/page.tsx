"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, LogIn, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-store"

// Helper to update auth state in localStorage
function updateAuthWithSchool(schoolId: string, schoolName: string, role: string) {
  if (typeof window === "undefined") return
  
  try {
    const stored = localStorage.getItem("class-memory-rooms-auth")
    if (!stored) return
    
    const authState = JSON.parse(stored)
    if (!authState.user) return
    
    // Add the new school to memberships
    authState.user.schoolMemberships = {
      ...authState.user.schoolMemberships,
      [schoolId]: {
        role: role,
        schoolName: schoolName,
        joinedAt: new Date().toISOString(),
      },
    }
    authState.user.currentSchoolId = schoolId
    
    localStorage.setItem("class-memory-rooms-auth", JSON.stringify(authState))
    window.dispatchEvent(new Event("auth-change"))
  } catch (error) {
    console.error("Failed to update auth state:", error)
  }
}

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

    if (!user) {
      setError("User not authenticated.")
      setIsSubmitting(false)
      return
    }

    try {
      // Call the join API
      const response = await fetch('/api/schools/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          joinKey: joinKey.toUpperCase(),
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Invalid or expired key.")
        setIsSubmitting(false)
        return
      }

      // Update local auth state with the new school membership
      updateAuthWithSchool(data.schoolId, data.schoolName, data.role)
      
      // Navigate to the school
      router.push(`/school/${data.schoolId}`)
    } catch (err) {
      console.error("Join school error:", err)
      setError("Failed to join school. Please try again.")
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
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
