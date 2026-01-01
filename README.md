# Class Memory Rooms

**Foru.ms x v0 by Vercel Hackathon Submission**

A collaborative learning platform where students contribute notes, photos, and resources to shared lecture rooms — then AI synthesizes everything into unified study materials.

## How It Works

1. **Admins create schools** with subjects and courses
2. **Students join** using a school join key
3. **Students contribute** to lecture chapters: takeaways, note photos, resources, solved examples, confusions
4. **AI generates unified notes** from all contributions when enough content is collected
5. **Everyone benefits** from the collective knowledge

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

All application data is stored in Foru.ms using threads and posts with `extendedData` for metadata:

| App Entity | Foru.ms Type | Storage Details |
|------------|--------------|-----------------|
| School | Thread | `extendedData.type: 'school'`, stores name, joinKey |
| Subject | Post | `extendedData.type: 'subject'`, stores name, colorTag |
| Course | Post | `extendedData.type: 'course'`, stores code, title, teacher, subjectId |
| Chapter | Thread | `extendedData.type: 'chapter'`, stores courseId, label, status |
| Contribution | Post | `extendedData.type: 'contribution'`, stores contributionType, content |
| Reply | Post | `extendedData.type: 'reply'`, uses parentId for threading |
| AI Notes | Post | `extendedData.type: 'unified_notes'`, stores version, generated content |

### Image Handling

- **Storage**: Vercel Blob Storage
- **Flow**: User uploads image → stored in Vercel Blob → URL saved in contribution post's `extendedData.image.url`
- **Access**: Public URLs, served directly from Vercel's CDN

### User Authentication

- **Registration/Login**: Proxied through Foru.ms `/auth/register` and `/auth/login`
- **Session**: JWT token stored in localStorage
- **School Memberships**: Stored client-side in localStorage (role, schoolName, joinedAt per school)

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

## Features

- Multi-school workspaces with join keys
- Role-based access (Admin, Teacher, Student)
- 5 contribution types: takeaways, note photos, resources, solved examples, confusions
- Anonymous contribution option
- AI-generated unified notes with version history
- Helpful votes on contributions

## Live Demo

[class-memory-rooms.vercel.app](https://class-memory-rooms.vercel.app)
