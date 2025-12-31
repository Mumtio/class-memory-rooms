# Mock Data to Real API Migration Plan

## Current Status
Many components and pages are still using `mock-data.ts` instead of real API calls to Foru.ms.

## Files Using Mock Data (Need to Fix)

### Critical Pages (High Priority)
1. ✅ `app/chapter/[chapterId]/notes/page.tsx` - FIXED (uses real API)
2. ❌ `app/chapter/[chapterId]/page.tsx` - Uses mock contributions
3. ❌ `app/course/[courseId]/page.tsx` - Uses mock chapters
4. ❌ `app/school/[schoolId]/subject/[subjectId]/page.tsx` - Uses mock courses
5. ❌ `app/search/page.tsx` - Uses mock data for search
6. ❌ `app/saved/page.tsx` - Uses mock saved items
7. ❌ `app/page.tsx` - Uses mock featured chapters

### Components (Medium Priority)
8. ❌ `components/school-page-content.tsx` - Uses mock subjects
9. ❌ `components/chapter-page-content.tsx` - Uses mock contributions
10. ❌ `components/admin-page-content.tsx` - Uses mock data

### Type Definitions (Keep)
- `components/contribution-card.tsx` - Only imports types ✅
- `components/chapter-folder-card.tsx` - Only imports types ✅
- `components/course-row.tsx` - Only imports types ✅
- `components/subject-card.tsx` - Only imports types ✅
- `components/note-stack.tsx` - Only imports types ✅
- `components/notes-page-content.tsx` - Only imports types ✅
- `components/unified-notes-preview.tsx` - Only imports types ✅

## Migration Strategy

### Phase 1: Keep Types, Remove Data
Move type definitions from `mock-data.ts` to `types/` folder and keep them.
Remove all actual mock data arrays.

### Phase 2: Update Pages to Use Real APIs
Update each page to fetch from API routes instead of mock data.

### Phase 3: Create Demo School Seeder (Optional)
Create a script to populate Foru.ms with demo data if needed for testing.

## Recommended Approach

Since you want everything to use real APIs, I recommend:

1. **Keep the type definitions** - They're useful for TypeScript
2. **Remove all mock data arrays** - No more fake data
3. **Update pages one by one** - Make them fetch from real APIs
4. **Test each page** - Ensure it works with real Foru.ms data

## Quick Win: Remove Mock Data File

The fastest approach is to:
1. Extract types to `types/models.ts`
2. Delete `mock-data.ts`
3. Fix import errors by updating to use real API calls
4. This forces us to use real data everywhere

Would you like me to proceed with this approach?
