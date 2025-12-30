"use client"

import { useState, useEffect } from "react"

const sections = [
  { id: "overview", label: "Overview" },
  { id: "key-concepts", label: "Key Concepts" },
  { id: "definitions", label: "Definitions" },
  { id: "formulas", label: "Formulas / Rules" },
  { id: "steps", label: "Step-by-step Explanation" },
  { id: "examples", label: "Worked Examples" },
  { id: "mistakes", label: "Common Mistakes" },
  { id: "resources", label: "Best Resources" },
  { id: "revision", label: "Quick Revision Sheet" },
]

export function TableOfContents() {
  const [activeSection, setActiveSection] = useState("overview")

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: "-20% 0px -70% 0px" },
    )

    sections.forEach((section) => {
      const element = document.getElementById(section.id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <div className="paper-card p-6 sticky top-24">
      <h3 className="font-serif text-lg font-bold text-ink mb-4">Table of Contents</h3>
      <nav className="space-y-1">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
              activeSection === section.id
                ? "bg-primary/20 text-ink font-semibold border-l-4 border-primary"
                : "text-muted hover:text-ink hover:bg-muted/30"
            }`}
          >
            {section.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
