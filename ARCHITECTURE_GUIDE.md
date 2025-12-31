# Class Memory Rooms - Architecture Guide

## 📋 Table of Contents
1. [Application Flow Overview](#application-flow-overview)
2. [Key Files to Read (In Order)](#key-files-to-read-in-order)
3. [Routing Structure](#routing-structure)
4. [Frontend → Backend Communication](#frontend--backend-communication)
5. [Data Flow Diagram](#data-flow-diagram)

---

## 🔄 Application Flow Overview

```
User Browser
    ↓
Next.js Frontend (React Components)
    ↓
Service Layer (lib/forum/service.ts)
    ↓
API Routes (app/api/*)
    ↓
Foru.ms Client (lib/forum/client.ts)
    ↓
Foru.ms Backend API (https://foru.ms/api/v1)
```

---

## 📚 Key Files to Read (In Order)

### **Phase 1: Understanding the Entry Points**

#### 1. **Root Layout & Pages**
- `frontend/app/layout.tsx` - Root layout, providers, auth wrapper
- `frontend/app/page.tsx` - Home page (redirects to gateway)
- `frontend/app/gateway/page.tsx` - Main entry point (create/join school)

#### 2. **Authentication Flow**
- `frontend/lib/auth.ts` - NextAuth configuration, session management
- `frontend/app/api/auth/[...nextauth]/route.ts` - NextAuth API handler
- `frontend/app/api/auth/login/route.ts` - Login endpoint
- `frontend/app/api/auth/register/route.ts` - Registration endpoint
- `frontend/app/login/page.tsx` - Login UI
- `frontend/app/signup/page.tsx` - Signup UI

### **Phase 2: Understanding Backend Communication**

#### 3. **Core Backend Client**
- `frontend/lib/forum/client.ts` - **START HERE!** Main Foru.ms API client
  - All HTTP requests to Foru.ms
  - Authentication headers
  - Thread/Post CRUD operations

#### 4. **Service Layer (Frontend → API Routes)**
- `frontend/lib/forum/service.ts` - Frontend service layer
  - Wraps API route calls
  - Used by React components
  - Handles loading states and errors

#### 5. **Data Mapping**
- `frontend/lib/forum/mappers.ts` - Transforms Foru.ms data to app models
  - Maps threads → schools/courses/chapters
  - Maps posts → contributions/notes

### **Phase 3: Understanding API Routes (Backend Logic)**

#### 6. **School Management**
- `frontend/app/api/forum/schools/route.ts` - Get/Create schools
- `frontend/app/api/forum/schools/join/route.ts` - Join school by key
- `frontend/app/api/forum/schools/[schoolId]/subjects/route.ts` - Get/Create subjects
- `frontend/app/api/forum/schools/[schoolId]/members/route.ts` - Get school members

#### 7. **Course & Chapter Management**
- `frontend/app/api/forum/courses/[courseId]/chapters/route.ts` - Get/Create chapters
- `frontend/app/api/forum/chapters/[chapterId]/route.ts` - Get chapter details
- `frontend/app/api/forum/chapters/[chapterId]/contributions/route.ts` - Add contributions

#### 8. **AI Note Generation**
- `frontend/app/api/forum/chapters/[chapterId]/generate-notes/route.ts` - Generate AI notes
- `frontend/app/api/forum/chapters/[chapterId]/notes/route.ts` - Get latest notes
- `frontend/lib/ai-generation.ts` - AI generation logic with Gemini

### **Phase 4: Understanding Frontend Pages**

#### 9. **School Pages**
- `frontend/app/school/[schoolId]/page.tsx` - School dashboard
- `frontend/app/school/[schoolId]/subject/[subjectId]/page.tsx` - Subject view

#### 10. **Course & Chapter Pages**
- `frontend/app/course/[courseId]/page.tsx` - Course view with chapters
- `frontend/app/chapter/[chapterId]/page.tsx` - Chapter contributions
- `frontend/app/chapter/[chapterId]/notes/page.tsx` - AI-generated notes

### **Phase 5: Understanding State & Permissions**

#### 11. **State Management**
- `frontend/lib/auth-store.ts` - Zustand store for auth state
- `frontend/hooks/use-auth.ts` - Auth hook for components

#### 12. **Permissions & Database**
- `frontend/lib/permissions.ts` - Role-based permission checks
- `frontend/lib/database.ts` - Foru.ms-based data storage (memberships, AI tracking)
- `frontend/lib/permission-middleware.ts` - API route permission middleware

---

## 🗺️ Routing Structure

### **Next.js App Router (File-based Routing)**

```
/                                    → app/page.tsx (redirects to /gateway)
/gateway                             → app/gateway/page.tsx
/gateway/create                      → app/gateway/create/page.tsx
/gateway/join                        → app/gateway/join/page.tsx

/login                               → app/login/page.tsx
/signup                              → app/signup/page.tsx

/school/[schoolId]                   → app/school/[schoolId]/page.tsx
/school/[schoolId]/admin             → app/school/[schoolId]/admin/page.tsx
/school/[schoolId]/subject/[subjectId] → app/school/[schoolId]/subject/[subjectId]/page.tsx

/course/[courseId]                   → app/course/[courseId]/page.tsx
/chapter/[chapterId]                 → app/chapter/[chapterId]/page.tsx
/chapter/[chapterId]/notes           → app/chapter/[chapterId]/notes/page.tsx

/search                              → app/search/page.tsx
/saved                               → app/saved/page.tsx
```

### **API Routes**

```
POST /api/auth/register              → Register new user
POST /api/auth/login                 → Login user
GET  /api/auth/[...nextauth]         → NextAuth handler

GET  /api/forum/schools              → Get user's schools
POST /api/forum/schools              → Create new school
POST /api/forum/schools/join         → Join school by key

GET  /api/forum/schools/[schoolId]/subjects → Get subjects
POST /api/forum/schools/[schoolId]/subjects → Create subject

GET  /api/forum/schools/[schoolId]/subjects/[subjectId]/courses → Get courses
POST /api/forum/schools/[schoolId]/subjects/[subjectId]/courses → Create course

GET  /api/forum/courses/[courseId]/chapters → Get chapters
POST /api/forum/courses/[courseId]/chapters → Create chapter

GET  /api/forum/chapters/[chapterId] → Get chapter details
GET  /api/forum/chapters/[chapterId]/contributions → Get contributions
POST /api/forum/chapters/[chapterId]/contributions → Add contribution

POST /api/forum/chapters/[chapterId]/generate-notes → Generate AI notes
GET  /api/forum/chapters/[chapterId]/notes → Get latest notes

GET  /api/forum/search               → Search content
```

---

## 🔗 Frontend → Backend Communication

### **Pattern 1: Component → Service → API Route → Foru.ms**

Example: Creating a school

```typescript
// 1. Component calls service
// frontend/app/gateway/create/page.tsx
import { createSchool } from '@/lib/forum/service'

const handleCreate = async () => {
  const result = await createSchool(name, description)
}

// 2. Service calls API route
// frontend/lib/forum/service.ts
export async function createSchool(name: string, description: string) {
  const response = await fetch('/api/forum/schools', {
    method: 'POST',
    body: JSON.stringify({ name, description })
  })
  return response.json()
}

// 3. API route calls Foru.ms client
// frontend/app/api/forum/schools/route.ts
import { forumClient } from '@/lib/forum/client'

export async function POST(request: NextRequest) {
  const thread = await forumClient.createThread({
    title: name,
    content: description,
    extendedData: { type: 'school', joinKey }
  })
}

// 4. Foru.ms client makes HTTP request
// frontend/lib/forum/client.ts
async createThread(data: CreateThreadData) {
  const response = await fetch(`${this.baseUrl}/threads`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
}
```

### **Pattern 2: Authentication Flow**

```typescript
// 1. User submits login form
// frontend/app/login/page.tsx
const result = await signIn('credentials', { username, password })

// 2. NextAuth calls credentials provider
// frontend/lib/auth.ts
CredentialsProvider({
  async authorize(credentials) {
    // Call Foru.ms login
    const response = await fetch('https://foru.ms/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
    return { id: user.id, token: user.token }
  }
})

// 3. Session stored and used for subsequent requests
// All API routes check session
const session = await getServerSession(authOptions)
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

## 📊 Data Flow Diagram

### **School Creation Flow**

```
User fills form
    ↓
[gateway/create/page.tsx]
    ↓
createSchool() in service.ts
    ↓
POST /api/forum/schools
    ↓
Check authentication (getServerSession)
    ↓
Generate join key
    ↓
forumClient.createThread()
    ↓
POST https://foru.ms/api/v1/threads
    ↓
Store membership in db.addSchoolMembership()
    ↓
Return schoolId & joinKey
    ↓
Redirect to /school/[schoolId]
```

### **Chapter Contribution Flow**

```
User adds contribution
    ↓
[chapter/[chapterId]/page.tsx]
    ↓
addContribution() in service.ts
    ↓
POST /api/forum/chapters/[chapterId]/contributions
    ↓
Check authentication & permissions
    ↓
forumClient.createPost()
    ↓
POST https://foru.ms/api/v1/posts
    ↓
Return contribution data
    ↓
Update UI with new contribution
```

### **AI Note Generation Flow**

```
User clicks "Generate Notes"
    ↓
[chapter/[chapterId]/page.tsx]
    ↓
generateNotes() in service.ts
    ↓
POST /api/forum/chapters/[chapterId]/generate-notes
    ↓
Check authentication & permissions
    ↓
Check cooldown period (db.getLastAIGeneration)
    ↓
Count contributions (forumClient.getPosts)
    ↓
Fetch all contributions
    ↓
Call Gemini API (lib/ai-generation.ts)
    ↓
Create unified notes post (forumClient.createPost)
    ↓
Track generation (db.trackAIGeneration)
    ↓
Return generated notes
    ↓
Display notes to user
```

---

## 🔍 Key Concepts

### **1. Foru.ms Data Model**

Everything in Foru.ms is either a **Thread** or a **Post**:

- **Thread** = Container (School, Chapter)
- **Post** = Content (Subject, Course, Contribution, Notes)

We use `extendedData.type` to differentiate:
```typescript
extendedData: {
  type: 'school' | 'subject' | 'course' | 'chapter' | 'contribution' | 'unified_notes'
}
```

### **2. Authentication**

- Uses **NextAuth.js** for session management
- Stores **Foru.ms JWT token** in session
- All API routes check session before processing
- Token passed to Foru.ms client for authenticated requests

### **3. Permissions**

- Stored in `db.getUserSchoolMemberships()` (Foru.ms-based)
- Roles: `student`, `teacher`, `admin`
- Checked in API routes via `checkSchoolMembership()`
- Demo school has special restrictions

### **4. State Management**

- **Server State**: Fetched from API routes (React Query could be added)
- **Client State**: Zustand store for auth (`auth-store.ts`)
- **Session State**: NextAuth session (server-side)

---

## 🚀 Quick Start for Debugging

### **To trace a feature:**

1. **Find the UI component** in `app/*/page.tsx`
2. **Find the service call** in `lib/forum/service.ts`
3. **Find the API route** in `app/api/forum/*/route.ts`
4. **Find the Foru.ms client method** in `lib/forum/client.ts`

### **To add a new feature:**

1. **Add API route** in `app/api/forum/*/route.ts`
2. **Add service method** in `lib/forum/service.ts`
3. **Add UI component** in `app/*/page.tsx`
4. **Update types** if needed in `types/*.ts`

---

## 📝 Common Issues & Solutions

### **Issue: "Unauthorized" errors**
- Check: `getServerSession(authOptions)` in API route
- Check: User is logged in (`useSession()` in component)
- Check: Token is valid in Foru.ms

### **Issue: "Module not found"**
- Use `@/` path alias instead of relative imports
- Check: `tsconfig.json` has correct paths configuration

### **Issue: Data not updating**
- Check: API route returns updated data
- Check: Component refetches after mutation
- Check: Foru.ms API call succeeded

### **Issue: Permission denied**
- Check: User has correct role in school
- Check: `checkSchoolMembership()` is called
- Check: Demo school restrictions

---

## 🎯 Next Steps

1. Read files in the order listed above
2. Trace one complete flow (e.g., school creation)
3. Use browser DevTools Network tab to see API calls
4. Add console.logs to understand data flow
5. Test locally before deploying

---

**Need help?** Check the Foru.ms API docs or review the requirements in `.kiro/specs/foru-ms-integration/requirements.md`
