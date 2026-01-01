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
    const apiUrl = process.env.FORUMMS_API_URL || 'https://foru.ms/api/v1'
    const apiKey = process.env.FORUMMS_API_KEY || ''
    
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    }

    // Get school thread
    const schoolRes = await fetch(`${apiUrl}/thread/${schoolId}`, { headers, cache: 'no-store' })
    if (!schoolRes.ok) return null
    const schoolThread = await schoolRes.json()
    
    if (schoolThread.extendedData?.type !== 'school') return null

    // Get subject post
    const subjectRes = await fetch(`${apiUrl}/post/${subjectId}`, { headers, cache: 'no-store' })
    if (!subjectRes.ok) return null
    const subjectPost = await subjectRes.json()
    
    if (subjectPost.extendedData?.type !== 'subject') return null

    // Get all posts in school thread to find courses
    const postsRes = await fetch(`${apiUrl}/posts?threadId=${schoolId}`, { headers, cache: 'no-store' })
    const postsData = postsRes.ok ? await postsRes.json() : { posts: [] }
    const posts = postsData.posts || []

    // Filter for courses belonging to this subject
    const coursePosts = posts.filter((post: any) =>
      post.extendedData?.type === 'course' && 
      post.extendedData?.subjectId === subjectId
    )

    const courses: Course[] = coursePosts.map((post: any) => ({
      id: post.id,
      subjectId: post.extendedData?.subjectId || '',
      code: post.extendedData?.code || '',
      title: post.extendedData?.title || '',
      teacher: post.extendedData?.teacher || 'TBD',
      term: post.extendedData?.term || '',
      section: post.extendedData?.section || '',
    }))

    return {
      subject: {
        id: subjectPost.id,
        name: subjectPost.extendedData?.name || 'Subject',
        colorTag: subjectPost.extendedData?.colorTag || subjectPost.extendedData?.color || '#7EC8E3',
        courseCount: courses.length,
        chapterCount: 0,
        compiledCount: 0,
        collectingCount: 0,
      },
      courses,
      schoolName: schoolThread.extendedData?.name || schoolThread.title || 'School',
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
            { label: "School", href: `/school/${schoolId}` },
            { label: schoolName, href: `/school/${schoolId}` },
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
