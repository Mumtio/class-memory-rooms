# Class Memory Rooms

**Foru.ms x v0 by Vercel Hackathon Submission**

A collaborative learning platform where students contribute notes, photos, and resources to shared lecture rooms — then AI synthesizes everything into unified study materials.

## What It Does

1. **Schools create rooms** for each lecture/chapter
2. **Students contribute** takeaways, note photos, resources, solved examples, and confusions
3. **AI generates unified notes** from all contributions when enough content is collected
4. **Everyone benefits** from the collective knowledge

## Built With

- **Foru.ms** — All data (schools, subjects, courses, chapters, contributions, notes) stored using Foru.ms threads and posts
- **Next.js 15** — App Router with React 19
- **Vercel Blob** — Image storage for note photos
- **Google Gemini** — AI note generation
- **shadcn/ui + Tailwind** — Paper-like educational UI

## Foru.ms Data Model

| App Entity | Foru.ms Mapping |
|------------|-----------------|
| School | Thread (`type: 'school'`) |
| Subject | Post (`type: 'subject'`) |
| Course | Post (`type: 'course'`) |
| Chapter/Lecture | Thread (`type: 'chapter'`) |
| Contribution | Post (`type: 'contribution'`) |
| AI Notes | Post (`type: 'unified_notes'`) |

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

```env
# Foru.ms
FORUMMS_API_URL=https://foru.ms/api/v1
FORUMMS_API_KEY=your_key

# Vercel Blob (for image uploads)
BLOB_READ_WRITE_TOKEN=your_token

# Gemini AI
GEMINI_API_KEY=your_key
```

## Features

- **Multi-school support** — Users can create/join multiple schools
- **Role-based access** — Admin, Teacher, Student roles per school
- **Contribution types** — Takeaways, note photos, resources, solved examples, confusions
- **AI note generation** — Synthesizes contributions into structured study materials
- **Version control** — Multiple versions of AI-generated notes
- **Anonymous contributions** — Students can contribute anonymously

## Live Demo

[class-memory-rooms.vercel.app](https://class-memory-rooms.vercel.app)
