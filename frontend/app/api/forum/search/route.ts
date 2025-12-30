/**
 * Search API Route Handler
 * Handles searching across chapters, contributions, and notes within a school
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/database';
import { withErrorHandling, createAPIError, ERROR_CODES, validators, validateFields } from '@/lib/error-handling';

// GET /api/forum/search - Search across school content
export const GET = withErrorHandling(async (request: NextRequest) => {
  // 1. Authenticate user
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw createAPIError('Please log in to search content', 401, ERROR_CODES.UNAUTHORIZED);
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const schoolId = searchParams.get('schoolId');
  const filters = searchParams.get('filters')?.split(',') || [];

  // 2. Validate input
  const validationErrors = validateFields([
    () => validators.required(query, 'query'),
    () => validators.minLength(query || '', 2, 'query'),
    () => validators.required(schoolId, 'schoolId'),
  ]);

  if (validationErrors.length > 0) {
    throw createAPIError('Invalid search parameters', 400, ERROR_CODES.INVALID_INPUT, {
      fieldErrors: validationErrors.reduce((acc, error) => {
        acc[error.field] = error.message;
        return acc;
      }, {} as Record<string, string>)
    });
  }

  // 3. Verify user has access to this school
  const membership = await db.getSchoolMembership(userId, schoolId!);
  if (!membership) {
    throw createAPIError('You do not have access to this school', 403, ERROR_CODES.FORBIDDEN);
  }

  // 4. Set authentication token for Foru.ms API
  const forumToken = session.user.forumToken;
  if (forumToken) {
    forumClient.setAuthToken(forumToken);
  }

  // 5. Search using Foru.ms API with proper scoping
  const searchTags = buildSearchTags(filters);
  const searchResults = await forumClient.search(query!, {
    tags: searchTags,
  });

  // 6. Filter results to only include content from this school
  const schoolResults = await filterResultsBySchool(
    searchResults,
    schoolId!,
    filters
  );

  // 7. Map results to frontend format with proper organization
  const mappedResults = await mapSearchResults(schoolResults, schoolId!);

  return NextResponse.json({
    results: mappedResults,
    query,
    schoolId,
    filters,
    total: mappedResults.length,
    resultsByType: organizeResultsByType(mappedResults),
  });
});

// Helper functions
function buildSearchTags(filters: string[]): string[] {
  const tagMap: Record<string, string[]> = {
    chapters: ['chapter'],
    contributions: ['contribution'],
    notes: ['unified_notes'],
    takeaways: ['contribution'],
    resources: ['contribution'],
    examples: ['contribution'],
    confusions: ['contribution'],
  };

  if (filters.length === 0) {
    return ['chapter', 'contribution', 'unified_notes'];
  }

  const tags = new Set<string>();
  filters.forEach(filter => {
    const filterTags = tagMap[filter] || [];
    filterTags.forEach(tag => tags.add(tag));
  });

  return Array.from(tags);
}

async function filterResultsBySchool(
  searchResults: { threads: any[]; posts: any[] },
  schoolId: string,
  filters: string[]
): Promise<{ threads: any[]; posts: any[] }> {
  const filteredThreads = [];
  const filteredPosts = [];

  // Filter threads (chapters and schools)
  for (const thread of searchResults.threads) {
    if (thread.extendedData?.type === 'chapter') {
      // Check if chapter belongs to this school
      const belongsToSchool = await threadBelongsToSchool(thread.id, schoolId);
      if (belongsToSchool) {
        filteredThreads.push(thread);
      }
    } else if (thread.extendedData?.type === 'school' && thread.id === schoolId) {
      // Include the school itself if it matches
      filteredThreads.push(thread);
    }
  }

  // Filter posts (contributions, notes, subjects, courses)
  for (const post of searchResults.posts) {
    const postType = post.extendedData?.type;
    
    if (['contribution', 'unified_notes', 'subject', 'course'].includes(postType)) {
      // Check if post belongs to this school
      const belongsToSchool = await postBelongsToSchool(post, schoolId);
      if (belongsToSchool) {
        // Apply additional filtering for contribution types
        if (postType === 'contribution' && filters.length > 0) {
          const contributionType = post.extendedData?.contributionType;
          const contributionFilters = ['takeaways', 'resources', 'examples', 'confusions'];
          const hasContributionFilter = filters.some(f => contributionFilters.includes(f));
          
          if (hasContributionFilter) {
            const typeMap: Record<string, string> = {
              takeaways: 'takeaway',
              resources: 'resource', 
              examples: 'solved_example',
              confusions: 'confusion'
            };
            
            const matchesFilter = filters.some(filter => 
              typeMap[filter] === contributionType
            );
            
            if (matchesFilter) {
              filteredPosts.push(post);
            }
          } else {
            filteredPosts.push(post);
          }
        } else {
          filteredPosts.push(post);
        }
      }
    }
  }

  return {
    threads: filteredThreads,
    posts: filteredPosts,
  };
}

async function threadBelongsToSchool(threadId: string, schoolId: string): Promise<boolean> {
  try {
    const thread = await forumClient.getThread(threadId);
    
    if (thread.extendedData?.type === 'chapter') {
      // Chapter thread - check if it belongs to a course in this school
      const courseId = thread.extendedData?.courseId;
      if (courseId) {
        return await courseBelongsToSchool(courseId, schoolId);
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking thread ownership:', error);
    return false;
  }
}

async function postBelongsToSchool(post: any, schoolId: string): Promise<boolean> {
  try {
    const postType = post.extendedData?.type;
    
    if (postType === 'subject' || postType === 'course') {
      // Subject and course posts should be in the school thread
      return post.threadId === schoolId;
    } else if (postType === 'contribution' || postType === 'unified_notes') {
      // Contributions and notes are in chapter threads
      return await threadBelongsToSchool(post.threadId, schoolId);
    }
    
    return false;
  } catch (error) {
    console.error('Error checking post ownership:', error);
    return false;
  }
}

async function courseBelongsToSchool(courseId: string, schoolId: string): Promise<boolean> {
  try {
    // Get all posts in school thread
    const schoolPosts = await forumClient.getPostsByThread(schoolId);
    
    // Check if courseId exists as a post in the school thread
    return schoolPosts.some(post => 
      post.id === courseId && post.extendedData?.type === 'course'
    );
  } catch (error) {
    console.error('Error checking course ownership:', error);
    return false;
  }
}

async function mapSearchResults(results: { threads: any[]; posts: any[] }, schoolId: string): Promise<any[]> {
  const mappedResults = [];

  // Map school threads
  for (const thread of results.threads) {
    if (thread.extendedData?.type === 'school') {
      mappedResults.push({
        type: 'school',
        id: thread.id,
        title: thread.title,
        excerpt: thread.content?.substring(0, 150) + '...' || '',
        createdAt: thread.createdAt,
      });
    } else if (thread.extendedData?.type === 'chapter') {
      // Get course information for context
      const courseId = thread.extendedData?.courseId;
      let courseCode = 'Unknown';
      
      if (courseId) {
        try {
          const course = await forumClient.getPost(courseId);
          courseCode = course.extendedData?.code || 'Unknown';
        } catch (error) {
          console.error('Error fetching course for chapter:', error);
        }
      }

      mappedResults.push({
        type: 'chapter',
        id: thread.id,
        title: thread.title,
        excerpt: thread.content?.substring(0, 150) + '...' || '',
        chapterId: thread.id,
        courseCode,
        status: thread.extendedData?.status || 'Collecting',
        createdAt: thread.createdAt,
      });
    }
  }

  // Map posts (subjects, courses, contributions, notes)
  for (const post of results.posts) {
    const postType = post.extendedData?.type;

    if (postType === 'subject') {
      mappedResults.push({
        type: 'subject',
        id: post.id,
        title: post.extendedData?.name || extractTitleFromContent(post.content) || 'Untitled Subject',
        excerpt: post.extendedData?.description || extractExcerptFromContent(post.content),
        color: post.extendedData?.color || '#3B82F6',
        createdAt: post.createdAt,
      });
    } else if (postType === 'course') {
      mappedResults.push({
        type: 'course',
        id: post.id,
        title: `${post.extendedData?.code || 'UNKNOWN'} - ${post.extendedData?.name || 'Untitled Course'}`,
        excerpt: extractExcerptFromContent(post.content),
        courseCode: post.extendedData?.code || 'UNKNOWN',
        teacher: post.extendedData?.teacher || 'Unknown',
        term: post.extendedData?.term || 'Unknown',
        createdAt: post.createdAt,
      });
    } else if (postType === 'contribution') {
      const contributionType = post.extendedData?.contributionType || 'unknown';
      
      mappedResults.push({
        type: 'contribution',
        id: post.id,
        title: post.extendedData?.title || extractTitleFromContent(post.content) || 'Untitled Contribution',
        excerpt: extractExcerptFromContent(post.content),
        chapterId: post.threadId,
        contributionType,
        anonymous: post.extendedData?.anonymous || false,
        helpfulCount: post.helpfulCount || 0,
        createdAt: post.createdAt,
      });
    } else if (postType === 'unified_notes') {
      mappedResults.push({
        type: 'notes',
        id: post.id,
        title: `AI Notes v${post.extendedData?.version || 1}`,
        excerpt: post.content?.substring(0, 150) + '...' || '',
        chapterId: post.threadId,
        version: post.extendedData?.version || 1,
        generatedBy: post.extendedData?.generatedBy || 'Unknown',
        contributionCount: post.extendedData?.contributionCount || 0,
        createdAt: post.createdAt,
      });
    }
  }

  // Sort by relevance/recency
  return mappedResults.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function organizeResultsByType(results: any[]): Record<string, any[]> {
  const organized: Record<string, any[]> = {
    schools: [],
    subjects: [],
    courses: [],
    chapters: [],
    contributions: [],
    notes: [],
  };

  results.forEach(result => {
    const type = result.type;
    if (organized[type + 's']) {
      organized[type + 's'].push(result);
    } else if (type === 'notes') {
      organized.notes.push(result);
    }
  });

  return organized;
}

function extractTitleFromContent(content: string): string | null {
  try {
    const parsed = JSON.parse(content);
    return parsed.title || null;
  } catch {
    // If not JSON, try to extract first line as title
    const firstLine = content.split('\n')[0];
    return firstLine.length > 0 && firstLine.length < 100 ? firstLine : null;
  }
}

function extractExcerptFromContent(content: string): string {
  try {
    const parsed = JSON.parse(content);
    const text = parsed.content || content;
    return text.substring(0, 150) + (text.length > 150 ? '...' : '');
  } catch {
    return content.substring(0, 150) + (content.length > 150 ? '...' : '');
  }
}

// Database helper function
async function getSchoolMembership(userId: string, schoolId: string): Promise<any> {
  return await db.getSchoolMembership(userId, schoolId);
}