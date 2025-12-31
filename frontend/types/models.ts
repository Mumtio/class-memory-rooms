// Type definitions for Class Memory Rooms data models

export interface School {
  id: string
  name: string
  description?: string
  joinKey?: string
}

export interface Subject {
  id: string
  name: string
  colorTag: string
  courseCount: number
  chapterCount: number
  compiledCount: number
  collectingCount: number
}

export interface Course {
  id: string
  subjectId: string
  code: string
  title: string
  teacher: string
  term: string
  section: string
}

export interface Chapter {
  id: string
  courseId: string
  label: string
  title: string
  date?: string
  status: "Collecting" | "AI Ready" | "Compiled"
  contributions: number
  resources: number
  photos: number
}

export type ContributionType = "takeaway" | "notes_photo" | "resource" | "solved_example" | "confusion"

export interface Contribution {
  id: string
  chapterId: string
  type: ContributionType
  title?: string
  content?: string
  anonymous: boolean
  authorName: string
  createdAt: string
  link?: { url: string; title: string }
  image?: { alt: string; url?: string }
  replies?: Array<{ 
    id: string
    author: string
    content: string
    createdAt: string
    anonymous?: boolean 
  }>
  helpfulCount: number
}

export interface NoteStackItem {
  id: string
  chapterId: string
  label: string
  marker: string
  title: string
  kind: "resource" | "top_explanation" | "solved_example" | "confusion" | "ai_note_preview"
  targetContributionId?: string
}

export type UnifiedNotes = {
  id: string
  chapterId: string
  version: number
  generatedAt: string
  overview: string[]
  keyConcepts: Array<{ title: string; explanation: string }>
  definitions: Array<{ term: string; meaning: string }>
  formulas: Array<{ formula: string; meaning: string; note?: string }>
  steps: string[]
  examples: Array<{ title: string; steps: string[]; answer: string }>
  mistakes: string[]
  resources: Array<{ title: string; url: string; why: string }>
  bestNotePhotos: Array<{ alt: string; url?: string }>
  quickRevision: string[]
}

// School membership types
export interface SchoolMembership {
  userId: string
  schoolId: string
  role: 'student' | 'teacher' | 'admin'
  joinedAt: string
}

// User types
export interface User {
  id: string
  name: string
  email: string
  username: string
}
