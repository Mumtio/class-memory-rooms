# Quick Demo Implementation Guide

**Goal:** Connect 2-3 key components to Foru.ms API to demonstrate the integration working.

**Time:** 2-3 hours  
**Difficulty:** Medium  
**Result:** Working demo showing real data from Foru.ms

---

## 🎯 What We'll Build

A working demo that:
1. ✅ Fetches real Demo School data from Foru.ms
2. ✅ Displays real MATH101 chapter with contributions
3. ✅ Shows the service layer in action
4. ✅ Demonstrates error handling and loading states

---

## 📋 Implementation Steps

### Step 1: Update School Page (30 min)

**File:** `frontend/components/school-page-content.tsx`

**Current:** Uses `import { subjects } from "@/lib/mock-data"`

**Update to:**

```typescript
"use client"

import { useEffect, useState } from "react"
import { forumService } from "@/lib/forum/service"
import type { Subject } from "@/types"
import { SubjectCard } from "@/components/subject-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Bookmark, Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useActiveSchool } from "@/lib/active-school-context"

export function SchoolPageContent() {
  const { currentSchool } = useActiveSchool()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSubjects() {
      if (!currentSchool?.id) return
      
      try {
        setLoading(true)
        setError(null)
        
        // Fetch real data from Foru.ms
        const data = await forumService.getSubjects(currentSchool.id)
        setSubjects(data)
      } catch (err) {
        console.error("Failed to load subjects:", err)
        setError(err instanceof Error ? err.message : "Failed to load subjects")
        
        // Fallback to mock data for demo
        const { subjects: mockSubjects } = await import("@/lib/mock-data")
        setSubjects(mockSubjects)
      } finally {
        setLoading(false)
      }
    }

    loadSubjects()
  }, [currentSchool?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading subjects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Mode Banner */}
      {error && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2">
          <p className="text-sm text-yellow-600 dark:text-yellow-400 text-center">
            ⚠️ Demo Mode: Using fallback data. {error}
          </p>
        </div>
      )}

      {/* Rest of your existing UI */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {currentSchool?.name || "Demo High School"}
            </h1>
            <p className="text-muted-foreground">
              {subjects.length} subjects • {currentSchool?.role || "student"}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/search">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/saved">
                <Bookmark className="h-4 w-4 mr-2" />
                Saved
              </Link>
            </Button>
          </div>
        </div>

        {/* Subject Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </div>

        {subjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No subjects found</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Key Changes:**
- ✅ Added `"use client"` directive
- ✅ Added state management (loading, error, data)
- ✅ Fetch from `forumService.getSubjects()`
- ✅ Fallback to mock data if API fails
- ✅ Loading spinner
- ✅ Demo mode banner when using fallback

---

### Step 2: Update Chapter Page (45 min)

**File:** `frontend/components/chapter-page-content.tsx`

**Add at the top:**

```typescript
"use client"

import { useEffect, useState } from "react"
import { forumService } from "@/lib/forum/service"
import type { Contribution } from "@/types"
```

**Replace the contributions section:**

```typescript
export function ChapterPageContent({ chapterId }: { chapterId: string }) {
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadContributions() {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch real contributions from Foru.ms
        const data = await forumService.getContributions(chapterId)
        setContributions(data)
      } catch (err) {
        console.error("Failed to load contributions:", err)
        setError(err instanceof Error ? err.message : "Failed to load contributions")
        
        // Fallback to mock data
        const { contributionsByChapter } = await import("@/lib/mock-data")
        setContributions(contributionsByChapter[chapterId] || [])
      } finally {
        setLoading(false)
      }
    }

    loadContributions()
  }, [chapterId])

  // Group contributions by type
  const groupedContributions = {
    takeaway: contributions.filter(c => c.type === "takeaway"),
    notes_photo: contributions.filter(c => c.type === "notes_photo"),
    resource: contributions.filter(c => c.type === "resource"),
    solved_example: contributions.filter(c => c.type === "solved_example"),
    confusion: contributions.filter(c => c.type === "confusion"),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading contributions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Mode Banner */}
      {error && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2">
          <p className="text-sm text-yellow-600 dark:text-yellow-400 text-center">
            ⚠️ Demo Mode: Using fallback data. {error}
          </p>
        </div>
      )}

      {/* Rest of your existing UI with grouped contributions */}
      <div className="container mx-auto px-4 py-8">
        {/* Your existing chapter header */}
        
        {/* Contributions by type */}
        <div className="space-y-8">
          {Object.entries(groupedContributions).map(([type, items]) => (
            items.length > 0 && (
              <div key={type}>
                <h3 className="text-xl font-semibold mb-4 capitalize">
                  {type.replace('_', ' ')}s ({items.length})
                </h3>
                <div className="space-y-4">
                  {items.map(contribution => (
                    <ContributionCard 
                      key={contribution.id} 
                      contribution={contribution} 
                    />
                  ))}
                </div>
              </div>
            )
          ))}
        </div>

        {contributions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No contributions yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

### Step 3: Test the Demo (15 min)

**Start the dev server:**
```bash
cd frontend
npm run dev
```

**Test Flow:**
1. Navigate to `http://localhost:3000`
2. Click "Get Started" or "Enter Demo School"
3. Should see the school page with subjects
4. Click on a subject → course → chapter
5. Should see contributions from Foru.ms

**Expected Behavior:**
- ✅ Loading spinners appear briefly
- ✅ Real data loads from Foru.ms (if API works)
- ✅ Fallback to mock data if API fails
- ✅ Demo mode banner shows if using fallback
- ✅ No console errors

---

### Step 4: Add API Health Check (15 min)

**File:** `frontend/components/navbar.tsx`

**Add health indicator:**

```typescript
"use client"

import { useEffect, useState } from "react"
import { forumService } from "@/lib/forum/service"

export function Navbar() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'healthy' | 'degraded' | 'unhealthy'>('checking')

  useEffect(() => {
    async function checkHealth() {
      try {
        const health = await forumService.checkHealth()
        setApiStatus(health.status)
      } catch {
        setApiStatus('unhealthy')
      }
    }

    checkHealth()
    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Your existing navbar content */}
        
        {/* API Status Indicator */}
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${
            apiStatus === 'healthy' ? 'bg-green-500' :
            apiStatus === 'degraded' ? 'bg-yellow-500' :
            apiStatus === 'unhealthy' ? 'bg-red-500' :
            'bg-gray-500 animate-pulse'
          }`} />
          <span className="text-xs text-muted-foreground">
            {apiStatus === 'checking' ? 'Checking...' :
             apiStatus === 'healthy' ? 'API Connected' :
             apiStatus === 'degraded' ? 'API Slow' :
             'API Offline'}
          </span>
        </div>
      </div>
    </nav>
  )
}
```

---

## 🎬 Demo Script

**1. Show the Code (2 min)**
- Open `frontend/lib/forum/service.ts`
- Highlight the `getSubjects()` and `getContributions()` methods
- Show error handling and retry logic

**2. Show the API Test (1 min)**
- Run `node test-foru-ms-api.js` in terminal
- Show the demo data response
- Point out the `extendedData` fields

**3. Show the App (3 min)**
- Open browser to `http://localhost:3000`
- Navigate: Home → Demo School → Subject → Course → Chapter
- Show contributions loading from Foru.ms
- Point out the API status indicator

**4. Show Fallback Behavior (1 min)**
- Temporarily break the API key in `.env.local`
- Refresh the page
- Show the demo mode banner
- Show fallback to mock data

**5. Explain Architecture (2 min)**
- Open `FORUMMS_INTEGRATION_BLUEPRINT.md`
- Show the entity mapping diagram
- Explain the proxy pattern (API routes hide the API key)

---

## 🐛 Troubleshooting

**Issue: "Failed to load subjects"**
- Check `.env.local` has correct API key
- Run `node test-foru-ms-api.js` to verify connection
- Check browser console for detailed error

**Issue: "Loading forever"**
- Check if dev server is running
- Check if API routes are accessible at `/api/forum/*`
- Look for CORS errors in console

**Issue: "Type errors"**
- Run `npm run build` to check TypeScript errors
- Make sure types in `frontend/types/index.ts` match API responses

**Issue: "Components not updating"**
- Make sure you added `"use client"` directive
- Check if `useEffect` dependencies are correct
- Clear browser cache and restart dev server

---

## ✅ Success Criteria

After implementation, you should have:
- ✅ School page loading real subjects from Foru.ms
- ✅ Chapter page loading real contributions from Foru.ms
- ✅ Loading states showing during data fetch
- ✅ Error handling with fallback to mock data
- ✅ Demo mode banner when API fails
- ✅ API health indicator in navbar
- ✅ No console errors
- ✅ Smooth user experience

---

## 🚀 Next Steps After Demo

**If you get write API key:**
1. Update `.env.local` with new key
2. Test creating schools, chapters, contributions
3. Implement contribution creation modal
4. Set up database for memberships
5. Deploy to production

**For hackathon presentation:**
1. Record a video demo
2. Take screenshots of key features
3. Update README with demo link
4. Prepare architecture diagrams
5. Practice the demo script

---

**Estimated Time:** 2-3 hours total
**Difficulty:** Medium (requires React/TypeScript knowledge)
**Result:** Working demo showing Foru.ms integration

Good luck! 🎉
