# Class Memory Rooms

**Foru.ms x v0 by Vercel Hackathon Submission**

A collaborative learning platform where students contribute notes, photos, and resources to shared lecture rooms — then AI synthesizes everything into unified study materials.

## How It Works

1. **Admins create schools** with subjects and courses
2. **Students join** using a school join key
3. **Students contribute** to lecture chapters: takeaways, note photos, resources, solved examples, confusions
4. **AI generates unified notes** from all contributions when enough content is collected
5. **Everyone benefits** from the collective knowledge

## How We Built It

### Frontend
- Next.js 15 with App Router and React 19
- Multi-school architecture with workspace-scoped state
- Role-based permissions (Admin/Teacher/Student) scoped per school
- shadcn/ui components with a paper-like educational aesthetic

### Innovative Use of Foru.ms

We used Foru.ms as a headless backend in a non-traditional way:

| Foru.ms Primitive | Our Usage |
|-------------------|-----------|
| Threads | Schools and Chapters/Lectures |
| Posts | Subjects, Courses, Contributions, AI Notes |
| extendedData | Type flags, metadata, relationships |

**Key innovation**: AI-generated notes are stored back into Foru.ms as versioned posts, making them first-class citizens of the system rather than external artifacts.

### Image Storage
- Vercel Blob Storage for note photos
- URLs stored in Foru.ms post extendedData
- Direct CDN delivery

## Challenges We Ran Into

- **Multi-tenant role scoping**: Users can have different roles in different schools. Had to rebuild the permission system to scope roles per school, not globally.
- **Server-side data fetching on Vercel**: Internal API calls from server components failed. Solved by calling Foru.ms API directly in server components.
- **Foru.ms API quirks**: Tags require IDs not strings, had to remove tag usage from thread creation.
- **Hydration mismatches**: Auth state differs between server and client render. Fixed with mounted state checks.
- **Environment variables**: NEXT_PUBLIC_APP_URL doesn't work for server-side fetches on Vercel.

## Accomplishments We're Proud Of

- Turned a forum backend into a collaborative academic knowledge system
- Built a working multi-school SaaS with proper workspace isolation
- Students can generate AI notes, not just teachers — democratizing knowledge synthesis
- Admin dashboard for managing schools, subjects, courses, and lectures
- Version control for AI-generated notes
- Anonymous contribution option for shy students

## What We Learned

- Foru.ms is flexible enough to power non-forum applications
- Role scoping per workspace is essential for multi-tenant systems
- Server components need different data fetching strategies than client components
- Good architecture decisions early prevent painful refactors later

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript |
| UI | shadcn/ui, Tailwind CSS |
| Data Storage | Foru.ms API (threads & posts) |
| Image Storage | Vercel Blob Storage |
| AI | Google Gemini |
| Deployment | Vercel |

## Data Architecture

| App Entity | Foru.ms Type | Key Fields in extendedData |
|------------|--------------|---------------------------|
| School | Thread | type: 'school', name, joinKey |
| Subject | Post | type: 'subject', name, colorTag |
| Course | Post | type: 'course', code, title, teacher, subjectId |
| Chapter | Thread | type: 'chapter', courseId, label, status |
| Contribution | Post | type: 'contribution', contributionType, anonymous |
| AI Notes | Post | type: 'unified_notes', version, generatedAt |

## Local Development

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

```env
# Foru.ms API
FORUMMS_API_URL=https://foru.ms/api/v1
FORUMMS_API_KEY=your_api_key

# Vercel Blob (image uploads)
BLOB_READ_WRITE_TOKEN=your_token

# Google Gemini (AI notes)
GEMINI_API_KEY=your_key
```

## Live Demo

[class-memory-rooms.vercel.app](https://class-memory-rooms.vercel.app)
