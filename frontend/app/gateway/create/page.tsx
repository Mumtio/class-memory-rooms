"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Check, Copy, Shield, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { createSchool, useAuth } from "@/lib/auth-store"
import { createWorkspace } from "@/lib/workspace-store"
import { useToast } from "@/hooks/use-toast"

export default function CreateSchoolPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, user } = useAuth()
  const [formData, setFormData] = useState({
    schoolName: "",
    description: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successState, setSuccessState] = useState<{
    schoolId: string
    joinKey: string
  } | null>(null)
  const [showLeaveWarning, setShowLeaveWarning] = useState(false)
  const [keyCopied, setKeyCopied] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a school.",
        variant: "destructive",
      })
      return
    }
    
    setIsSubmitting(true)

    try {
      const result = await createSchool(formData.schoolName, user.name, user.email)

      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to create school. Please try again.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Create workspace for local state (this can be removed later when fully integrated)
      const workspace = createWorkspace(formData.schoolName, formData.description, user.id)

      setSuccessState({
        schoolId: result.schoolId!,
        joinKey: result.joinKey!,
      })
    } catch (error) {
      console.error("Create school error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyJoinKey = () => {
    if (successState) {
      navigator.clipboard.writeText(successState.joinKey)
      setKeyCopied(true)
      toast({
        title: "Join Key Copied!",
        description: "Share this key with others to invite them.",
      })
    }
  }

  const handleEnterSchool = () => {
    if (!keyCopied && successState) {
      setShowLeaveWarning(true)
    } else if (successState) {
      router.push(`/school/${successState.schoolId}`)
    }
  }

  const handleGoToAdmin = () => {
    if (!keyCopied && successState) {
      setShowLeaveWarning(true)
    } else if (successState) {
      router.push(`/school/${successState.schoolId}/admin`)
    }
  }

  const confirmLeave = () => {
    if (successState) {
      router.push(`/school/${successState.schoolId}`)
    }
  }

  const isValid = formData.schoolName

  if (!isAuthenticated || !user) {
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
        <div className="max-w-[520px] mx-auto">
          {!successState ? (
            <>
              <Button variant="ghost" asChild className="mb-6">
                <Link href="/gateway">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Gateway
                </Link>
              </Button>

              <div className="paper-card p-8 md:p-10 sketch-shadow">
                <div className="mb-8">
                  <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink mb-3">Create a School Room</h1>
                  <p className="text-muted leading-relaxed">You'll manage subjects, members, and access.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* School name */}
                  <div className="space-y-2">
                    <Label htmlFor="schoolName" className="text-ink font-semibold">
                      School Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="schoolName"
                      type="text"
                      placeholder="e.g. Sunrise High School"
                      value={formData.schoolName}
                      onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                      required
                      className="bg-background"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-ink font-semibold">
                      Optional Description
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Tell us about your school..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-background resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Logged in user info display */}
                  <div className="pt-4 border-t-2 border-dashed border-muted">
                    <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-4">
                      <p className="text-sm font-semibold text-ink mb-2">Creating as:</p>
                      <p className="text-sm text-muted">
                        <strong>{user.name}</strong> ({user.email})
                      </p>
                    </div>
                  </div>

                  {/* Role badge */}
                  <div className="bg-primary/10 border-2 border-primary rounded-2xl p-4 flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-ink">Your Role: Admin</p>
                      <p className="text-xs text-muted">You'll have full control over this school.</p>
                    </div>
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={!isValid || isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create School Room"}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <>
              {/* Success state */}
              <div className="paper-card p-8 md:p-10 sketch-shadow">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-background" />
                  </div>
                  <h1 className="font-serif text-3xl font-bold text-ink mb-2">School Created Successfully</h1>
                  <p className="text-muted">Your school room is ready to use!</p>
                </div>

                {/* Join key box */}
                <div className="bg-accent/30 border-2 border-accent rounded-2xl p-6 mb-4">
                  <Label className="text-sm text-muted mb-2 block">Your School Join Key</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-background border-2 border-ink rounded-xl p-4 font-mono text-2xl font-bold text-center tracking-widest">
                      {successState.joinKey}
                    </div>
                    <Button
                      onClick={copyJoinKey}
                      variant={keyCopied ? "default" : "outline"}
                      size="lg"
                      className="flex-shrink-0"
                    >
                      {keyCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 flex items-start gap-3 mb-6">
                  <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-orange-900">
                    <strong>Keep this safe!</strong> Anyone with this key can join your school.
                  </p>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  <Button onClick={handleEnterSchool} size="lg" className="w-full">
                    Enter School
                  </Button>
                  <Button onClick={handleGoToAdmin} variant="outline" size="lg" className="w-full bg-transparent">
                    Go to Admin Dashboard
                  </Button>
                </div>
              </div>

              {/* Leave warning modal */}
              {showLeaveWarning && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="paper-card p-6 max-w-sm w-full">
                    <h3 className="font-serif text-xl font-bold text-ink mb-2">Haven't Copied Key Yet</h3>
                    <p className="text-muted text-sm mb-6">
                      We noticed you haven't copied your join key. You can find it later in the admin dashboard.
                    </p>
                    <div className="flex gap-3">
                      <Button onClick={() => setShowLeaveWarning(false)} variant="outline" className="flex-1">
                        Go Back
                      </Button>
                      <Button onClick={confirmLeave} className="flex-1">
                        Continue Anyway
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
