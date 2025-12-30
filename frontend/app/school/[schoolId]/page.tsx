"use client"

import { use } from "react"
import { SchoolPageContent } from "@/components/school-page-content"

interface SchoolPageProps {
  params: Promise<{
    schoolId: string
  }>
}

export default function SchoolPage({ params }: SchoolPageProps) {
  const { schoolId } = use(params)

  return (
    <div className="min-h-screen bg-background">
      <SchoolPageContent schoolId={schoolId} />
    </div>
  )
}
