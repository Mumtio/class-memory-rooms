"use client"

import { Breadcrumbs } from "@/components/breadcrumbs"
import { SubjectCard } from "@/components/subject-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Subject } from "@/types/models"
import { Search, Bookmark, Shield, ArrowLeft } from "lucide-react"
import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useActiveSchool } from "@/lib/active-school-context"
import { can } from "@/lib/permissions"

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
  const showAdminDashboard = isAdmin
  
  const [schoolName, setSchoolName] = useState("School")
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchSchoolData() {
      try {
        const res = await fetch(`/api/forum/schools/${schoolId}`)
        if (res.ok) {
          const data = await res.json()
          setSchoolName(data.school?.name || "School")
          setSubjects(data.subjects || [])
        }
      } catch (error) {
        console.error('Error fetching school data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSchoolData()
  }, [schoolId])

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "School", href: "/gateway" }, { label: schoolName }]} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-ink mb-2">{schoolName}</h1>
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
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="text-center">
              <div className="relative mx-auto w-12 h-12 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              </div>
              <p className="text-muted">Loading subjects...</p>
            </div>
          </div>
        ) : subjects.length > 0 ? (
          subjects.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} schoolId={schoolId} />
          ))
        ) : (
          <div className="col-span-full paper-card p-12 text-center">
            <p className="text-muted text-lg">No subjects found for this school.</p>
          </div>
        )}
      </div>
    </div>
  )
}
