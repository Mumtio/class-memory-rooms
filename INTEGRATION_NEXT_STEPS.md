# Integration Next Steps: Connect Frontend to Foru.ms Backend

## Current Status

Your Class Memory Rooms application has a **complete integration infrastructure** but is still using mock data. All API routes, service layers, and error handling are implemented and ready to use. You just need to:

1. Configure the Foru.ms API key
2. Set up a database for memberships
3. Update frontend components to use the real API

---

## Step 1: Get Your Foru.ms API Key

### 1.1 Access Your Foru.ms Instance

Visit: https://foru.ms/instances/memory-room/console#/

### 1.2 Locate Your API Key

In the console, find your API key. It should look something like:
```
fms_live_abc123xyz789...
```

### 1.3 Update Environment Variables

Open `class-memory-rooms/frontend/.env.local` and replace:

```env
FORUMMS_API_KEY=your_forumms_api_key_here
```

With your actual key:

```env
FORUMMS_API_KEY=fms_live_abc123xyz789...
```

### 1.4 Verify API Connection

Test the connection by running:

```bash
cd class-memory-rooms
node test-foru-ms-api.js
```

Update the API key in that test file first if needed.

---

## Step 2: Set Up Database for Memberships

The Foru.ms API handles most data, but you need a database for:
- School memberships with roles (student/teacher/admin)
- AI generation tracking for cooldowns

### Option A: Use SQLite (Easiest for Development)

**Install dependencies:**
```bash
cd frontend
npm install better-sqlite3 @types/better-sqlite3
```

**Create database file:**
```bash
mkdir -p frontend/data
```

**Add to `.env.local`:**
```env
DATABASE_URL=file:./data/class-memory-rooms.db
```

### Option B: Use PostgreSQL (Production Ready)

**Install dependencies:**
```bash
cd frontend
npm install pg @types/pg
```

**Set up PostgreSQL database:**
```bash
# Install PostgreSQL if not already installed
# Create database
createdb class_memory_rooms
```

**Add to `.env.local`:**
```env
DATABASE_URL=postgresql://username:password@localhost:5432/class_memory_rooms
```

### 2.1 Create Database Schema

The schema is already documented in `frontend/lib/database.ts`. You need to run the SQL:

```sql
-- School memberships with roles
CREATE TABLE school_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  school_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, school_id)
);

-- AI generation tracking for cooldowns
CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id TEXT NOT NULL,
  generated_by TEXT NOT NULL,
  generator_role TEXT NOT NULL,
  contribution_count INT NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_school_memberships_user ON school_memberships(user_id);
CREATE INDEX idx_school_memberships_school ON school_memberships(school_id);
CREATE INDEX idx_ai_generations_chapter ON ai_generations(chapter_id);
```

**For SQLite:** Create a migration script at `frontend/scripts/init-db.js`
**For PostgreSQL:** Run the SQL directly using `psql`

### 2.2 Update Database Implementation

The file `frontend/lib/database.ts` currently has mock implementations. You need to replace them with real database queries using your chosen database library.

---

## Step 3: Update Frontend Components to Use Real API

Currently, 15+ components import from `@/lib/mock-data`. They need to be updated to use `forumService` instead.

### 3.1 Priority Components to Update

**High Priority (Core Functionality):**

1. **`frontend/lib/auth-store.ts`** - Authentication
   - Replace localStorage with API calls to `/api/forum/auth/*`
   - Use `forumService` methods for login/signup/logout

2. **`frontend/components/school-page-content.tsx`** - School home
   - Replace `subjects` import with `forumService.getSubjects(schoolId)`
   - Add loading states and error handling

3. **`frontend/components/chapter-page-content.tsx`** - Chapter room
   - Replace mock contributions with `forumService.getContributions(chapterId)`
   - Update contribution creation to use `forumService.createContribution()`

4. **`frontend/app/course/[courseId]/page.tsx`** - Course page
   - Replace `getChaptersByCourse()` with `forumService.getChapters(courseId)`

**Medium Priority (Enhanced Features):**

5. **`frontend/components/notes-page-content.tsx`** - AI notes
   - Replace mock notes with `forumService.getUnifiedNotes(chapterId)`
   - Update generation to use `forumService.generateNotes()`

6. **`frontend/app/search/page.tsx`** - Search
   - Replace mock search with `forumService.search(query, schoolId, filters)`

7. **`frontend/components/admin-page-content.tsx`** - Admin dashboard
   - Replace mock members with `forumService.getSchoolMembers(schoolId)`
   - Update role changes to use `forumService.promoteUser()`

**Low Priority (Nice to Have):**

8. **`frontend/app/saved/page.tsx`** - Saved items
   - Keep localStorage for saved IDs
   - Fetch actual content using `forumService` methods

### 3.2 Example: Update School Page

**Before (using mock data):**
```typescript
import { subjects } from "@/lib/mock-data"

export function SchoolPageContent() {
  return (
    <div>
      {subjects.map(subject => (
        <SubjectCard key={subject.id} subject={subject} />
      ))}
    </div>
  )
}
```

**After (using real API):**
```typescript
"use client"

import { useEffect, useState } from "react"
import { forumService } from "@/lib/forum/service"
import type { Subject } from "@/types"

export function SchoolPageContent({ schoolId }: { schoolId: string }) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSubjects() {
      try {
        setLoading(true)
        const data = await forumService.getSubjects(schoolId)
        setSubjects(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load subjects")
      } finally {
        setLoading(false)
      }
    }
    loadSubjects()
  }, [schoolId])

  if (loading) return <div>Loading subjects...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {subjects.map(subject => (
        <SubjectCard key={subject.id} subject={subject} />
      ))}
    </div>
  )
}
```

### 3.3 Pattern for All Components

For each component that uses mock data:

1. **Convert to Client Component** (add `"use client"` if needed)
2. **Add State Management:**
   ```typescript
   const [data, setData] = useState<Type[]>([])
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState<string | null>(null)
   ```

3. **Fetch Data in useEffect:**
   ```typescript
   useEffect(() => {
     async function loadData() {
       try {
         setLoading(true)
         const result = await forumService.methodName(params)
         setData(result)
       } catch (err) {
         setError(err instanceof Error ? err.message : "Failed to load")
       } finally {
         setLoading(false)
       }
     }
     loadData()
   }, [dependencies])
   ```

4. **Add Loading/Error States:**
   ```typescript
   if (loading) return <LoadingSpinner />
   if (error) return <ErrorMessage message={error} />
   ```

5. **Update Actions to Call API:**
   ```typescript
   async function handleCreate(data: CreateDTO) {
     try {
       await forumService.createMethod(data)
       // Refresh data or update state
     } catch (err) {
       // Show error toast
     }
   }
   ```

---

## Step 4: Test the Integration

### 4.1 Start Development Server

```bash
cd frontend
npm run dev
```

### 4.2 Test User Flow

1. **Sign Up** - Create a new account
   - Should call `/api/forum/auth/register`
   - Should create user in Foru.ms

2. **Create School** - Create a new school workspace
   - Should call `/api/forum/schools` POST
   - Should create thread in Foru.ms
   - Should add you as admin in database

3. **Create Subject** - Add a subject to your school
   - Should call `/api/forum/schools/{schoolId}/subjects` POST
   - Should create post in Foru.ms school thread

4. **Create Course** - Add a course under a subject
   - Should create post linked to subject

5. **Create Chapter** - Add a chapter to a course
   - Should create thread in Foru.ms

6. **Add Contribution** - Post a contribution to a chapter
   - Should create post in chapter thread

7. **Generate AI Notes** - Generate unified notes
   - Should call OpenAI API
   - Should create unified_notes post

### 4.3 Check Foru.ms Console

After each action, verify in https://foru.ms/instances/memory-room/console#/ that:
- Threads are created for schools and chapters
- Posts are created for subjects, courses, and contributions
- Metadata is stored correctly

### 4.4 Check Database

Query your database to verify:
```sql
-- Check memberships
SELECT * FROM school_memberships;

-- Check AI generations
SELECT * FROM ai_generations;
```

---

## Step 5: Handle Common Issues

### Issue: "API Key Invalid"

**Solution:** Double-check your API key in `.env.local`. Make sure there are no extra spaces or quotes.

### Issue: "Database Connection Failed"

**Solution:** 
- For SQLite: Ensure the `data/` directory exists
- For PostgreSQL: Verify the database is running and credentials are correct

### Issue: "CORS Errors"

**Solution:** The API routes are in the same Next.js app, so CORS shouldn't be an issue. If you see CORS errors, check that you're calling `/api/forum/*` routes, not the Foru.ms API directly.

### Issue: "Components Not Updating"

**Solution:** Make sure you're using `"use client"` directive for components that use hooks like `useState` and `useEffect`.

### Issue: "Type Errors"

**Solution:** The types are defined in `frontend/types/index.ts`. Make sure your API responses match these types. Use the mappers in `frontend/lib/forum/mappers.ts` to convert Foru.ms responses.

---

## Step 6: Remove Mock Data (Optional)

Once everything is working with the real API:

1. **Keep `mock-data.ts` for Demo Mode**
   - Useful for development without API calls
   - Can be used for testing

2. **Or Remove It Completely**
   ```bash
   rm frontend/lib/mock-data.ts
   ```

3. **Update Imports**
   - Remove all `import ... from "@/lib/mock-data"`
   - Replace with `import ... from "@/types"`

---

## Step 7: Deploy to Production

### 7.1 Environment Variables

Set these in your production environment (Vercel, Netlify, etc.):

```env
FORUMMS_API_URL=https://foru.ms/api/v1
FORUMMS_API_KEY=your_production_api_key
NEXTAUTH_SECRET=your_production_secret_32_chars_min
NEXTAUTH_URL=https://your-domain.com
DATABASE_URL=your_production_database_url
OPENAI_API_KEY=your_openai_key
```

### 7.2 Database Migration

Run the schema creation SQL on your production database.

### 7.3 Deploy

```bash
# If using Vercel
vercel --prod

# If using other platforms, follow their deployment guides
```

---

## Quick Start Checklist

- [ ] Get Foru.ms API key from console
- [ ] Update `.env.local` with API key
- [ ] Choose database (SQLite or PostgreSQL)
- [ ] Create database schema
- [ ] Update `frontend/lib/database.ts` with real queries
- [ ] Update `frontend/lib/auth-store.ts` to use API
- [ ] Update `frontend/components/school-page-content.tsx`
- [ ] Update `frontend/components/chapter-page-content.tsx`
- [ ] Test sign up → create school → create content flow
- [ ] Verify data in Foru.ms console
- [ ] Update remaining components
- [ ] Deploy to production

---

## Need Help?

**Documentation:**
- Integration Status: `INTEGRATION_STATUS.md`
- Integration Blueprint: `FORUMMS_INTEGRATION_BLUEPRINT.md`
- Technical Docs: `TECHNICAL_DOCUMENTATION.md`

**Code References:**
- Service Layer: `frontend/lib/forum/service.ts`
- API Routes: `frontend/app/api/forum/*`
- Database Schema: `frontend/lib/database.ts`

**Testing:**
- Test Foru.ms API: `test-foru-ms-api.js`
- Test Auth: `test-auth-endpoints.js`

---

## Estimated Time

- **Step 1 (API Key):** 5 minutes
- **Step 2 (Database):** 30 minutes
- **Step 3 (Update Components):** 4-6 hours
- **Step 4 (Testing):** 1-2 hours
- **Step 5 (Fixes):** 1-2 hours
- **Total:** 1-2 days of focused work

Good luck! 🚀
