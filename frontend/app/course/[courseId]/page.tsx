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

async function getCourseData(courseId: string): Promise<{ course: Course; subject: Subject; chapters: Chapter[]; schoolId: string; schoolName: string } | null> {
  try {
    const apiUrl = process.env.FORUMMS_API_URL || 'https://foru.ms/api/v1'
    const apiKey = process.env.FORUMMS_API_KEY || ''
    
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    }

    // Get course post
    const courseRes = await fetch(`${apiUrl}/post/${courseId}`, { headers, cache: 'no-store' })
    if (!courseRes.ok) return null
    const coursePost = await courseRes.json()
    
    if (coursePost.extendedData?.type !== 'course') return null

    const schoolId = coursePost.extendedData?.schoolId || ''
    const subjectId = coursePost.extendedData?.subjectId || ''

    // Get subject post
    let subject: Subject = {
      id: subjectId,
      name: 'Subject',
      colorTag: '#7EC8E3',
      courseCount: 0,
      chapterCount: 0,
      compiledCount: 0,
      collectingCount: 0,
    }
    
    if (subjectId) {
      const subjectRes = await fetch(`${apiUrl}/post/${subjectId}`, { headers, cache: 'no-store' })
      if (subjectRes.ok) {
        const subjectPost = await subjectRes.json()
        subject = {
          id: subjectPost.id,
          name: subjectPost.extendedData?.name || 'Subject',
          colorTag: subjectPost.extendedData?.colorTag || subjectPost.extendedData?.color || '#7EC8E3',
          courseCount: 0,
          chapterCount: 0,
          compiledCount: 0,
          collectingCount: 0,
        }
      }
    }

    // Get school name
    let schoolName = 'School'
    if (schoolId) {
      const schoolRes = await fetch(`${apiUrl}/thread/${schoolId}`, { headers, cache: 'no-store' })
      if (schoolRes.ok) {
        const schoolThread = await schoolRes.json()
        schoolName = schoolThread.extendedData?.name || schoolThread.title || 'School'
      }
    }

    // Get all threads to find chapters for this course
    const threadsRes = await fetch(`${apiUrl}/threads`, { headers, cache: 'no-store' })
    const threadsData = threadsRes.ok ? await threadsRes.json() : { threads: [] }
    const threads = threadsData.threads || []

    const chapterThreads = threads.filter((thread: any) =>
      thread.extendedData?.type === 'chapter' && 
      thread.extendedData?.courseId === courseId
    )

    const chapters: Chapter[] = chapterThreads.map((thread: any) => ({
      id: thread.id,
      courseId: thread.extendedData?.courseId || '',
      label: thread.extendedData?.label || 'Lecture',
      title: thread.title,
      date: thread.extendedData?.date,
      status: thread.extendedData?.status || 'Collecting',
      contributions: 0,
      resources: 0,
      photos: 0,
    }))

    return {
      course: {
        id: coursePost.id,
        subjectId: coursePost.extendedData?.subjectId || '',
        code: coursePost.extendedData?.code || '',
        title: coursePost.extendedData?.title || '',
        teacher: coursePost.extendedData?.teacher || 'TBD',
        term: coursePost.extendedData?.term || '',
        section: coursePost.extendedData?.section || '',
      },
      subject,
      chapters,
      schoolId,
      schoolName,
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
  
  const { course, subject, chapters, schoolId, schoolName } = data

  // Find the latest chapter
  const latestChapter = chapters.find((ch) => ch.status !== "Compiled") || chapters[chapters.length - 1]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: "School", href: `/school/${schoolId}` },
            { label: schoolName, href: `/school/${schoolId}` },
            { label: subject.name, href: `/school/${schoolId}/subject/${subject.id}` },
            { label: `${course.code}` },
          ]}
        />

        {/* Header */}
        <div className="mb-12">
          <Button variant="outline" className="mb-6 bg-transparent" asChild>
            <Link href={`/school/${schoolId}/subject/${subject.id}`}>
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
                  hasNotes={false}
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
