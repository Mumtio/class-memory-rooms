"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-store"
import { useActiveSchool } from "@/lib/active-school-context"
import { DEMO_SCHOOL_ID } from "@/lib/demo-school"
import { Navbar } from "@/components/navbar"
import { GatewayCard } from "@/components/gateway-card"
import { FolderPlus, KeyRound } from "lucide-react"

export default function GatewayPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { setActiveSchool } = useActiveSchool()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/signup")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  const handleEnterDemo = () => {
    setActiveSchool(DEMO_SCHOOL_ID)
    router.push(`/school/${DEMO_SCHOOL_ID}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 md:mb-16">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-ink mb-4">
              Enter a Class Memory Room
            </h1>
            <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
              Create a space for your school, or join one using an invite key.
            </p>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <GatewayCard
              icon={FolderPlus}
              title="Create a School Room"
              description="Start a shared memory space for your school or class. You'll be the admin."
              buttonText="Create School"
              buttonHref="/gateway/create"
              variant="primary"
            />

            <GatewayCard
              icon={KeyRound}
              title="Join an Existing School"
              description="Enter the private key shared by your school admin."
              buttonText="Join with Key"
              buttonHref="/gateway/join"
              variant="secondary"
            />

            <div
              className="paper-card p-6 sketch-shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={handleEnterDemo}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-accent/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">👀</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-ink">Try Demo School</h3>
              </div>
              <p className="text-muted text-sm mb-4 leading-relaxed">
                Explore a fully populated school with example content. No commitment needed.
              </p>
              <button className="w-full py-2 px-4 border-2 border-ink rounded-xl font-semibold hover:bg-ink hover:text-background transition-colors">
                Enter Demo
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
