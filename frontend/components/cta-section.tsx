"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useAuth } from "@/lib/auth-store"
import { useRouter } from "next/navigation"

export function CTASection() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()

  const handleGetStarted = () => {
    if (isAuthenticated && user) {
      // If user has schools, go to their current school or first school
      const memberships = user.schoolMemberships
      if (memberships && Object.keys(memberships).length > 0) {
        const schoolId = user.currentSchoolId || Object.keys(memberships)[0]
        router.push(`/school/${schoolId}`)
      } else {
        // User is logged in but has no schools, go to gateway
        router.push("/gateway")
      }
    } else {
      // Not logged in, go to signup
      router.push("/signup")
    }
  }

  return (
    <section className="container mx-auto px-4 py-16 md:py-20">
      <div className="max-w-4xl mx-auto text-center paper-card p-12 sketch-shadow">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-ink mb-4">
          {isAuthenticated ? "Continue your learning journey" : "Ready to start learning together?"}
        </h2>
        <p className="text-lg text-muted mb-8 max-w-2xl mx-auto">
          {isAuthenticated
            ? "Jump back into your collaborative notes and keep building knowledge with your classmates."
            : "Join thousands of students already collaborating on notes, sharing knowledge, and acing their exams."}
        </p>
        <Button size="lg" className="text-lg px-8" onClick={handleGetStarted}>
          {isAuthenticated ? "Go to my rooms" : "Get started"} <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </section>
  )
}
