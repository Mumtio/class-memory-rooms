import { Breadcrumbs } from "@/components/breadcrumbs"
import { CourseRow } from "@/components/course-row"
import { Button } from "@/components/ui/button"
import type { Subject, Course } from "@/types/models"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface SubjectPageProps {
  params: Promise<{
    schoolId: string
    subjectId: string
  }>
}

async function getSubjectData(schoolId: string, subjectId: string): Promise<{ subject: Subject; courses: Course[]; schoolName: string } | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Fetch subject details and courses
    const res = await fetch(`${baseUrl}/api/forum/schools/${schoolId}/subjects/${subjectId}`, {
      cache: 'no-store'
    })
    
    if (!res.ok) return null
    const data = await res.json()
    
    return {
      subject: data.subject,
      courses: data.courses || [],
      schoolName: data.schoolName || 'School'
    }
  } catch (error) {
    console.error('Error fetching subject data:', error)
    return null
  }
}

export default async function SubjectPage({ params }: SubjectPageProps) {
  const { schoolId, subjectId } = await params
  const data = await getSubjectData(schoolId, subjectId)

  if (!data) {
    notFound()
  }
  
  const { subject, courses, schoolName } = data

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: "School", href: "/school/demo" },
            { label: schoolName, href: "/school/demo" },
            { label: subject.name },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <Button variant="outline" className="mb-6 bg-transparent" asChild>
            <Link href={`/school/${schoolId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to subjects
            </Link>
          </Button>

          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-border"
              style={{ backgroundColor: subject.colorTag }}
            >
              <span className="font-serif font-bold text-2xl text-ink">{subject.name[0]}</span>
            </div>
            <div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-ink mb-2">{subject.name}</h1>
              <p className="text-lg text-muted">Pick a course to see chapters and lectures</p>
            </div>
          </div>
        </div>

        {/* Course List */}
        <div className="space-y-4">
          {courses.length > 0 ? (
            courses.map((course) => <CourseRow key={course.id} course={course} />)
          ) : (
            <div className="paper-card p-12 text-center">
              <p className="text-muted text-lg">No courses found for this subject.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
