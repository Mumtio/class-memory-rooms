"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-store"
import { GatewayCard } from "@/components/gateway-card"
import { FolderPlus, KeyRound } from "lucide-react"

export default function GatewayPage() {
  const router = useRouter()
  const { isAuthenticated, isHydrated } = useAuth()

  useEffect(() => {
    // Wait for hydration before redirecting
    if (isHydrated && !isAuthenticated) {
      router.replace("/signup")
    }
  }, [isAuthenticated, isHydrated, router])

  // Show loading while hydrating
  if (!isHydrated) {
    return null
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
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
          <div className="grid md:grid-cols-2 gap-6">
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
          </div>
        </div>
      </main>
    </div>
  )
}
