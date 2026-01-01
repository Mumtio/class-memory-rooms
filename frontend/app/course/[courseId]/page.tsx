import { Breadcrumbs } from "@/components/breadcrumbs"
import { ChapterFolderCard } from "@/components/chapter-folder-card"
import { Button } from "@/components/ui/button"
import type { Course, Subject, Chapter } from "@/types/models"
import { ArrowLeft, Search, ChevronRight } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface CoursePageProps {
  params: Promise<{
    courseId: string
  }>
}

async function getCourseData(courseId: string): Promise<{ course: Course; subject: Subject; chapters: Chapter[]; schoolName: string } | null> {
  try {
    // Use VERCEL_URL for server-side fetches in production
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Fetch course details
    const courseRes = await fetch(`${baseUrl}/api/forum/courses/${courseId}`, {
      cache: 'no-store'
    })
    
    if (!courseRes.ok) return null
    const courseData = await courseRes.json()
    
    // Fetch chapters for this course
    const chaptersRes = await fetch(`${baseUrl}/api/forum/courses/${courseId}/chapters`, {
      cache: 'no-store'
    })
    
    const chaptersData = chaptersRes.ok ? await chaptersRes.json() : { chapters: [] }
    
    return {
      course: courseData.course,
      subject: courseData.subject,
      chapters: chaptersData.chapters || [],
      schoolName: courseData.schoolName || 'School'
    }
  } catch (error) {
    console.error('Error fetching course data:', error)
    return null
  }
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseId } = await params
  const data = await getCourseData(courseId)

  if (!data) {
    notFound()
  }
  
  const { course, subject, chapters, schoolName } = data

  // Find the latest chapter (last in list with status not "Compiled")
  const latestChapter = chapters.find((ch) => ch.status !== "Compiled") || chapters[chapters.length - 1]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: "School", href: "/school/demo" },
            { label: schoolName, href: "/school/demo" },
            { label: subject.name, href: `/school/demo/subject/${subject.id}` },
            { label: `${course.code}` },
          ]}
        />

        {/* Header */}
        <div className="mb-12">
          <Button variant="outline" className="mb-6 bg-transparent" asChild>
            <Link href={`/school/demo/subject/${subject.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {subject.name}
            </Link>
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center border-2 border-border"
                  style={{ backgroundColor: subject.colorTag }}
                >
                  <span className="font-serif font-bold text-lg text-ink">{subject.name[0]}</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-muted uppercase tracking-wide">{course.code}</div>
                  <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink">{course.title}</h1>
                </div>
              </div>

              {/* Only show teacher name */}
              {course.teacher && course.teacher !== 'TBD' && (
                <div className="flex items-center gap-3 flex-wrap mt-4">
                  <div className="px-3 py-1 bg-background rounded-full text-sm font-semibold text-muted border border-border">
                    {course.teacher}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap">
              <Button variant="outline" className="bg-transparent">
                <Search className="mr-2 h-4 w-4" />
                Search in course
              </Button>
              {latestChapter && (
                <Button asChild>
                  <Link href={`/chapter/${latestChapter.id}`}>
                    Enter latest chapter
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Chapter Grid */}
        <div className="mt-8">
          <h2 className="font-serif text-2xl font-bold text-ink mb-10">Chapters & Lectures</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14">
            {chapters.length > 0 ? (
              chapters.map((chapter) => (
                <ChapterFolderCard 
                  key={chapter.id} 
                  chapter={chapter} 
                  subjectColor={subject.colorTag}
                  hasNotes={(chapter as any).hasNotes}
                />
              ))
            ) : (
              <div className="col-span-full paper-card p-12 text-center">
                <p className="text-muted text-lg">No chapters found for this course.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
