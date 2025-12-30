# Foru.ms Integration Guide

This document provides a practical guide for integrating Class Memory Rooms with the Foru.ms backend API.

## Overview

Class Memory Rooms uses **Foru.ms** as its backend through a proxy architecture:

```
Frontend (Next.js) → API Routes (/api/forum/*) → Foru.ms API
```

## Integration Architecture

### Entity Mapping

| Frontend Entity | Foru.ms Entity | Implementation |
|-----------------|----------------|----------------|
| **School** | Thread with `school` tag | Thread metadata contains `joinKey` |
| **Subject** | Post with `subject` tag | JSON content in school thread |
| **Course** | Post with `course` tag | JSON content in school thread |
| **Chapter** | Thread with `chapter` tag | Thread with course reference |
| **Contribution** | Post with `contribution` tag | Post in chapter thread |
| **AI Notes** | Post with `unified_notes` tag | Versioned post in chapter thread |

### File Structure

```
frontend/
├── app/api/forum/              # Foru.ms API proxy routes
│   ├── schools/               # School management
│   ├── chapters/              # Chapter operations
│   ├── posts/                 # Post operations
│   └── search/                # Search functionality
├── lib/forum/                 # Foru.ms integration layer
│   ├── client.ts              # Low-level API client
│   ├── service.ts             # High-level business logic
│   └── mappers.ts             # Response converters
```

## Setup Instructions

### 1. Environment Configuration

Create `frontend/.env.local`:

```env
# Foru.ms API Configuration
FORUMMS_API_URL=https://foru.ms/api
FORUMMS_API_KEY=your_api_key_here

# Database for memberships (PostgreSQL, MySQL, etc.)
DATABASE_URL=postgresql://user:pass@localhost:5432/class_memory_rooms

# NextAuth Configuration
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000

# AI Configuration
OPENAI_API_KEY=your_openai_key_here
```

### 2. Database Setup

Create external tables for features not supported by Foru.ms:

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

-- Indexes for performance
CREATE INDEX idx_school_memberships_user ON school_memberships(user_id);
CREATE INDEX idx_school_memberships_school ON school_memberships(school_id);
CREATE INDEX idx_ai_generations_chapter ON ai_generations(chapter_id);
```

### 3. Authentication Setup

Configure NextAuth.js in `frontend/lib/auth.ts`:

```typescript
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Implement your authentication logic
        // Return user object or null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    }
  }
};
```

## Implementation Examples

### Creating a School

**Frontend Call:**
```typescript
import { forumService } from '@/lib/forum/service';

const result = await forumService.createSchool(
  'Lincoln High School',
  'A great place to learn',
  userId
);
// Returns: { schoolId: 'thread-123', joinKey: 'ABC123' }
```

**What Happens:**
1. Frontend calls `/api/forum/schools` (POST)
2. API route authenticates user
3. API route calls Foru.ms to create thread:
   ```json
   {
     "title": "Lincoln High School",
     "content": "A great place to learn",
     "tags": ["school"],
     "metadata": {
       "joinKey": "ABC123",
       "isDemo": false
     }
   }
   ```
4. API route adds user to `school_memberships` table as admin
5. API route adds user as thread participant in Foru.ms

### Adding a Contribution

**Frontend Call:**
```typescript
const contributionId = await forumService.createContribution(chapterId, {
  title: 'Newton\'s First Law',
  content: 'An object at rest stays at rest...',
  type: 'takeaway',
  anonymous: false
});
```

**What Happens:**
1. Frontend calls `/api/forum/chapters/{chapterId}/contributions` (POST)
2. API route creates post in Foru.ms:
   ```json
   {
     "threadId": "chapter-thread-id",
     "content": "{\"title\":\"Newton's First Law\",\"content\":\"An object at rest...\"}",
     "tags": ["contribution", "type:takeaway"]
   }
   ```

### Generating AI Notes

**Frontend Call:**
```typescript
const aiNote = await forumService.generateNotes(chapterId, userId, 'student');
```

**What Happens:**
1. API route validates cooldown and contribution threshold
2. API route fetches all contribution posts from chapter thread
3. API route calls OpenAI API with structured prompt
4. API route creates unified_notes post with generated content:
   ```json
   {
     "threadId": "chapter-thread-id",
     "content": "# Physics Notes\n\n## Key Concepts...",
     "tags": ["unified_notes"],
     "metadata": {
       "version": 2,
       "generatedBy": "user-123",
       "contributionCount": 15
     }
   }
   ```

## Migration Strategy

### Phase 1: Infrastructure (Week 1)
- Set up Foru.ms API client
- Create proxy API routes
- Set up external database tables
- Test basic thread/post operations

### Phase 2: Read Operations (Week 2)
- Replace mock data with Foru.ms API calls
- Implement school/chapter/contribution fetching
- Test with real Foru.ms data

### Phase 3: Write Operations (Week 3)
- Implement school creation and joining
- Implement contribution creation
- Test end-to-end workflows

### Phase 4: Advanced Features (Week 4)
- Implement AI note generation
- Add real-time updates via Foru.ms webhooks
- Implement search functionality

### Phase 5: Polish & Deploy (Week 5)
- Remove mock data fallbacks
- Add comprehensive error handling
- Deploy to production

## Testing Strategy

### Unit Tests
```typescript
// Test mappers
describe('mapThreadToSchool', () => {
  it('should convert Foru.ms thread to School object', () => {
    const thread = {
      id: 'thread-123',
      title: 'Test School',
      tags: ['school'],
      metadata: { joinKey: 'ABC123' }
    };
    
    const school = mapThreadToSchool(thread, 'admin');
    expect(school.id).toBe('thread-123');
    expect(school.joinKey).toBe('ABC123');
  });
});
```

### Integration Tests
```typescript
// Test API routes
describe('/api/forum/schools', () => {
  it('should create school in Foru.ms', async () => {
    const response = await fetch('/api/forum/schools', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test School' })
    });
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.schoolId).toBeDefined();
    expect(data.joinKey).toHaveLength(6);
  });
});
```

### End-to-End Tests
- Create school → Join school → Add contribution → Generate notes
- Test role-based permissions
- Test Demo School restrictions
- Test multi-school switching

## Common Issues & Solutions

### Issue: API Key Exposure
**Problem:** Foru.ms API key visible in browser  
**Solution:** Always use Next.js API routes as proxy, never call Foru.ms directly from client

### Issue: Role Permission Bugs
**Problem:** Users have wrong permissions in different schools  
**Solution:** Always query `school_memberships` table, never cache roles globally

### Issue: Demo School Admin Access
**Problem:** Users can become admin in Demo School  
**Solution:** Check `isDemoSchool(schoolId)` in all admin routes

### Issue: Duplicate Join Keys
**Problem:** Multiple schools with same join key  
**Solution:** Check uniqueness before creating school, regenerate if collision

### Issue: AI Generation Race Conditions
**Problem:** Multiple simultaneous generations for same chapter  
**Solution:** Use database locking or check for in-progress generations

## Performance Optimization

### Caching Strategy
- Cache school lists for 5 minutes
- Cache subject/course lists for 10 minutes
- Cache contributions for 1 minute
- Never cache AI notes (always fresh)

### Rate Limiting
- Respect Foru.ms API rate limits
- Implement client-side debouncing for search
- Use Next.js `revalidate` for server components

### Database Optimization
- Index `school_memberships` by user_id and school_id
- Index `ai_generations` by chapter_id
- Use connection pooling for external database

## Monitoring & Debugging

### Logging
```typescript
// Add structured logging to API routes
console.log('Foru.ms API call', {
  endpoint: '/threads',
  method: 'POST',
  userId,
  timestamp: new Date().toISOString()
});
```

### Error Tracking
- Monitor Foru.ms API response times
- Track failed API calls and retry logic
- Alert on authentication failures
- Monitor database connection health

### Metrics to Track
- School creation rate
- Contribution creation rate
- AI generation success rate
- User authentication success rate
- API response times

This integration guide provides the foundation for successfully connecting Class Memory Rooms to Foru.ms while maintaining all the sophisticated features described in the technical documentation.