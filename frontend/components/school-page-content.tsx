"use client"

import { Breadcrumbs } from "@/components/breadcrumbs"
import { SubjectCard } from "@/components/subject-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { school, subjects } from "@/types/models"
import { Search, Bookmark, Shield, ArrowLeft } from "lucide-react"
import { Suspense } from "react"
import Link from "next/link"
import { useActiveSchool } from "@/lib/active-school-context"
import { can } from "@/lib/permissions"
import { isDemoSchool } from "@/lib/demo-school"

interface SchoolPageContentProps {
  schoolId: string
}

function SearchBar() {
  return (
    <div className="relative max-w-2xl">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
      <Input
        placeholder="Search subjects, courses, or chapters..."
        className="pl-12 py-6 text-lg bg-card border-2 border-border rounded-2xl"
      />
    </div>
  )
}

export function SchoolPageContent({ schoolId }: SchoolPageContentProps) {
  const { activeMembership } = useActiveSchool()
  const isAdmin = can(activeMembership, "open_admin_dashboard")
  const showAdminDashboard = isAdmin && !isDemoSchool(schoolId)

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "School", href: "/gateway" }, { label: school.name }]} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-ink mb-2">{school.name}</h1>
            <p className="text-lg text-muted">Choose a subject room to enter</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" className="bg-transparent" asChild>
              <Link href="/gateway">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Rooms
              </Link>
            </Button>
            {showAdminDashboard && (
              <Button variant="outline" className="bg-red-500/10 border-red-500 hover:bg-red-500/20" asChild>
                <Link href={`/school/${schoolId}/admin`}>
                  <Shield className="mr-2 h-4 w-4 text-red-500" />
                  Admin Dashboard
                </Link>
              </Button>
            )}
            <Button variant="outline" className="bg-transparent" asChild>
              <Link href="/saved">
                <Bookmark className="mr-2 h-4 w-4" />
                Saved Notes
              </Link>
            </Button>
            <Button asChild>
              <Link href="/search">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Link>
            </Button>
          </div>
        </div>

        <Suspense fallback={<div className="h-14" />}>
          <SearchBar />
        </Suspense>
      </div>

      {/* Subject Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <SubjectCard key={subject.id} subject={subject} schoolId={schoolId} />
        ))}
      </div>
    </div>
  )
}
