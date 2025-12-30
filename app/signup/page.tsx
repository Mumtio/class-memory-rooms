"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-store"
import { useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus } from "lucide-react"
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

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/gateway")
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const newUser = {
        id: `user-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        schoolMemberships: {},
        joinedAt: new Date().toISOString(),
      }

      localStorage.setItem("class-memory-rooms-auth", JSON.stringify({ user: newUser, isAuthenticated: true }))

      window.dispatchEvent(new Event("storage"))

      await new Promise((resolve) => setTimeout(resolve, 100))

      router.push("/gateway")
    } catch (error) {
      console.error("Signup error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

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
