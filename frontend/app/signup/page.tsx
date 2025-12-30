"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, register } from "@/lib/auth-store"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function SignupPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Don't redirect if already authenticated - let them access gateway
  // useEffect removed to allow authenticated users to visit gateway

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await register(formData.name, formData.email, formData.password)

      if (result.success) {
        // Small delay to ensure state propagates
        await new Promise((resolve) => setTimeout(resolve, 50))
        router.push("/gateway")
      } else {
        setError(result.error || "Registration failed. Please try again.")
      }
    } catch (error) {
      console.error("Signup error:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-md mx-auto">
          <div className="paper-card p-8 md:p-10 sketch-shadow">
            <div className="mb-8 text-center">
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink mb-3">Get started</h1>
              <p className="text-muted">Create an account to start collaborating</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-ink font-semibold">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Alex Johnson"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-background"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-ink font-semibold">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@school.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-background"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-ink font-semibold">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="bg-background"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="paper-card bg-red-50 border-2 border-red-200 p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                <UserPlus className="mr-2 h-5 w-5" /> {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted">Already have an account? </span>
              <Link href="/login" className="text-ink font-semibold hover:underline">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
