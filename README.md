# Class Memory Rooms

A collaborative educational web application that transforms how students learn together.

## Overview

Class Memory Rooms is a multi-school SaaS platform where students collectively contribute knowledge to lecture "rooms," and AI synthesizes their contributions into structured, unified study notes.

## Architecture

**Frontend + Foru.ms Backend:**
- **Frontend**: Next.js 15+ with React 19, TypeScript, Tailwind CSS
- **Backend**: Foru.ms API integration with custom proxy layer
- **Real-time**: WebSocket through Foru.ms for live collaboration
- **Authentication**: NextAuth.js with role-based access control
- **Database**: Foru.ms threads/posts + external tables for school memberships

## Project Structure

```
class-memory-rooms/
├── frontend/                    # Next.js frontend application
│   ├── app/                    # Next.js App Router pages
│   │   └── api/forum/          # Foru.ms API proxy routes
│   ├── components/             # React components
│   ├── lib/                   # State management & utilities
│   │   └── forum/             # Foru.ms integration layer
│   └── package.json           # Frontend dependencies
├── TECHNICAL_DOCUMENTATION.md  # Detailed technical documentation
├── FORUMMS_INTEGRATION_BLUEPRINT.md # Complete Foru.ms integration plan
└── README.md                   # This file
```

## Key Features

- **Multi-school workspace support** with role-based permissions (Student/Teacher/Admin)
- **Foru.ms backend integration** with custom entity mapping
- **Real-time collaboration** on lecture contributions
- **AI-powered note synthesis** from student contributions
- **Paper-like design aesthetic** for educational trust and engagement
- **Workspace isolation** and comprehensive permission management

## Entity Mapping (Frontend ↔ Foru.ms)

| Frontend Entity | Foru.ms Mapping | Storage Strategy |
|-----------------|-----------------|------------------|
| **School** | Thread (with `school` tag) | Thread with joinKey in metadata |
| **Subject** | Post (with `subject` tag) | JSON post in school thread |
| **Course** | Post (with `course` tag) | JSON post in school thread |
| **Chapter** | Thread (with `chapter` tag) | Thread with course metadata |
| **Contribution** | Post (with `contribution` tag) | Post in chapter thread |
| **AI Notes** | Post (with `unified_notes` tag) | Versioned post in chapter thread |
| **Memberships** | External table + Thread participants | `school_memberships` table |

## Quick Start

### Prerequisites
- Node.js 18+
- Foru.ms API access
- PostgreSQL (for membership tables)
- npm

### Installation

```bash
# Clone and install dependencies
git clone <repository-url>
cd class-memory-rooms
npm run install:all

# Set up environment variables
cd frontend
cp .env.example .env.local
# Edit .env.local with your Foru.ms API key and database credentials

# Start development server
npm run dev
```

This will start the frontend at **http://localhost:3000** with Foru.ms integration.

### Environment Configuration

```env
# Required environment variables
FORUMMS_API_URL=https://foru.ms/api
FORUMMS_API_KEY=your_forumms_api_key
DATABASE_URL=postgresql://user:pass@localhost:5432/db
NEXTAUTH_SECRET=your_nextauth_secret
OPENAI_API_KEY=your_openai_key
```

## Foru.ms Integration

The application uses a **proxy architecture** where:

1. **Frontend** calls Next.js API routes (`/api/forum/*`)
2. **API Routes** authenticate requests and call Foru.ms API
3. **Mappers** convert Foru.ms responses to frontend types
4. **Service Layer** provides high-level business logic

### Key Integration Files

- **`/lib/forum/client.ts`** - Low-level Foru.ms API client
- **`/lib/forum/service.ts`** - High-level business logic
- **`/lib/forum/mappers.ts`** - Response type converters
- **`/app/api/forum/*`** - Next.js proxy routes

### External Database Tables

Some features require external tables (not stored in Foru.ms):

```sql
-- School memberships with roles
CREATE TABLE school_memberships (
  user_id TEXT,
  school_id TEXT,
  role TEXT CHECK (role IN ('student', 'teacher', 'admin')),
  joined_at TIMESTAMP DEFAULT NOW()
);

-- AI generation tracking for cooldowns
CREATE TABLE ai_generations (
  chapter_id TEXT,
  generated_by TEXT,
  generator_role TEXT,
  contribution_count INT,
  generated_at TIMESTAMP DEFAULT NOW()
);
```

## Development Workflow

**Frontend Development:**
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run lint             # Run linting
```

**Foru.ms Integration Testing:**
- Test school creation → Verify thread created in Foru.ms
- Test contributions → Verify posts appear in Foru.ms
- Test AI generation → Verify notes stored as posts
- Test permissions → Verify role-based access control

## Demo Data

The system integrates with Foru.ms demo data:

- **Demo School** (join key: `DEMO24`)
- **Demo Users**: Managed through your authentication system
- **Sample Content**: Created as Foru.ms threads and posts

## API Integration

The frontend provides a comprehensive integration layer:

- **Schools**: `/api/forum/schools/*` - Multi-school management
- **Chapters**: `/api/forum/chapters/*` - Lecture room management  
- **Contributions**: `/api/forum/posts/*` - Student contributions
- **AI Notes**: `/api/forum/chapters/*/generate-notes` - AI note generation
- **Search**: `/api/forum/search` - Cross-content search

See [FORUMMS_INTEGRATION_BLUEPRINT.md](FORUMMS_INTEGRATION_BLUEPRINT.md) for complete API documentation.

## Documentation

- **[TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md)** - Comprehensive technical overview
- **[FORUMMS_INTEGRATION_BLUEPRINT.md](FORUMMS_INTEGRATION_BLUEPRINT.md)** - Complete Foru.ms integration plan
- **[frontend/README.md](frontend/README.md)** - Frontend-specific documentation

## Deployment

**Frontend**: Deploy on Vercel, Netlify, or any Node.js hosting  
**Foru.ms**: Managed service (no deployment needed)  
**Database**: PostgreSQL on Heroku, Railway, Supabase, etc.

## Technology Stack

**Frontend:**
- Next.js 15+ (App Router) with TypeScript
- React 19 with Tailwind CSS + shadcn/ui
- Zustand for state management
- NextAuth.js for authentication

**Backend Integration:**
- Foru.ms API for core data storage
- Next.js API routes as proxy layer
- PostgreSQL for membership/role data
- OpenAI API for note generation

**Development:**
- TypeScript strict mode
- ESLint + Prettier
- Hot reload development server
- Comprehensive error handling