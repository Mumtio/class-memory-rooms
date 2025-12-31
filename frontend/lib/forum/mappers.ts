/**
 * Foru.ms Response Mappers
 * Convert Foru.ms API responses to frontend types
 * Handle missing fields gracefully and provide defaults
 */

import { ForumThread, ForumPost, ForumUser } from './client';
import { School, Subject, Course, Chapter, Contribution, UnifiedNotes } from '@/types/models';

// Helper to safely parse JSON metadata
function parseMetadata(metadata: any): Record<string, any> {
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  }
  return metadata || {};
}

// Map Foru.ms thread to School
export function mapThreadToSchool(thread: ForumThread): School {
  const extendedData = thread.extendedData || {};
  
  return {
    id: thread.id,
    name: thread.title,
    description: thread.body || extendedData.description || undefined,
    joinKey: extendedData.joinKey,
  };
}

// Map Foru.ms post to Subject
export function mapPostToSubject(post: ForumPost): Subject {
  const extendedData = post.extendedData || {};
  
  // Use extendedData for structured data, fallback to parsing body (Foru.ms uses body, not content)
  let subjectData = extendedData;
  if (!subjectData.name && post.body) {
    try {
      subjectData = JSON.parse(post.body);
    } catch {
      // Fallback if body is not JSON - use it as the name
      subjectData = { name: post.body, color: '#3B82F6' };
    }
  }

  return {
    id: post.id,
    name: subjectData.name || 'Untitled Subject',
    colorTag: subjectData.colorTag || subjectData.color || '#3B82F6',
    courseCount: subjectData.courseCount || 0,
    chapterCount: subjectData.chapterCount || 0,
    compiledCount: subjectData.compiledCount || 0,
    collectingCount: subjectData.collectingCount || 0,
  };
}

// Map Foru.ms post to Course
export function mapPostToCourse(post: ForumPost): Course {
  const extendedData = post.extendedData || {};
  
  // Use extendedData for structured data, fallback to parsing body (Foru.ms uses body, not content)
  let courseData = extendedData;
  if (!courseData.title && post.body) {
    try {
      courseData = JSON.parse(post.body);
    } catch {
      // Fallback if body is not JSON
      courseData = { title: post.body, code: 'COURSE' };
    }
  }

  return {
    id: post.id,
    subjectId: courseData.subjectId || post.parentId || '',
    code: courseData.code || 'COURSE',
    title: courseData.title || courseData.name || 'Untitled Course',
    teacher: courseData.teacher || 'TBD',
    term: courseData.term || 'Current',
    section: courseData.section || '',
  };
}

// Map Foru.ms thread to Chapter
export function mapThreadToChapter(thread: ForumThread): Chapter {
  const extendedData = thread.extendedData || {};
  
  return {
    id: thread.id,
    courseId: extendedData.courseId || '',
    label: extendedData.label || 'Chapter',
    title: thread.title,
    date: extendedData.date,
    status: extendedData.status || 'Collecting',
    contributions: extendedData.contributionCount || 0,
    resources: extendedData.resourceCount || 0,
    photos: extendedData.photoCount || 0,
  };
}

// Map Foru.ms post to Contribution
export function mapPostToContribution(post: ForumPost, author?: ForumUser): Contribution {
  const extendedData = post.extendedData || {};
  const contributionType = extendedData.contributionType || extendedData.type || 'takeaway';
  
  // Use extendedData for structured data, fallback to parsing body (Foru.ms uses body, not content)
  let parsedContent = extendedData;
  if (!parsedContent.content && post.body) {
    try {
      parsedContent = JSON.parse(post.body);
    } catch {
      // Body is plain text
      parsedContent = { content: post.body };
    }
  }

  return {
    id: post.id,
    chapterId: post.threadId,
    type: contributionType as any,
    title: parsedContent.title || extendedData.title,
    content: parsedContent.content || post.body,
    anonymous: parsedContent.anonymous || extendedData.anonymous || false,
    authorName: extendedData.authorName || author?.name || 'Unknown User',
    createdAt: post.createdAt,
    link: parsedContent.link,
    image: parsedContent.image,
    helpfulCount: post.helpfulCount || 0,
  };
}

// Map Foru.ms post to Unified Notes (AI Note)
export function mapPostToAiNote(post: ForumPost): UnifiedNotes | null {
  const extendedData = post.extendedData || {};
  
  // Try to parse the body as JSON for structured notes
  let notesData: any = {};
  if (post.body) {
    try {
      notesData = JSON.parse(post.body);
    } catch {
      // Body is not JSON, return null
      return null;
    }
  }
  
  return {
    id: post.id,
    chapterId: post.threadId,
    version: extendedData.version || 1,
    generatedAt: extendedData.generatedAt || post.createdAt,
    overview: notesData.overview || [],
    keyConcepts: notesData.keyConcepts || [],
    definitions: notesData.definitions || [],
    formulas: notesData.formulas || [],
    steps: notesData.steps || [],
    examples: notesData.examples || [],
    mistakes: notesData.mistakes || [],
    resources: notesData.resources || [],
    bestNotePhotos: notesData.bestNotePhotos || [],
    quickRevision: notesData.quickRevision || [],
  };
}

// Map array of threads to schools
export function mapThreadsToSchools(threads: ForumThread[]): School[] {
  return threads
    .filter(thread => thread.extendedData?.type === 'school')
    .map(thread => mapThreadToSchool(thread));
}

// Map array of posts to subjects
export function mapPostsToSubjects(posts: ForumPost[]): Subject[] {
  return posts
    .filter(post => post.extendedData?.type === 'subject')
    .map(mapPostToSubject);
}

// Map array of posts to courses
export function mapPostsToCourses(posts: ForumPost[]): Course[] {
  return posts
    .filter(post => post.extendedData?.type === 'course')
    .map(mapPostToCourse);
}

// Map array of threads to chapters
export function mapThreadsToChapters(threads: ForumThread[]): Chapter[] {
  return threads
    .filter(thread => thread.extendedData?.type === 'chapter')
    .map(mapThreadToChapter);
}

// Map array of posts to contributions with author information
export function mapPostsToContributions(
  posts: ForumPost[], 
  authors: Record<string, ForumUser>
): Contribution[] {
  return posts
    .filter(post => post.extendedData?.type === 'contribution')
    .map(post => mapPostToContribution(post, authors[post.userId]));
}

// Map array of posts to AI notes
export function mapPostsToAiNotes(posts: ForumPost[]): UnifiedNotes[] {
  return posts
    .filter(post => post.extendedData?.type === 'unified_notes')
    .map(mapPostToAiNote)
    .filter((note): note is UnifiedNotes => note !== null)
    .sort((a, b) => b.version - a.version); // Latest first
}

// Helper to create structured content for posts
export function createStructuredContent(data: {
  title?: string;
  content: string;
  imageUrl?: string;
  links?: string[];
  anonymous?: boolean;
}): string {
  // Convert imageUrl to image object format for consistency
  const structuredData: any = {
    title: data.title,
    content: data.content,
    links: data.links,
    anonymous: data.anonymous,
  };
  
  if (data.imageUrl) {
    structuredData.image = {
      url: data.imageUrl,
      alt: data.title || 'Uploaded image',
    };
  }
  
  return JSON.stringify(structuredData);
}

// Helper to create metadata for threads/posts
export function createMetadata(data: Record<string, any>): Record<string, any> {
  return data;
}

// Validation helpers
export function isValidSchoolThread(thread: ForumThread): boolean {
  return thread.extendedData?.type === 'school' && !!thread.extendedData.joinKey;
}

export function isValidChapterThread(thread: ForumThread): boolean {
  return thread.extendedData?.type === 'chapter';
}

export function isValidContributionPost(post: ForumPost): boolean {
  return post.extendedData?.type === 'contribution';
}

export function isValidSubjectPost(post: ForumPost): boolean {
  return post.extendedData?.type === 'subject';
}

export function isValidCoursePost(post: ForumPost): boolean {
  return post.extendedData?.type === 'course';
}

export function isValidAiNotePost(post: ForumPost): boolean {
  return post.extendedData?.type === 'unified_notes';
}