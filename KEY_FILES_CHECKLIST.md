# Key Files Checklist - Read in This Order

## ✅ Phase 1: Core Infrastructure (Start Here!)

### 🔐 Authentication & Session
- [ ] `frontend/lib/auth.ts` - **CRITICAL** NextAuth config, Foru.ms login integration
- [ ] `frontend/app/api/auth/[...nextauth]/route.ts` - NextAuth API handler
- [ ] `frontend/lib/auth-store.ts` - Client-side auth state (Zustand)

### 🌐 Backend Communication
- [ ] `frontend/lib/forum/client.ts` - **MOST IMPORTANT** All Foru.ms API calls
- [ ] `frontend/lib/forum/service.ts` - Frontend service layer (wraps API routes)
- [ ] `frontend/lib/forum/mappers.ts` - Data transformation (Foru.ms ↔ App models)

### 💾 Data & Permissions
- [ ] `frontend/lib/database.ts` - Foru.ms-based storage (memberships, AI tracking)
- [ ] `frontend/lib/permissions.ts` - Role-based permission logic
- [ ] `frontend/lib/permission-middleware.ts` - API route permission checks

---

## ✅ Phase 2: API Routes (Backend Logic)

### 🏫 School Management
- [ ] `frontend/app/api/forum/schools/route.ts` - Get/Create schools
- [ ] `frontend/app/api/forum/schools/join/route.ts` - Join school by key
- [ ] `frontend/app/api/forum/schools/[schoolId]/subjects/route.ts` - Subjects CRUD
- [ ] `frontend/app/api/forum/schools/[schoolId]/members/route.ts` - Member management

### 📚 Course & Chapter Management
- [ ] `frontend/app/api/forum/courses/[courseId]/chapters/route.ts` - Chapters CRUD
- [ ] `frontend/app/api/forum/chapters/[chapterId]/route.ts` - Chapter details
- [ ] `frontend/app/api/forum/chapters/[chapterId]/contributions/route.ts` - Add contributions

### 🤖 AI Note Generation
- [ ] `frontend/app/api/forum/chapters/[chapterId]/generate-notes/route.ts` - Generate notes
- [ ] `frontend/app/api/forum/chapters/[chapterId]/notes/route.ts` - Get notes
- [ ] `frontend/lib/ai-generation.ts` - Gemini API integration

---

## ✅ Phase 3: Frontend Pages (UI)

### 🚪 Entry Points
- [ ] `frontend/app/layout.tsx` - Root layout, providers
- [ ] `frontend/app/page.tsx` - Home (redirects to gateway)
- [ ] `frontend/app/gateway/page.tsx` - **START HERE FOR UI** Main entry

### 🔑 Auth Pages
- [ ] `frontend/app/login/page.tsx` - Login UI
- [ ] `frontend/app/signup/page.tsx` - Registration UI

### 🏫 School Pages
- [ ] `frontend/app/school/[schoolId]/page.tsx` - School dashboard
- [ ] `frontend/app/school/[schoolId]/subject/[subjectId]/page.tsx` - Subject view
- [ ] `frontend/app/school/[schoolId]/admin/page.tsx` - Admin panel

### 📖 Course & Chapter Pages
- [ ] `frontend/app/course/[courseId]/page.tsx` - Course with chapters list
- [ ] `frontend/app/chapter/[chapterId]/page.tsx` - Chapter contributions
- [ ] `frontend/app/chapter/[chapterId]/notes/page.tsx` - AI-generated notes view

---

## ✅ Phase 4: Components & Hooks

### 🎨 Reusable Components
- [ ] `frontend/components/` - Browse to see available UI components
- [ ] `frontend/hooks/use-auth.ts` - Auth hook for components

---

## 🎯 Quick Reference: File Purposes

| File | Purpose | When to Read |
|------|---------|--------------|
| `lib/forum/client.ts` | All HTTP calls to Foru.ms | Understanding backend communication |
| `lib/forum/service.ts` | Frontend API wrapper | Understanding component → API flow |
| `lib/auth.ts` | NextAuth + Foru.ms auth | Debugging login/session issues |
| `lib/database.ts` | Membership & AI tracking | Understanding data storage |
| `lib/permissions.ts` | Role checks | Debugging permission errors |
| `app/api/forum/schools/route.ts` | School CRUD | Understanding school creation |
| `app/gateway/page.tsx` | Main entry UI | Understanding user flow |
| `app/school/[schoolId]/page.tsx` | School dashboard | Understanding school view |

---

## 🔍 Debugging Workflow

### Problem: Feature not working
1. **Find the UI component** → `app/*/page.tsx`
2. **Find the service call** → `lib/forum/service.ts`
3. **Find the API route** → `app/api/forum/*/route.ts`
4. **Check Foru.ms client** → `lib/forum/client.ts`
5. **Check browser Network tab** → See actual HTTP requests

### Problem: Authentication failing
1. Check `lib/auth.ts` → NextAuth configuration
2. Check `app/api/auth/[...nextauth]/route.ts` → Handler
3. Check browser cookies → Session token present?
4. Check API route → `getServerSession()` called?

### Problem: Permission denied
1. Check `lib/permissions.ts` → Role requirements
2. Check `lib/database.ts` → User membership exists?
3. Check API route → `checkSchoolMembership()` called?
4. Check Foru.ms → Membership post exists?

---

## 📋 Reading Order Recommendation

### For Understanding Overall Flow:
1. `lib/forum/client.ts` (backend communication)
2. `lib/auth.ts` (authentication)
3. `app/api/forum/schools/route.ts` (example API route)
4. `lib/forum/service.ts` (frontend service)
5. `app/gateway/page.tsx` (example UI)

### For Fixing Specific Features:
1. Find the page in `app/*/page.tsx`
2. Find the service call in `lib/forum/service.ts`
3. Find the API route in `app/api/forum/*/route.ts`
4. Check the Foru.ms client method in `lib/forum/client.ts`

### For Adding New Features:
1. Design the API route first
2. Add method to `lib/forum/client.ts` if needed
3. Add method to `lib/forum/service.ts`
4. Create/update UI in `app/*/page.tsx`

---

## 🚀 Pro Tips

- **Use `@/` imports** - Never use relative imports like `../../../`
- **Check Network tab** - See actual API calls and responses
- **Add console.logs** - Trace data flow through layers
- **Read error messages** - They usually point to the exact issue
- **Check environment variables** - Make sure all are set correctly

---

## 📚 Additional Resources

- **Architecture Guide**: `ARCHITECTURE_GUIDE.md` - Detailed flow diagrams
- **Deployment Guide**: `VERCEL_DEPLOYMENT_GUIDE.md` - Deployment instructions
- **Requirements**: `.kiro/specs/foru-ms-integration/requirements.md` - Feature requirements
- **Tasks**: `.kiro/specs/foru-ms-integration/tasks.md` - Implementation tasks
