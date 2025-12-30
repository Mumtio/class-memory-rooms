# Foru.ms API Analysis & Integration Updates

## Discovered API Information

Based on research of the actual Foru.ms platform, here are the key findings that require updates to our integration:

### 1. API Configuration
- **Base URL**: `https://foru.ms/api/v1` (not `/api`)
- **Authentication**: `X-API-Key` header (not `Authorization: Bearer`)
- **Instance-specific**: Each instance has its own API key
- **Your instance**: `memory-room` (from console URL)

### 2. Data Structure (from Webhooks)
Based on the webhook documentation, Foru.ms uses this structure:

```json
{
  "event": "thread.created",
  "timestamp": "2024-12-14T12:00:00Z",
  "data": {
    "id": "thread_123",
    "title": "New Discussion Topic", 
    "body": "Thread content here...",
    "user": {
      "id": "user_456",
      "username": "john_doe",
      "displayName": "John Doe"
    },
    "tags": [
      {"id": "tag_1", "name": "General"}
    ],
    "createdAt": "2024-12-14T12:00:00Z"
  }
}
```

### 3. Key Differences from Our Implementation

#### Thread Structure
- Uses `body` instead of `content`
- Tags are objects with `id` and `name` (not just strings)
- Users have `username` and `displayName` (not just `name`)
- No `metadata` field mentioned (may not be supported)

#### Authentication
- Uses `X-API-Key` header instead of `Authorization: Bearer`
- Instance-specific API keys

#### Endpoints
- Likely follows REST conventions: `/threads`, `/posts`, `/users`
- May not support all the advanced features we assumed

## Required Updates

### 1. API Client Updates ✅ COMPLETED
- [x] Changed base URL to `https://foru.ms/api/v1`
- [x] Changed authentication to use `X-API-Key` header
- [x] Updated environment example

### 2. Data Structure Updates NEEDED

#### Update ForumThread Interface
```typescript
export interface ForumThread {
  id: string;
  title: string;
  body: string; // Changed from 'content'
  userId: string;
  createdAt: string;
  updatedAt?: string;
  tags: ForumTag[]; // Changed from string[]
  metadata?: Record<string, any>; // May not be supported
  participantCount?: number; // May not be available
}

export interface ForumTag {
  id: string;
  name: string;
}

export interface ForumUser {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
}
```

#### Update ForumPost Interface
```typescript
export interface ForumPost {
  id: string;
  threadId: string;
  userId: string;
  body: string; // Changed from 'content'
  createdAt: string;
  updatedAt?: string;
  tags: ForumTag[]; // Changed from string[]
  parentPostId?: string;
  helpfulCount?: number; // May not be supported
  replyCount?: number; // May not be supported
}
```

### 3. Endpoint Assumptions to Verify

We assumed these endpoints exist, but need to verify:
- `GET /threads` - List threads
- `POST /threads` - Create thread
- `GET /threads/{id}` - Get thread
- `GET /threads/{id}/posts` - Get posts in thread
- `POST /posts` - Create post
- `GET /posts/{id}` - Get post
- `GET /users/{id}` - Get user

### 4. Features That May Not Be Supported

#### Metadata Storage
Our integration heavily relies on storing metadata in threads/posts:
- School `joinKey` in thread metadata
- Chapter `courseId` in thread metadata  
- AI note `version` in post metadata

**Alternatives if metadata not supported:**
1. Use tags creatively: `joinkey:ABC123`, `courseid:course_123`
2. Store metadata in post body as JSON
3. Use external database for all metadata

#### Advanced Features
These may not be supported by Foru.ms:
- Thread participants management
- Post helpful/reaction system
- Advanced search with filters
- Custom user roles (beyond basic permissions)

## Recommended Next Steps

### 1. API Exploration
Test the actual Foru.ms API with your instance to understand:
- Available endpoints
- Actual request/response formats
- Supported features (metadata, tags, reactions, etc.)
- Rate limits and authentication

### 2. Create Test Script
```javascript
// test-foru-ms-api.js
const API_KEY = 'your-memory-room-api-key';
const BASE_URL = 'https://foru.ms/api/v1';

async function testAPI() {
  // Test basic endpoints
  const tests = [
    { method: 'GET', path: '/threads' },
    { method: 'GET', path: '/posts' }, 
    { method: 'GET', path: '/users' },
    { method: 'GET', path: '/tags' }
  ];

  for (const test of tests) {
    try {
      const response = await fetch(`${BASE_URL}${test.path}`, {
        method: test.method,
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`${test.method} ${test.path}:`, response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error(`${test.method} ${test.path} failed:`, error);
    }
  }
}

testAPI();
```

### 3. Fallback Strategy

If Foru.ms doesn't support all our required features:

#### Option A: Hybrid Approach
- Use Foru.ms for basic threads/posts
- Use external database for advanced features (metadata, roles, AI tracking)
- Map between the two systems

#### Option B: Simplified Integration  
- Reduce feature complexity to match Foru.ms capabilities
- Use tags creatively for categorization
- Store complex data in post bodies as JSON

#### Option C: Enhanced External Storage
- Use Foru.ms as primary storage
- Mirror all data in external database with enhancements
- Sync between systems via webhooks

## Updated Environment Variables

```env
# Foru.ms API Configuration (Updated)
FORUMMS_API_URL=https://foru.ms/api/v1
FORUMMS_API_KEY=your_memory_room_instance_api_key

# Instance Information
FORUMMS_INSTANCE=memory-room

# External Database (Still needed for roles/metadata)
DATABASE_URL=postgresql://user:pass@localhost:5432/class_memory_rooms

# AI Configuration
OPENAI_API_KEY=your_openai_key_here

# Authentication
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000
```

## Testing Plan

1. **API Discovery** - Test actual endpoints with your API key
2. **Data Structure Validation** - Verify request/response formats
3. **Feature Mapping** - Map our requirements to available features
4. **Integration Updates** - Update our code based on findings
5. **End-to-End Testing** - Test complete workflows

## Risk Assessment

### High Risk
- Metadata storage may not be supported
- Advanced features (reactions, participants) may be missing
- Search capabilities may be limited

### Medium Risk  
- Tag structure differences
- User management differences
- Rate limiting unknowns

### Low Risk
- Basic CRUD operations should work
- Authentication method is clear
- Webhook system is well documented

## Success Criteria

After API exploration, we should be able to:
1. Create and list threads successfully
2. Create and list posts in threads
3. Implement our entity mapping strategy
4. Handle authentication properly
5. Store/retrieve all required data (with fallbacks if needed)

---

**Next Action**: Test the actual Foru.ms API with your `memory-room` instance API key to validate our assumptions and update the integration accordingly.