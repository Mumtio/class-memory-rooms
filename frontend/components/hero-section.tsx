"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useAuth } from "@/lib/auth-store"
import { useRouter } from "next/navigation"

export function HeroSection() {
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
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-ink mb-6 text-balance">
          Your class notes,
          <br />
          <span className="relative inline-block">
            <span className="relative z-10">together</span>
            <svg
              className="absolute -bottom-2 left-0 w-full h-4 text-primary"
              viewBox="0 0 200 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 8C30 4 50 6 100 5C150 4 170 6 198 8"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>
        <p className="text-lg md:text-xl text-muted mb-8 max-w-2xl mx-auto leading-relaxed">
          A warm, collaborative space where students compile lecture notes, share insights, and build knowledge rooms
          that everyone can learn from.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="text-lg px-8" onClick={handleGetStarted}>
            {isAuthenticated ? "Go to Rooms" : "Get Started"} <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent" asChild>
            <Link href="#how-it-works">How it works</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
