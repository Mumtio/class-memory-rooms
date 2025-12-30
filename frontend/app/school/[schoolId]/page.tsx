"use client"

import { Navbar } from "@/components/navbar"
import { SchoolPageContent } from "@/components/school-page-content"

interface SchoolPageProps {
  params: Promise<{
    schoolId: string
  }>
}

export default async function SchoolPage({ params }: SchoolPageProps) {
  const { schoolId } = await params

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <SchoolPageContent schoolId={schoolId} />
    </div>
  )
}
