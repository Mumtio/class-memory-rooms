# Seeding and Migration Guide

## 🎯 Goal
1. Seed demo data into Foru.ms database
2. Delete mock-data.ts file
3. Update all pages to fetch from real API

---

## Step 1: Seed Demo Data into Foru.ms

### Run the Seeder Script

```bash
cd frontend
npm install  # Install dotenv if needed
npm run seed
```

This will create:
- ✅ Demo High School (join key: DEMO24)
- ✅ 4 Subjects (Physics, Math, CS, Chemistry)
- ✅ 9 Courses
- ✅ 14 Chapters
- ✅ Sample Contributions

### Verify the Data

1. Register a new user in your app
2. Join demo school with key: **DEMO24**
3. Check that you can see subjects, courses, and chapters

---

## Step 2: Delete Mock Data File

Once the seeder completes successfully:

```bash
cd frontend
rm lib/mock-data.ts
```

This will cause import errors in files still using mock data - that's expected!

---

## Step 3: Fix Import Errors

### Files That Need Updating

Run this to see which files have errors:

```bash
npm run build
```

You'll see errors in these files:
- `app/course/[courseId]/page.tsx`
- `app/school/[schoolId]/subject/[subjectId]/page.tsx`
- `app/search/page.tsx`
- `app/saved/page.tsx`
- `app/page.tsx`
- `components/school-page-content.tsx`
- `components/admin-page-content.tsx`

### Update Pattern

For each file, replace mock data imports with API calls:

**BEFORE:**
```typescript
import { chapters, getCourse } from "@/lib/mock-data"

export default async function Page({ params }) {
  const chapter = chapters.find(ch => ch.id === params.id)
  return <Component chapter={chapter} />
}
```

**AFTER:**
```typescript
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function Page({ params }) {
  const session = await getServerSession(authOptions)
  if (!session) notFound()
  
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/forum/chapters/${params.id}`, {
    cache: 'no-store'
  })
  
  const data = await res.json()
  return <Component chapter={data.chapter} />
}
```

---

## Step 4: Update Each Page

### 4.1 Course Page

**File:** `app/course/[courseId]/page.tsx`

**What it needs:** Fetch chapters for a course

**API Route:** `GET /api/forum/courses/[courseId]/chapters`

**Update:**
```typescript
const res = await fetch(`${baseUrl}/api/forum/courses/${courseId}/chapters`)
const { chapters } = await res.json()
```

### 4.2 Subject Page

**File:** `app/school/[schoolId]/subject/[subjectId]/page.tsx`

**What it needs:** Fetch courses for a subject

**API Route:** `GET /api/forum/schools/[schoolId]/subjects/[subjectId]/courses`

**Update:**
```typescript
const res = await fetch(`${baseUrl}/api/forum/schools/${schoolId}/subjects/${subjectId}/courses`)
const { courses } = await res.json()
```

### 4.3 School Dashboard

**File:** `components/school-page-content.tsx`

**What it needs:** Fetch subjects for a school

**API Route:** `GET /api/forum/schools/[schoolId]/subjects`

**Update:** Convert to client component and use `useEffect` to fetch data

### 4.4 Search Page

**File:** `app/search/page.tsx`

**What it needs:** Search API

**API Route:** `GET /api/forum/search?q=query`

**Update:**
```typescript
const res = await fetch(`${baseUrl}/api/forum/search?q=${searchQuery}`)
const { results } = await res.json()
```

### 4.5 Home Page

**File:** `app/page.tsx`

**What it needs:** Featured chapters (optional)

**Options:**
1. Remove featured chapters section
2. Fetch from a "featured" API endpoint
3. Show empty state with "Join a school to get started"

---

## Step 5: Update Components

### Components Using Types Only (No Changes Needed)

These components only import types, so just update the import path:

```typescript
// Change from:
import type { Contribution } from "@/lib/mock-data"

// To:
import type { Contribution } from "@/types/models"
```

Files:
- `components/contribution-card.tsx`
- `components/chapter-folder-card.tsx`
- `components/course-row.tsx`
- `components/subject-card.tsx`
- `components/note-stack.tsx`
- `components/notes-page-content.tsx`
- `components/unified-notes-preview.tsx`

### Components Using Data (Need API Calls)

**`components/school-page-content.tsx`**
- Convert to client component
- Use `useState` and `useEffect`
- Fetch subjects from API

**`components/admin-page-content.tsx`**
- Convert to client component
- Fetch school data from API

---

## Step 6: Test Everything

### Local Testing

```bash
npm run dev
```

Test each page:
- [ ] Home page loads
- [ ] Can join demo school with DEMO24
- [ ] School dashboard shows subjects
- [ ] Subject page shows courses
- [ ] Course page shows chapters
- [ ] Chapter page shows contributions
- [ ] Notes page works
- [ ] Search works
- [ ] Admin panel works (if admin)

### Build Test

```bash
npm run build
```

Should complete with no errors!

---

## Step 7: Deploy

Once everything works locally:

```bash
git add -A
git commit -m "Complete migration: Remove mock data, use real API everywhere"
git push
```

Vercel will automatically deploy.

---

## 🚨 Troubleshooting

### Seeder fails with "API key required"
- Check `.env.local` has `FORUMMS_API_KEY`
- Make sure you're in the `frontend` directory

### Build fails with "Cannot find module mock-data"
- Good! This means you need to update that file
- Follow Step 3 to fix each file

### Page shows "Not Found"
- Check that the API route exists
- Verify the seeder created the data
- Check browser console for errors

### Data not showing up
- Verify you joined the demo school
- Check that user is authenticated
- Look at Network tab to see API responses

---

## 📋 Quick Checklist

- [ ] Run seeder script (`npm run seed`)
- [ ] Verify data in app (join with DEMO24)
- [ ] Delete `lib/mock-data.ts`
- [ ] Update `app/course/[courseId]/page.tsx`
- [ ] Update `app/school/[schoolId]/subject/[subjectId]/page.tsx`
- [ ] Update `app/search/page.tsx`
- [ ] Update `app/saved/page.tsx`
- [ ] Update `app/page.tsx`
- [ ] Update `components/school-page-content.tsx`
- [ ] Update `components/admin-page-content.tsx`
- [ ] Update type imports in all components
- [ ] Test locally (`npm run dev`)
- [ ] Build successfully (`npm run build`)
- [ ] Commit and push
- [ ] Deploy to Vercel

---

## 💡 Pro Tips

1. **Do one file at a time** - Test after each change
2. **Check API routes exist** - Look in `app/api/forum/` directory
3. **Use browser DevTools** - Network tab shows API calls
4. **Keep types file** - `types/models.ts` is useful for TypeScript
5. **Test with real user** - Register and join demo school

---

## 🎉 Success Criteria

When done, your app should:
- ✅ Have no mock-data.ts file
- ✅ Fetch all data from Foru.ms API
- ✅ Build without errors
- ✅ Work with real demo school data
- ✅ Be ready for production deployment

---

**Need help?** Check `ARCHITECTURE_GUIDE.md` for understanding the app flow!
