import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getFeaturedChapters, getCourse, getSubjectByCourse } from "@/lib/mock-data"
import { ArrowRight, Users, Sparkles, BookOpen } from "lucide-react"
import { HeroSection } from "@/components/hero-section"
import { CTASection } from "@/components/cta-section"

export default function HomePage() {
  const featuredChapters = getFeaturedChapters(3)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection />

      {/* How It Works Section */}
      <section id="how-it-works" className="container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-ink text-center mb-16">How it works</h2>

          <div className="grid md:grid-cols-3 gap-8 md:gap-6">
            {/* Step 1 */}
            <div className="paper-card p-8 relative">
              <div className="absolute -top-3 -left-3 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-md">
                <span className="font-serif font-bold text-2xl text-ink">1</span>
              </div>
              <div className="mb-6 mt-4">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
                  <Users className="h-8 w-8 text-ink" />
                </div>
              </div>
              <h3 className="font-serif text-2xl font-bold text-ink mb-3">Enter a room</h3>
              <p className="text-muted leading-relaxed">
                Pick your school, subject, and course. Each lecture has its own chapter room where everyone's notes come
                together.
              </p>
            </div>

            {/* Step 2 */}
            <div className="paper-card p-8 relative">
              <div className="absolute -top-3 -left-3 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-md">
                <span className="font-serif font-bold text-2xl text-ink">2</span>
              </div>
              <div className="mb-6 mt-4">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-ink" />
                </div>
              </div>
              <h3 className="font-serif text-2xl font-bold text-ink mb-3">Contribute & compile</h3>
              <p className="text-muted leading-relaxed">
                Upload your handwritten notes, photos, or typed summaries. Our AI helps organize everything into one
                beautiful, searchable document.
              </p>
            </div>

            {/* Step 3 */}
            <div className="paper-card p-8 relative">
              <div className="absolute -top-3 -left-3 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-md">
                <span className="font-serif font-bold text-2xl text-ink">3</span>
              </div>
              <div className="mb-6 mt-4">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-ink" />
                </div>
              </div>
              <h3 className="font-serif text-2xl font-bold text-ink mb-3">Study together</h3>
              <p className="text-muted leading-relaxed">
                Access the compiled notes anytime. Highlight, annotate, and save your favorite sections for exam prep.
                Learning is better together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Chapters Section */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-ink mb-3">Active chapters</h2>
              <p className="text-muted text-lg">Join the most collaborative rooms right now</p>
            </div>
            <Button variant="outline" asChild className="hidden sm:flex bg-transparent">
              <Link href="/gateway">
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredChapters.map((chapter) => {
              const course = getCourse(chapter.courseId)
              const subject = course ? getSubjectByCourse(course.id) : undefined

              return (
                <div key={chapter.id} className="paper-card p-6 sketch-shadow group hover:shadow-lg transition-all">
                  {/* Folder tab */}
                  <div className="relative -mt-10 mb-4">
                    <div
                      className="inline-block px-4 py-2 rounded-t-lg border-2 border-b-0 border-border text-sm font-semibold"
                      style={{
                        backgroundColor: subject?.colorTag || "#D6FF3F",
                        color: "#1E1A16",
                      }}
                    >
                      {chapter.label}
                    </div>
                  </div>

                  {/* Status stamp */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                        {course?.code}
                      </div>
                      <h3 className="font-serif text-xl font-bold text-ink mb-1">{chapter.title}</h3>
                    </div>
                    <div className="px-2 py-1 bg-primary/20 rounded text-xs font-semibold text-ink">
                      {chapter.status}
                    </div>
                  </div>

                  <p className="text-sm text-muted mb-4">{course?.title}</p>

                  {/* Meta info */}
                  <div className="flex items-center gap-4 text-sm text-muted mb-4 pb-4 border-b border-border">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{chapter.contributions}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{chapter.resources}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-4 w-4" />
                      <span>{chapter.photos}</span>
                    </div>
                  </div>

                  <Button className="w-full" asChild>
                    <Link href={`/chapter/${chapter.id}`}>
                      View Notes <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )
            })}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" asChild>
              <Link href="/gateway">
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <footer className="border-t-2 border-border bg-card mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <span className="text-ink font-serif font-bold">M</span>
              </div>
              <span className="font-serif font-bold text-ink">Memory Rooms</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted">
              <Link href="/about" className="hover:text-ink transition-colors">
                About
              </Link>
              <Link href="/privacy" className="hover:text-ink transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-ink transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-ink transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
