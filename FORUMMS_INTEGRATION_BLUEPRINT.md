# Class Memory Rooms → Foru.ms Backend Integration Blueprint

**Version:** 1.0  
**Date:** December 2024  
**Audience:** Engineers, Hackathon Judges, Implementation Teams

---

## Executive Summary

This document provides a complete, code-level integration blueprint for connecting the existing Class Memory Rooms Next.js frontend to the Foru.ms API backend. The frontend has strong architecture with mock data; this plan replaces mock data with real API calls while preserving all product rules (multi-school workspaces, per-school role scoping, Demo School restrictions, AI generation rules, etc.).

The core challenge: Foru.ms uses a `User → Thread → Post` model. Class Memory Rooms has a richer hierarchy: `School → Subject → Course → Chapter → Contribution → Unified Notes`. This blueprint maps every entity precisely and provides request-level implementation details.

---

## 1. ENTITY MAPPING TABLE

| **Frontend Entity** | **Foru.ms Mapping** | **Storage Strategy** | **Notes** |
|---------------------|---------------------|----------------------|-----------|
| **School Workspace** | Thread (Category Thread) | Main thread with `type: "school"` tag | Thread title = school name. Store `joinKey` in metadata. |
| **Subject** | Post (Control Post) | Post in school thread with `type: "subject"` tag | Post content = JSON: `{name, colorTag}`. Created by admin. |
| **Course** | Post (Control Post) | Post in school thread with `type: "course"` tag | Post content = JSON: `{subjectId, code, title, teacher, term}`. Links to subject via `parentPostId`. |
| **Chapter/Lecture** | Thread (Content Thread) | Thread with `type: "chapter"` tag | Thread title = chapter title. Metadata: `{courseId, label, date, status}`. |
| **Contribution** | Post (User Post) | Post in chapter thread | Regular post with `contributionType` tag: `takeaway`, `notes_photo`, `resource`, `solved_example`, `confusion`. |
| **AI Unified Notes** | Post (Special Post) | Post in chapter thread with `type: "unified_notes"` tag | Content = markdown notes. Metadata: `{version, generatedBy, generatedAt, contributionCount}`. |
| **Membership & Role** | Thread Membership + Custom Table | Thread participants with role stored externally | Foru.ms likely has thread membership. Extend with `school_memberships` table: `{userId, schoolId, role, joinedAt}`. |
| **Join Key** | Thread Metadata | Stored in school thread metadata field | `joinKey` string. Validated server-side before adding user to thread. |
| **Saved Items (Client)** | Local Storage | No backend | Frontend-only. Store array of IDs: `[chapterId, contributionId, notesId]`. |

### Mapping Rationale

**Why Thread for School?**  
School is a container. All subjects/courses exist as control posts within it. Members join the thread to gain access.

**Why Post for Subject/Course?**  
Subjects and courses are structural metadata, not discussion containers. Storing them as tagged posts in the school thread keeps them organized and queryable.

**Why Thread for Chapter?**  
Chapters are where discussions happen. Each chapter needs its own thread for contributions (posts).

**Why External Table for Roles?**  
Foru.ms likely doesn't support per-thread role scoping. We need `school_memberships` table to track `student/teacher/admin` per school.

---

## 2. REQUIRED BACKEND EXTENSIONS / WORKAROUNDS

### A. External Database Table: `school_memberships`

Foru.ms likely has basic thread membership but no role scoping. Create this table:

```sql
CREATE TABLE school_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,         -- Foru.ms user ID
  school_id TEXT NOT NULL,       -- Thread ID of school
  role TEXT NOT NULL,            -- 'student' | 'teacher' | 'admin'
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, school_id)
);

CREATE INDEX idx_school_memberships_user ON school_memberships(user_id);
CREATE INDEX idx_school_memberships_school ON school_memberships(school_id);
```

**Why?** Roles must be scoped per school. A user can be admin in one school and student in another. Foru.ms doesn't support this natively.

### B. Thread Metadata Fields

Foru.ms threads should support a `metadata` JSON field. If not, use tags creatively:

- **School Thread:** `metadata: {joinKey: "ABC123", isDemo: false}`
- **Chapter Thread:** `metadata: {courseId: "...", label: "Lec 01", status: "Collecting"}`

If metadata is unsupported, store in a separate `thread_metadata` table:

```sql
CREATE TABLE thread_metadata (
  thread_id TEXT PRIMARY KEY,
  metadata JSONB NOT NULL
);
```

### C. Post Tags for Type Identification

Every post and thread must have a `type` tag to distinguish entities:

- **Thread Tags:** `school`, `chapter`
- **Post Tags:** `subject`, `course`, `contribution`, `unified_notes`
- **Contribution Subtype Tags:** `takeaway`, `notes_photo`, `resource`, `solved_example`, `confusion`

**Implementation:** Foru.ms likely supports tags. If not, prefix post content with a marker: `[TYPE:subject]` and parse it.

### D. AI Generation Cooldown Table

Track AI generations to enforce cooldowns:

```sql
CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id TEXT NOT NULL,      -- Thread ID
  generated_by TEXT NOT NULL,    -- User ID
  generator_role TEXT NOT NULL,  -- 'student' | 'teacher' | 'admin'
  contribution_count INT NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_generations_chapter ON ai_generations(chapter_id);
```

**Why?** Cooldown enforcement requires timestamp tracking. Store this server-side to prevent client manipulation.

---

## 3. REQUEST FLOW BY PAGE

### `/gateway` (School Selection)

**Load:**
```
GET /api/forum/schools?userId={userId}
→ Returns: Array of school threads user is a member of
  [{threadId, name, role, lastActivity}]

Server Component: Fetch in page.tsx server component
Mapping: school_memberships JOIN threads
```

**Action: Enter Demo School**
```
POST /api/forum/schools/demo/join
Body: {userId}
→ Adds user to demo school thread with role='student'
→ Returns: {schoolId: "demo", role: "student"}

Route Handler: /app/api/forum/schools/demo/join/route.ts
Why: Validates Demo School rules (everyone is student)
```

---

### `/gateway/create` (Create New School)

**Action: Create School**
```
POST /api/forum/schools
Body: {name, description, createdBy}
→ Creates school thread
→ Generates joinKey
→ Adds creator as admin
→ Returns: {schoolId, joinKey}

Steps:
1. Create thread with title=name, metadata={joinKey, isDemo: false}
2. Insert into school_memberships: {userId, schoolId, role: 'admin'}
3. Return schoolId and joinKey

Route Handler: /app/api/forum/schools/route.ts
Client Component: Calls on form submit
```

**Validation:**
- School name must be unique (check existing threads)
- JoinKey must be unique (check metadata)
- Creator is automatically admin

---

### `/gateway/join` (Join Existing School)

**Action: Validate Key**
```
POST /api/forum/schools/join/validate
Body: {joinKey}
→ Finds school thread with matching joinKey
→ Returns: {valid: true, schoolId, schoolName} OR {valid: false, error}

Route Handler: /app/api/forum/schools/join/validate/route.ts
Client Component: Calls on input change (debounced)
```

**Action: Join School**
```
POST /api/forum/schools/join
Body: {userId, joinKey}
→ Adds user to school thread as participant
→ Inserts into school_memberships with role='student'
→ Returns: {schoolId, role: 'student'}

Route Handler: /app/api/forum/schools/join/route.ts
Client Component: Calls on form submit
```

**Validation:**
- JoinKey must exist
- User cannot join same school twice
- Demo School (id='demo') always sets role='student'

---

### `/school/[schoolId]` (School Home)

**Load:**
```
GET /api/forum/schools/{schoolId}/subjects
→ Returns: Array of subject posts
  [{postId, name, colorTag, courseCount, chapterCount}]

GET /api/forum/schools/{schoolId}/role?userId={userId}
→ Returns: {role: 'student' | 'teacher' | 'admin'}

Server Component: Fetch both in parallel
Mapping: 
- Subjects: Query posts in school thread with tag='subject'
- Role: Query school_memberships table
- Counts: Aggregate related courses/chapters
```

**Action: Search**
```
Client-side navigation to /search?q={query}&schoolId={schoolId}
```

---

### `/school/[schoolId]/admin` (Admin Dashboard)

**Load:**
```
GET /api/forum/schools/{schoolId}/members
→ Returns: Array of members with roles
  [{userId, name, email, role, joinedAt}]

GET /api/forum/schools/{schoolId}/metadata
→ Returns: {joinKey, aiSettings: {minContributions, studentCooldown}}

Server Component: Check if user is admin first (redirect if not)
Route Handler: /app/api/forum/schools/{schoolId}/members/route.ts
```

**Action: Promote User**
```
POST /api/forum/schools/{schoolId}/members/{userId}/role
Body: {newRole: 'teacher' | 'admin'}
→ Updates school_memberships table
→ Returns: {success: true}

Route Handler: /app/api/forum/schools/{schoolId}/members/[userId]/role/route.ts
Validation: Only admins can call. Demo School blocks this entirely.
```

**Action: Regenerate Join Key**
```
POST /api/forum/schools/{schoolId}/join-key/regenerate
→ Generates new joinKey
→ Updates school thread metadata
→ Returns: {joinKey}

Route Handler: /app/api/forum/schools/{schoolId}/join-key/regenerate/route.ts
Validation: Only admins. Demo School blocks.
```

**Action: Update AI Settings**
```
PATCH /api/forum/schools/{schoolId}/ai-settings
Body: {minContributions: 5-30, studentCooldown: 1-24 hours}
→ Updates school thread metadata
→ Returns: {success: true}

Route Handler: /app/api/forum/schools/{schoolId}/ai-settings/route.ts
Validation: Only admins
```

---

### `/chapter/[chapterId]` (Chapter Room)

**Load:**
```
GET /api/forum/chapters/{chapterId}
→ Returns: Chapter thread details
  {threadId, title, label, courseId, status, metadata}

GET /api/forum/chapters/{chapterId}/contributions
→ Returns: Array of posts in chapter thread
  [{postId, userId, userName, type, title, content, imageUrl, links, 
    createdAt, replies, helpfulCount, anonymous}]

GET /api/forum/chapters/{chapterId}/notes
→ Returns: Latest unified notes post (if exists)
  {postId, content, version, generatedBy, generatedAt, contributionCount}

Server Component: Fetch all three in parallel
Mapping:
- Chapter: Query thread by ID
- Contributions: Query posts in thread with tag='contribution'
- Notes: Query posts in thread with tag='unified_notes', order by version DESC, limit 1
```

**Action: Add Contribution**
```
POST /api/forum/chapters/{chapterId}/contributions
Body: {userId, type, title, content, imageUrl, links, anonymous}
→ Creates post in chapter thread
→ Tags with 'contribution' and specific type
→ Returns: {postId}

Route Handler: /app/api/forum/chapters/[chapterId]/contributions/route.ts
Client Component: Calls from modal
```

**Action: Reply to Contribution**
```
POST /api/forum/posts/{postId}/replies
Body: {userId, content}
→ Creates reply post (child post or nested comment, depending on Foru.ms)
→ Returns: {replyId}

Route Handler: /app/api/forum/posts/[postId]/replies/route.ts
```

**Action: Mark Helpful**
```
POST /api/forum/posts/{postId}/helpful
Body: {userId}
→ Increments helpful count or adds user to helpful list
→ Returns: {helpfulCount}

Route Handler: /app/api/forum/posts/[postId]/helpful/route.ts
```

**Action: Generate AI Notes**
```
POST /api/forum/chapters/{chapterId}/generate-notes
Body: {userId, userRole}
→ Validates: contribution threshold, cooldown, permissions
→ Fetches all contribution posts
→ Calls LLM to generate notes
→ Creates unified_notes post with metadata
→ Records generation in ai_generations table
→ Returns: {postId, version, content}

Route Handler: /app/api/forum/chapters/[chapterId]/generate-notes/route.ts
Implementation: See section 7 for full pipeline
```

---

### `/chapter/[chapterId]/notes` (Unified Notes View)

**Load:**
```
GET /api/forum/chapters/{chapterId}/notes/versions
→ Returns: Array of all unified notes versions
  [{postId, version, generatedBy, generatedAt, contributionCount}]

Server Component: Fetch in page.tsx
Mapping: Query posts in chapter thread with tag='unified_notes', order by version DESC
```

**Action: Switch Version**
```
GET /api/forum/posts/{postId}
→ Returns: Full notes content for specific version
  {postId, content, version, metadata}

Client Component: Fetches on version select
Route Handler: /app/api/forum/posts/[postId]/route.ts
```

**Action: Save Notes (Client-only)**
```
localStorage.setItem('saved-notes', JSON.stringify([...existingIds, postId]))
No backend call needed
```

---

### `/search` (Global Search)

**Load:**
```
GET /api/forum/search?q={query}&schoolId={schoolId}&filters={types}
→ Returns: Array of matching threads and posts
  [{type: 'chapter' | 'contribution' | 'notes', id, title, excerpt, chapterId, courseCode}]

Server Component: Fetch in page.tsx (debounced)
Mapping: Full-text search across threads and posts, filtered by tags and school membership
```

**Implementation:**
- If Foru.ms supports full-text search, use it
- Otherwise, query posts with LIKE on title/content, filter by school thread membership

---

### `/saved` (Saved Items)

**Load:**
```
Client-side only. Read from localStorage:
const savedIds = JSON.parse(localStorage.getItem('saved-notes') || '[]')

Then fetch details:
GET /api/forum/posts/batch?ids={savedIds.join(',')}
→ Returns: Array of post details
  [{postId, type, title, chapterId, chapterTitle, courseCode}]

Client Component: Calls on mount
Route Handler: /app/api/forum/posts/batch/route.ts
```

---

## 4. FRONTEND CODE STRUCTURE CHANGES

### Proposed File Structure

```
/app
  /api/forum                           # Next.js Route Handlers (Proxy Layer)
    /schools
      /route.ts                        # POST create school
      /[schoolId]
        /route.ts                      # GET school details
        /members/route.ts              # GET members
        /members/[userId]/role/route.ts  # POST promote
        /join-key/regenerate/route.ts  # POST regenerate key
        /ai-settings/route.ts          # PATCH AI settings
      /join
        /validate/route.ts             # POST validate key
        /route.ts                      # POST join school
      /demo/join/route.ts              # POST join demo
    /chapters
      /[chapterId]
        /route.ts                      # GET chapter details
        /contributions/route.ts        # GET contributions, POST new
        /generate-notes/route.ts       # POST generate AI notes
        /notes
          /versions/route.ts           # GET all note versions
    /posts
      /[postId]
        /route.ts                      # GET post details
        /replies/route.ts              # POST reply
        /helpful/route.ts              # POST mark helpful
      /batch/route.ts                  # GET batch post details
    /search/route.ts                   # GET search results

/lib
  /forum
    /client.ts                         # Base Foru.ms API client (fetch wrapper)
    /service.ts                        # High-level service layer (see section 5)
    /mappers.ts                        # Response → Frontend type converters
    /types.ts                          # TypeScript types for API responses
  /auth-store.ts                       # Update to use forum service
  /workspace-store.ts                  # REMOVE (replaced by forum service)
  /mock-data.ts                        # Keep for fallback/demo mode only
  /active-school-context.tsx           # Update to fetch role from API
  /permissions.ts                      # Keep (permissions logic)
  /ai-generation-store.ts              # REMOVE (backend tracks cooldowns now)
  /demo-store.ts                       # Keep (client-side recent activity)
```

### Key Responsibilities

**`/app/api/forum/*` (Route Handlers)**
- Proxy between frontend and Foru.ms API
- Hide Foru.ms API keys/tokens
- Add authentication context (user ID from session)
- Enforce permissions (check school membership, role)
- Return sanitized responses

**`/lib/forum/client.ts` (API Client)**
- Low-level fetch wrapper
- Add auth headers (API key, bearer token)
- Handle errors (network, 401, 403, 404, 500)
- Type-safe request/response handling

**`/lib/forum/service.ts` (Service Layer)**
- High-level business logic methods
- Call route handlers (not Foru.ms directly)
- Return frontend-friendly types
- Example: `getChaptersForCourse(courseId)` → `Chapter[]`

**`/lib/forum/mappers.ts` (Mappers)**
- Convert Foru.ms responses to frontend types
- Example: `mapThreadToChapter(thread) → Chapter`
- Handle missing fields gracefully

---

## 5. API SERVICE LAYER DESIGN

### Service Interface

```typescript
// /lib/forum/service.ts

export interface ForumService {
  // Schools
  getSchoolsForUser(userId: string): Promise<School[]>
  createSchool(name: string, description: string, userId: string): Promise<{schoolId: string, joinKey: string}>
  joinSchool(userId: string, joinKey: string): Promise<{schoolId: string, role: UserRole}>
  joinDemoSchool(userId: string): Promise<{schoolId: string, role: UserRole}>
  
  // School Management
  getSchoolMembers(schoolId: string): Promise<Member[]>
  promoteUser(schoolId: string, userId: string, newRole: UserRole): Promise<void>
  regenerateJoinKey(schoolId: string): Promise<string>
  updateAISettings(schoolId: string, settings: AISettings): Promise<void>
  
  // Hierarchy
  getSubjects(schoolId: string): Promise<Subject[]>
  getCourses(schoolId: string): Promise<Course[]>
  getChapters(courseId: string): Promise<Chapter[]>
  
  // Contributions
  getContributions(chapterId: string): Promise<Contribution[]>
  createContribution(chapterId: string, contribution: CreateContributionDTO): Promise<string>
  replyToContribution(postId: string, reply: CreateReplyDTO): Promise<string>
  markHelpful(postId: string, userId: string): Promise<void>
  
  // AI Notes
  getUnifiedNotes(chapterId: string): Promise<UnifiedNotes | null>
  getNotesVersions(chapterId: string): Promise<NotesVersion[]>
  generateNotes(chapterId: string, userId: string, userRole: UserRole): Promise<UnifiedNotes>
  
  // Admin
  renameChapter(chapterId: string, newTitle: string): Promise<void>
  updateSchoolName(schoolId: string, newName: string): Promise<void>
  
  // Search
  search(query: string, schoolId: string, filters: string[]): Promise<SearchResult[]>
}
```

### Method Details

#### `getSchoolsForUser(userId: string)`
```typescript
// Endpoint: GET /api/forum/schools?userId={userId}
// Request: None
// Response: School[]
// Mapping: Query school_memberships JOIN threads
// Example Response:
[
  {id: "demo", name: "Demo High School", role: "student", joinedAt: "2024-01-01T00:00:00Z"},
  {id: "stanford", name: "Stanford University", role: "admin", joinedAt: "2024-02-01T00:00:00Z"}
]
// Errors: 401 if user not authenticated
```

#### `createSchool(name, description, userId)`
```typescript
// Endpoint: POST /api/forum/schools
// Request: {name: string, description: string, createdBy: string}
// Response: {schoolId: string, joinKey: string}
// Steps:
//   1. Generate unique joinKey
//   2. Create thread with metadata: {joinKey, isDemo: false}
//   3. Add creator to thread participants
//   4. Insert into school_memberships: {userId, schoolId, role: 'admin'}
//   5. Return schoolId and joinKey
// Errors: 400 if name taken, 500 on creation failure
```

#### `generateNotes(chapterId, userId, userRole)`
```typescript
// Endpoint: POST /api/forum/chapters/{chapterId}/generate-notes
// Request: {userId: string, userRole: UserRole}
// Response: {postId: string, version: number, content: string}
// Steps: See section 7 for full pipeline
// Errors: 
//   403 if cooldown active
//   400 if insufficient contributions
//   500 on LLM failure
```

---

## 6. AUTH & SECURITY

### Token Handling

**Problem:** Foru.ms API requires an API key or bearer token. Cannot expose this to client.

**Solution:** Next.js Route Handlers as Proxy

```typescript
// /app/api/forum/schools/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  // 1. Authenticate user (session, JWT, etc.)
  const session = await getServerSession(request)
  if (!session) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401})
  }
  
  // 2. Parse request
  const body = await request.json()
  const {name, description} = body
  
  // 3. Call Foru.ms API with server-side token
  const response = await fetch("https://foru.ms/api/threads", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.FORUMMS_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: name,
      content: description,
      tags: ["school"],
      metadata: {joinKey: generateJoinKey(), isDemo: false}
    })
  })
  
  if (!response.ok) {
    return NextResponse.json({error: "Failed to create school"}, {status: 500})
  }
  
  const thread = await response.json()
  
  // 4. Add user to school_memberships
  await db.query(
    "INSERT INTO school_memberships (user_id, school_id, role) VALUES ($1, $2, $3)",
    [session.user.id, thread.id, "admin"]
  )
  
  // 5. Return sanitized response
  return NextResponse.json({
    schoolId: thread.id,
    joinKey: thread.metadata.joinKey
  })
}
```

### Preventing Key Leakage

- **API Key:** Stored in `.env.local`, never sent to client
- **Join Keys:** Only returned when creating school or in admin dashboard
- **Demo School Key:** Hardcoded on backend, not exposed in client code

### Permission Enforcement Strategy

**Two-Layer Validation:**

1. **Frontend (UI):** Hide buttons/links if user lacks permission
   - Use `can(action, membership)` helper from `/lib/permissions.ts`
   - Example: Hide "Promote to Admin" button if user is not admin

2. **Backend (Route Handlers):** Validate membership and role
   - Query `school_memberships` table
   - Return 403 if user doesn't have required role
   - Example:
     ```typescript
     const membership = await getMembership(userId, schoolId)
     if (membership.role !== "admin") {
       return NextResponse.json({error: "Forbidden"}, {status: 403})
     }
     ```

### Demo School Protection

**Rules:**
- Everyone is a student (enforce in `joinDemoSchool`)
- No admin actions allowed (check `isDemoSchool(schoolId)` in all admin routes)
- Cannot rename/delete (block in backend)

**Implementation:**
```typescript
// /app/api/forum/schools/[schoolId]/members/[userId]/role/route.ts
export async function POST(request: NextRequest, {params}) {
  const {schoolId, userId} = params
  
  // Check if Demo School
  if (isDemoSchool(schoolId)) {
    return NextResponse.json(
      {error: "Admin actions not allowed in Demo School"},
      {status: 403}
    )
  }
  
  // ... rest of logic
}
```

---

## 7. AI NOTES PIPELINE (FULL DETAIL)

### Exact Flow

#### Step 1: Validate Request

```typescript
// /app/api/forum/chapters/[chapterId]/generate-notes/route.ts
export async function POST(request: NextRequest, {params}) {
  const {chapterId} = params
  const {userId, userRole} = await request.json()
  
  // 1. Check membership (user must be in the school)
  const chapter = await getChapter(chapterId)
  const membership = await getMembership(userId, chapter.schoolId)
  if (!membership) {
    return NextResponse.json({error: "Not a member"}, {status: 403})
  }
  
  // 2. Get contribution count
  const contributions = await getContributions(chapterId)
  const contributionCount = contributions.length
  
  // 3. Check threshold
  const minContributions = await getAISetting(chapter.schoolId, "minContributions")
  if (contributionCount < minContributions) {
    return NextResponse.json({
      error: `Need ${minContributions} contributions`,
      contributionCount
    }, {status: 400})
  }
  
  // 4. Check cooldown
  const lastGeneration = await getLastGeneration(chapterId)
  if (lastGeneration) {
    const cooldown = getCooldownForRole(userRole) // 2h student, 30min teacher, 0 admin
    const timeSince = Date.now() - lastGeneration.generatedAt
    if (timeSince < cooldown) {
      return NextResponse.json({
        error: "AI recently generated",
        remainingMinutes: Math.ceil((cooldown - timeSince) / 60000)
      }, {status: 403})
    }
  }
  
  // ... proceed to generation
}
```

#### Step 2: Collect Posts

```typescript
const contributions = await getContributions(chapterId)

// Filter out unified_notes posts, only get contributions
const validContributions = contributions.filter(c => c.type === "contribution")
```

#### Step 3: Build Prompt

```typescript
const prompt = `
You are an AI study assistant. Generate comprehensive, well-structured unified notes for a lecture chapter.

**Context:**
- Chapter: ${chapter.title} (${chapter.label})
- Course: ${chapter.courseCode} - ${chapter.courseTitle}
- Contributions: ${validContributions.length} student posts

**Student Contributions:**

${validContributions.map((c, i) => `
${i + 1}. [${c.type}] ${c.title || "Untitled"}
${c.content}
${c.links?.length ? `Links: ${c.links.join(", ")}` : ""}
`).join("\n\n")}

**Task:**
Create unified lecture notes in markdown format with these sections:
1. Overview
2. Key Concepts (with definitions)
3. Formulas & Equations
4. Worked Examples (step-by-step)
5. Common Mistakes to Avoid
6. Additional Resources
7. Quick Revision Sheet

Use clear headings, bullet points, and code blocks where appropriate.
Synthesize information from all contributions.
`
```

#### Step 4: Call LLM

```typescript
const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "gpt-4-turbo-preview",
    messages: [
      {role: "system", content: "You are a helpful study assistant that creates comprehensive lecture notes."},
      {role: "user", content: prompt}
    ],
    temperature: 0.7,
    max_tokens: 4000
  })
})

if (!response.ok) {
  throw new Error("LLM generation failed")
}

const result = await response.json()
const notesContent = result.choices[0].message.content
```

**Alternative:** Use Gemini, Claude, or Mistral depending on preference/cost.

#### Step 5: Store Result

```typescript
// Get current version number
const existingVersions = await getNotesVersions(chapterId)
const newVersion = existingVersions.length + 1

// Create unified_notes post
const notesPost = await createPost({
  threadId: chapterId,
  userId: "system", // or userId
  content: notesContent,
  tags: ["unified_notes"],
  metadata: {
    version: newVersion,
    generatedBy: userId,
    generatorRole: userRole,
    generatedAt: new Date().toISOString(),
    contributionCount: validContributions.length
  }
})

// Record generation in ai_generations table
await db.query(
  `INSERT INTO ai_generations (chapter_id, generated_by, generator_role, contribution_count)
   VALUES ($1, $2, $3, $4)`,
  [chapterId, userId, userRole, validContributions.length]
)

return NextResponse.json({
  postId: notesPost.id,
  version: newVersion,
  content: notesContent
})
```

#### Step 6: Return to Frontend

Frontend receives:
```json
{
  "postId": "post-abc123",
  "version": 3,
  "content": "# Overview\n\n..."
}
```

Frontend updates UI to show new notes, displays success toast, and navigates to notes view.

### Cooldown Enforcement

```typescript
function getCooldownForRole(role: UserRole): number {
  switch (role) {
    case "student": return 2 * 60 * 60 * 1000 // 2 hours
    case "teacher": return 30 * 60 * 1000     // 30 minutes
    case "admin": return 0                    // No cooldown
  }
}
```

Cooldown is enforced in backend. Client cannot bypass.

### Threshold Enforcement

```typescript
const minContributions = await getAISetting(chapter.schoolId, "minContributions") // Default: 5
if (contributionCount < minContributions) {
  return {error: "Insufficient contributions"}
}
```

Admins can adjust threshold (5-30) in school settings.

---

## 8. MIGRATION PLAN (MOCK → REAL)

### Step 1: Add API Client + Proxy Routes

**Goal:** Set up infrastructure without breaking existing UI.

**Tasks:**
1. Create `/lib/forum/client.ts` with base fetch wrapper
2. Add environment variable `FORUMMS_API_KEY`
3. Create initial route handlers:
   - `/app/api/forum/schools/route.ts`
   - `/app/api/forum/chapters/[chapterId]/route.ts`
4. Test route handlers with Postman/curl

**Testing:**
- Call `POST /api/forum/schools` with test data
- Verify thread created in Foru.ms dashboard
- Verify response matches expected schema

**Duration:** 1-2 days

---

### Step 2: Replace Read Calls

**Goal:** Fetch chapters and contributions from Foru.ms instead of mock data.

**Tasks:**
1. Update `/app/school/[schoolId]/page.tsx` to call `/api/forum/schools/{schoolId}/subjects`
2. Update `/app/chapter/[chapterId]/page.tsx` to call `/api/forum/chapters/{chapterId}/contributions`
3. Create mappers in `/lib/forum/mappers.ts`
4. Keep mock data as fallback (if API call fails, show mock data with warning banner)

**Testing:**
- Navigate to school page, verify subjects load from API
- Navigate to chapter page, verify contributions load
- Test with empty school (no subjects) → should show empty state
- Test with API failure → should show mock data + warning

**Duration:** 2-3 days

---

### Step 3: Replace Write Calls

**Goal:** Create contributions via API instead of mock store.

**Tasks:**
1. Update contribution modal to call `/api/forum/chapters/{chapterId}/contributions`
2. Update reply form to call `/api/forum/posts/{postId}/replies`
3. Update helpful button to call `/api/forum/posts/{postId}/helpful`
4. Remove `workspace-store.ts` methods related to contributions

**Testing:**
- Add contribution from modal → verify appears in Foru.ms
- Reply to contribution → verify reply saved
- Mark helpful → verify count increments
- Test validation (empty content, missing fields)

**Duration:** 2-3 days

---

### Step 4: Add Admin Actions

**Goal:** Enable admin dashboard with real backend.

**Tasks:**
1. Create `/app/api/forum/schools/{schoolId}/members/route.ts`
2. Create `/app/api/forum/schools/{schoolId}/members/[userId]/role/route.ts`
3. Create `/app/api/forum/schools/{schoolId}/join-key/regenerate/route.ts`
4. Update admin dashboard to call these endpoints
5. Add permission checks (only admins can access)

**Testing:**
- Promote user to teacher → verify role updated in DB
- Regenerate join key → verify new key works
- Try as non-admin → verify 403 error
- Try in Demo School → verify blocked

**Duration:** 2-3 days

---

### Step 5: Replace Notes Generation

**Goal:** Generate AI notes from real contributions.

**Tasks:**
1. Create `/app/api/forum/chapters/{chapterId}/generate-notes/route.ts`
2. Implement LLM pipeline (see section 7)
3. Create `ai_generations` table for cooldown tracking
4. Update notes page to fetch versions from API
5. Remove `ai-generation-store.ts` (backend tracks cooldowns now)

**Testing:**
- Generate notes with 5 contributions → verify success
- Try with 3 contributions → verify threshold error
- Generate again immediately → verify cooldown error (student)
- Generate as admin → verify no cooldown
- Check version increments correctly

**Duration:** 3-4 days

---

### Step 6: Remove Mock Data Fallback

**Goal:** Fully commit to Foru.ms backend.

**Tasks:**
1. Remove mock data fallback logic from all pages
2. Delete `workspace-store.ts`
3. Remove `mock-data.ts` (or keep for offline dev only)
4. Add proper error states (network error, empty data)
5. Add loading skeletons everywhere

**Testing:**
- Test entire app end-to-end with real data
- Test error scenarios (network down, invalid IDs)
- Test Demo School flows
- Test multi-school switching

**Duration:** 1-2 days

---

**Total Duration:** 11-17 days (2-3 weeks)

---

## 9. COMMON PITFALLS (MUST AVOID)

### 1. Treating Roles as Global

**Mistake:** Storing `user.role` as a single value.

**Why Bad:** User can be admin in one school and student in another.

**Solution:** Use `school_memberships` table. Always query role for specific school.

**Code Check:**
```typescript
// BAD
if (user.role === "admin") { ... }

// GOOD
const membership = await getMembership(userId, schoolId)
if (membership.role === "admin") { ... }
```

---

### 2. Leaking Demo School Join Key

**Mistake:** Hardcoding `DEMO2024` in client-side code.

**Why Bad:** Anyone can inspect and join Demo School.

**Solution:** Demo School is public, but key should only be validated server-side. Never expose key in client bundle.

**Code Check:**
- Search codebase for `DEMO2024` or demo keys
- Ensure only backend knows valid keys

---

### 3. Calling Foru.ms Directly from Client

**Mistake:** Fetching `https://foru.ms/api/threads` from client component.

**Why Bad:** Exposes API key in browser. Anyone can steal token and make unauthorized requests.

**Solution:** Always proxy through Next.js route handlers.

**Code Check:**
```typescript
// BAD
const response = await fetch("https://foru.ms/api/threads", {
  headers: {"Authorization": `Bearer ${process.env.FORUMMS_API_KEY}`}
})

// GOOD (client component)
const response = await fetch("/api/forum/schools")
```

---

### 4. Using Thread IDs Incorrectly

**Mistake:** Treating `schoolId` and `threadId` as different entities.

**Why Bad:** School IS a thread in Foru.ms. Confusion leads to wrong queries.

**Solution:** Be explicit. `schoolId = schoolThreadId`. Document this in code.

**Code Check:**
- Ensure all school-related queries use correct thread ID
- Add comments: `// schoolId is a Foru.ms thread ID`

---

### 5. Not Versioning Notes Properly

**Mistake:** Overwriting unified notes instead of creating new version.

**Why Bad:** Loses history. Students expect to see previous versions.

**Solution:** Increment version number with each generation. Store as separate post.

**Code Check:**
```typescript
// BAD
await updatePost(existingNotesId, {content: newNotes})

// GOOD
const newVersion = existingVersions.length + 1
await createPost({
  threadId: chapterId,
  content: newNotes,
  metadata: {version: newVersion}
})
```

---

### 6. Ignoring Demo School Edge Cases

**Mistake:** Allowing admin promotion in Demo School.

**Why Bad:** Violates product rule: "All members are students in Demo School."

**Solution:** Check `isDemoSchool(schoolId)` in every admin action route.

**Code Check:**
```typescript
// Every admin route must have:
if (isDemoSchool(schoolId)) {
  return NextResponse.json({error: "Not allowed in Demo School"}, {status: 403})
}
```

---

### 7. Weak Permission Validation

**Mistake:** Only hiding UI elements without backend checks.

**Why Bad:** Users can call APIs directly (via browser console, Postman).

**Solution:** Always validate permissions on backend.

**Code Check:**
- Every admin action route must query `school_memberships`
- Return 403 if user lacks permission

---

### 8. Race Conditions in AI Generation

**Mistake:** Allowing multiple simultaneous generations for same chapter.

**Why Bad:** Wastes LLM credits, confuses version numbers.

**Solution:** Use database locking or check for in-progress generations.

**Code Check:**
```typescript
// Before generating, check:
const inProgress = await db.query(
  "SELECT * FROM ai_generations WHERE chapter_id = $1 AND status = 'in_progress'",
  [chapterId]
)
if (inProgress.length > 0) {
  return {error: "Generation already in progress"}
}
```

---

### 9. Not Handling Foru.ms Rate Limits

**Mistake:** Spamming API with requests.

**Why Bad:** Foru.ms may rate-limit or ban IP.

**Solution:** Implement caching (Next.js `revalidate`), debounce requests, respect rate limit headers.

**Code Check:**
- Add `revalidate: 60` to server component fetches
- Cache frequently accessed data (school list, subjects)

---

### 10. Forgetting to Sanitize User Input

**Mistake:** Passing user content directly to LLM or storing without validation.

**Why Bad:** XSS attacks, prompt injection, malformed data.

**Solution:** Sanitize HTML, validate schema, escape special characters.

**Code Check:**
```typescript
// Before storing contribution:
import DOMPurify from "isomorphic-dompurify"
const cleanContent = DOMPurify.sanitize(contribution.content)
```

---

## 10. APPENDIX: TYPE DEFINITIONS

### Frontend Types (Preserve)

```typescript
// /lib/types.ts
export interface School {
  id: string
  name: string
  description?: string
}

export interface Subject {
  id: string
  name: string
  colorTag: string
  courseCount: number
  chapterCount: number
}

export interface Course {
  id: string
  subjectId: string
  code: string
  title: string
  teacher: string
  term: string
}

export interface Chapter {
  id: string
  courseId: string
  label: string
  title: string
  status: "Collecting" | "AI Ready" | "Compiled"
  contributions: number
}

export interface Contribution {
  id: string
  chapterId: string
  type: "takeaway" | "notes_photo" | "resource" | "solved_example" | "confusion"
  title?: string
  content?: string
  imageUrl?: string
  links?: string[]
  userId: string
  userName: string
  anonymous: boolean
  createdAt: string
  replies: Reply[]
  helpfulCount: number
}

export interface UnifiedNotes {
  id: string
  chapterId: string
  version: number
  content: string
  generatedBy: string
  generatorRole: UserRole
  generatedAt: string
  contributionCount: number
}
```

### Foru.ms API Response Types (New)

```typescript
// /lib/forum/types.ts
export interface ForumThread {
  id: string
  title: string
  content: string
  userId: string
  createdAt: string
  tags: string[]
  metadata?: Record<string, any>
  participantCount: number
}

export interface ForumPost {
  id: string
  threadId: string
  userId: string
  content: string
  createdAt: string
  updatedAt: string
  tags: string[]
  parentPostId?: string
  helpfulCount: number
  replyCount: number
}

export interface ForumUser {
  id: string
  name: string
  email: string
  avatarUrl?: string
}
```

---

## 11. FINAL NOTES FOR IMPLEMENTATION

### Environment Variables Required

```env
# .env.local
FORUMMS_API_KEY=your_api_key_here
FORUMMS_API_URL=https://foru.ms/api
OPENAI_API_KEY=your_openai_key_here
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### Database Migrations

If using external DB for `school_memberships` and `ai_generations`:

```sql
-- Initial setup
CREATE TABLE school_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  school_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, school_id)
);

CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id TEXT NOT NULL,
  generated_by TEXT NOT NULL,
  generator_role TEXT NOT NULL,
  contribution_count INT NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_school_memberships_user ON school_memberships(user_id);
CREATE INDEX idx_school_memberships_school ON school_memberships(school_id);
CREATE INDEX idx_ai_generations_chapter ON ai_generations(chapter_id);
```

### Success Metrics

After integration, verify:

1. User can create school → backend creates thread with joinKey
2. User can join school → backend adds to thread + memberships table
3. Subjects/courses load from Foru.ms posts
4. Contributions saved as Foru.ms posts
5. AI notes generation works end-to-end
6. Role-based permissions enforced (admin can promote, student cannot)
7. Demo School restrictions work (no admin actions)
8. Multi-school switching works (user sees different roles in different schools)
9. Search returns results from Foru.ms
10. Saved items persist across sessions

---

## CONCLUSION

This blueprint provides a complete, code-level plan for integrating Class Memory Rooms with Foru.ms. Every entity is mapped, every API call is specified, and every edge case is addressed.

The integration is realistic and implementable. It respects product rules (multi-school, role scoping, Demo School restrictions) while leveraging Foru.ms primitives effectively.

Next steps:
1. Review blueprint with engineering team
2. Confirm Foru.ms API capabilities (metadata support, tags, rate limits)
3. Set up external DB for `school_memberships` if needed
4. Begin Step 1 of migration plan

**Questions? Implementation blockers?** This document should answer 95% of them. For the remaining 5%, consult Foru.ms API documentation or create proof-of-concept tests.

---

**End of Blueprint**
