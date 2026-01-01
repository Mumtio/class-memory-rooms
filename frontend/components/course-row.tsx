import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Course } from "@/types/models"

interface CourseRowProps {
  course: Course
}

export function CourseRow({ course }: CourseRowProps) {
  return (
    <div className="paper-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all">
      <div className="flex-1">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="font-serif font-bold text-ink">{course.code.split("-")[1] || course.code[0]}</span>
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-ink mb-1">
              {course.code} - {course.title}
            </h3>
            {course.teacher && course.teacher !== 'TBD' && (
              <p className="text-sm text-muted">{course.teacher}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
        <Button asChild>
          <Link href={`/course/${course.id}`}>Open Course</Link>
        </Button>
      </div>
    </div>
  )
}
