# Example: Migrating Components from Mock Data to Real API

This document shows **before and after** examples of migrating components from mock data to the real Foru.ms API.

---

## Example 1: School Page (Subject List)

### BEFORE: Using Mock Data

```typescript
// frontend/components/school-page-content.tsx
"use client"

import { SubjectCard } from "@/components/subject-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { school, subjects } from "@/lib/mock-data"  // ❌ Mock data
import { Search, Bookmark, Shield, ArrowLeft } from "lucide-react"

export function SchoolPageContent() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">{school.name}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {subjects.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </div>
      </div>
    </div>
  )
}
```

### AFTER: Using Real API

```typescript
// frontend/components/school-page-content.tsx
"use client"

import { useEffect, useState } from "react"
import { SubjectCard } from "@/components/subject-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { forumService } from "@/lib/forum/service"  // ✅ Real API service
import type { Subject } from "@/types"
import { Search, Bookmark, Shield, ArrowLeft, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SchoolPageContentProps {
  schoolId: string
  schoolName: string
}

export function SchoolPageContent({ schoolId, schoolName }: SchoolPageContentProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function loadSubjects() {
      try {
        setLoading(true)
        setError(null)
        const data = await forumService.getSubjects(schoolId)
        setSubjects(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load subjects"
        setError(message)
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadSubjects()
  }, [schoolId, toast])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">{schoolName}</h1>
        
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading subjects...</span>
          </div>
        )}

        {error && !loading && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
            <p className="font-medium">Failed to load subjects</p>
            <p className="text-sm mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && subjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No subjects yet. Create one to get started!</p>
          </div>
        )}

        {!loading && !error && subjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {subjects.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

**Key Changes:**
1. ✅ Added `useState` for data, loading, and error states
2. ✅ Added `useEffect` to fetch data on mount
3. ✅ Replaced mock import with `forumService.getSubjects()`
4. ✅ Added loading spinner
5. ✅ Added error handling with retry button
6. ✅ Added empty state
7. ✅ Added toast notifications for errors

---

## Example 2: Chapter Page (Contributions)

### BEFORE: Using Mock Data

```typescript
// frontend/components/chapter-page-content.tsx
"use client"

import { ContributionCard } from "@/components/contribution-card"
import { contributionsByChapter } from "@/lib/mock-data"  // ❌ Mock data

export function ChapterPageContent({ chapterId }: { chapterId: string }) {
  const contributions = contributionsByChapter[chapterId] || []

  return (
    <div className="space-y-4">
      {contributions.map((contribution) => (
        <ContributionCard key={contribution.id} contribution={contribution} />
      ))}
    </div>
  )
}
```

### AFTER: Using Real API

```typescript
// frontend/components/chapter-page-content.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { ContributionCard } from "@/components/contribution-card"
import { ContributionComposerModal } from "@/components/contribution-composer-modal"
import { forumService } from "@/lib/forum/service"  // ✅ Real API service
import type { Contribution, ContributionType } from "@/types"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-store"

interface ChapterPageContentProps {
  chapterId: string
}

export function ChapterPageContent({ chapterId }: ChapterPageContentProps) {
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showComposer, setShowComposer] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const loadContributions = useCallback(async () => {
    try {
      setLoading(true)
      const data = await forumService.getContributions(chapterId)
      setContributions(data)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load contributions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [chapterId, toast])

  useEffect(() => {
    loadContributions()
  }, [loadContributions])

  const handleCreateContribution = async (data: {
    type: ContributionType
    title?: string
    content: string
    imageUrl?: string
    links?: string[]
    anonymous: boolean
  }) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to contribute",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      await forumService.createContribution(chapterId, {
        ...data,
        title: data.title || "",
      })
      
      toast({
        title: "Success",
        description: "Contribution added successfully",
      })
      
      setShowComposer(false)
      
      // Reload contributions to show the new one
      await loadContributions()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create contribution",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading contributions...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Contributions</h2>
        <Button onClick={() => setShowComposer(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Contribution
        </Button>
      </div>

      {contributions.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground">No contributions yet. Be the first to contribute!</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setShowComposer(true)}
          >
            Add First Contribution
          </Button>
        </div>
      ) : (
        contributions.map((contribution) => (
          <ContributionCard 
            key={contribution.id} 
            contribution={contribution}
            onUpdate={loadContributions}  // Refresh after updates
          />
        ))
      )}

      <ContributionComposerModal
        open={showComposer}
        onOpenChange={setShowComposer}
        onSubmit={handleCreateContribution}
        submitting={submitting}
      />
    </div>
  )
}
```

**Key Changes:**
1. ✅ Added state management for contributions, loading, and submission
2. ✅ Created `loadContributions` function to fetch from API
3. ✅ Added `handleCreateContribution` to submit new contributions
4. ✅ Added loading state with spinner
5. ✅ Added empty state with call-to-action
6. ✅ Added contribution composer modal
7. ✅ Added refresh after creating contribution
8. ✅ Added authentication check

---

## Example 3: Authentication (Login/Signup)

### BEFORE: Using localStorage

```typescript
// frontend/lib/auth-store.ts
"use client"

import { useState, useEffect } from "react"

const STORAGE_KEY = "class-memory-rooms-auth"

export function createSchool(schoolName: string, userName: string, userEmail: string) {
  const user = {
    id: `user-${crypto.randomUUID()}`,
    name: userName,
    email: userEmail,
    schoolMemberships: {
      [schoolName]: { role: "admin", schoolName, joinedAt: new Date().toISOString() }
    }
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, isAuthenticated: true }))
  return user
}
```

### AFTER: Using Real API

```typescript
// frontend/lib/auth-store.ts
"use client"

import { useState, useEffect } from "react"
import { forumService } from "@/lib/forum/service"

export async function createSchool(
  schoolName: string, 
  schoolDescription: string,
  userName: string, 
  userEmail: string
) {
  try {
    // First, register the user if not already registered
    let userId: string
    try {
      const registerResponse = await fetch("/api/forum/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userName, email: userEmail, password: "temp" }),
      })
      
      if (!registerResponse.ok) {
        throw new Error("Failed to register user")
      }
      
      const { userId: newUserId } = await registerResponse.json()
      userId = newUserId
    } catch (err) {
      // User might already exist, try to login
      const loginResponse = await fetch("/api/forum/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, password: "temp" }),
      })
      
      if (!loginResponse.ok) {
        throw new Error("Failed to authenticate user")
      }
      
      const { userId: existingUserId } = await loginResponse.json()
      userId = existingUserId
    }
    
    // Create the school
    const { schoolId, joinKey } = await forumService.createSchool(
      schoolName,
      schoolDescription,
      userId
    )
    
    // Return user data with school membership
    return {
      id: userId,
      name: userName,
      email: userEmail,
      schoolMemberships: {
        [schoolId]: {
          role: "admin" as const,
          schoolName,
          joinedAt: new Date().toISOString(),
        },
      },
      currentSchoolId: schoolId,
      joinKey,  // Return join key for display
    }
  } catch (error) {
    console.error("Failed to create school:", error)
    throw error
  }
}

export async function joinSchool(
  schoolKey: string,
  userName: string,
  userEmail: string
) {
  try {
    // Register or login user
    let userId: string
    try {
      const registerResponse = await fetch("/api/forum/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userName, email: userEmail, password: "temp" }),
      })
      
      if (!registerResponse.ok) {
        throw new Error("Failed to register user")
      }
      
      const { userId: newUserId } = await registerResponse.json()
      userId = newUserId
    } catch (err) {
      const loginResponse = await fetch("/api/forum/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, password: "temp" }),
      })
      
      if (!loginResponse.ok) {
        throw new Error("Failed to authenticate user")
      }
      
      const { userId: existingUserId } = await loginResponse.json()
      userId = existingUserId
    }
    
    // Join the school
    const { schoolId, role } = await forumService.joinSchool(userId, schoolKey)
    
    // Get school details
    const schools = await forumService.getSchoolsForUser(userId)
    const school = schools.find(s => s.id === schoolId)
    
    if (!school) {
      throw new Error("School not found after joining")
    }
    
    return {
      success: true,
      user: {
        id: userId,
        name: userName,
        email: userEmail,
        schoolMemberships: {
          [schoolId]: {
            role,
            schoolName: school.name,
            joinedAt: new Date().toISOString(),
          },
        },
        currentSchoolId: schoolId,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to join school",
    }
  }
}
```

**Key Changes:**
1. ✅ Replaced localStorage with API calls
2. ✅ Added user registration/login flow
3. ✅ Used `forumService` methods for school operations
4. ✅ Added proper error handling
5. ✅ Returns actual data from backend

---

## Example 4: AI Note Generation

### BEFORE: Mock Generation

```typescript
// frontend/components/regenerate-modal.tsx
async function handleGenerate() {
  // Mock: Just show success
  toast({ title: "AI notes generated!" })
}
```

### AFTER: Real API Call

```typescript
// frontend/components/regenerate-modal.tsx
"use client"

import { useState } from "react"
import { forumService } from "@/lib/forum/service"
import { useAuth } from "@/lib/auth-store"
import { useActiveSchool } from "@/lib/active-school-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RegenerateModalProps {
  chapterId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export fun