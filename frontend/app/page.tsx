import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, Sparkles, BookOpen } from "lucide-react"
import { HeroSection } from "@/components/hero-section"
import { CTASection } from "@/components/cta-section"

export default function HomePage() {
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
