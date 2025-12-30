/**
 * Foru.ms Response Mappers
 * Convert Foru.ms API responses to frontend types
 * Handle missing fields gracefully and provide defaults
 */

import { ForumThread, ForumPost, ForumUser } from './client';
import { School, Subject, Course, Chapter, Contribution, AiNote, UserRole } from '@/types';

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

// Helper to extract tag by prefix
function getTagValue(tags: string[], prefix: string): string | undefined {
  const tag = tags.find(t => t.startsWith(prefix));
  return tag ? tag.substring(prefix.length) : undefined;
}

// Map Foru.ms thread to School
export function mapThreadToSchool(thread: ForumThread, userRole?: UserRole): School {
  const extendedData = thread.extendedData || {};
  
  return {
    id: thread.id,
    name: thread.title,
    description: thread.content || undefined,
    slug: extendedData.slug || thread.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    joinKey: extendedData.joinKey,
    memberCount: thread.participantCount,
    userRole: userRole || 'student',
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
  };
}

// Map Foru.ms post to Subject
export function mapPostToSubject(post: ForumPost): Subject {
  const extendedData = post.extendedData || {};
  
  // Use extendedData for structured data, fallback to parsing content
  let subjectData = extendedData;
  if (!subjectData.name && post.content) {
    try {
      subjectData = JSON.parse(post.content);
    } catch {
      // Fallback if content is not JSON
      subjectData = { name: post.content, color: '#3B82F6' };
    }
  }

  return {
    id: post.id,
    name: subjectData.name || 'Untitled Subject',
    description: subjectData.description,
    color: subjectData.color || '#3B82F6',
    schoolId: post.threadId, // Subject post is in school thread
    courseCount: 0, // Will be populated by aggregation
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

// Map Foru.ms post to Course
export function mapPostToCourse(post: ForumPost): Course {
  const extendedData = post.extendedData || {};
  
  // Use extendedData for structured data, fallback to parsing content
  let courseData = extendedData;
  if (!courseData.name && post.content) {
    try {
      courseData = JSON.parse(post.content);
    } catch {
      // Fallback if content is not JSON
      courseData = { name: post.content, code: 'COURSE' };
    }
  }

  return {
    id: post.id,
    name: courseData.name || 'Untitled Course',
    description: courseData.description,
    code: courseData.code || 'COURSE',
    subjectId: post.parentPostId || '', // Course links to subject via parentPostId
    teacher: courseData.teacher || 'TBD',
    term: courseData.term || 'Current',
    chapterCount: 0, // Will be populated by aggregation
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

// Map Foru.ms thread to Chapter
export function mapThreadToChapter(thread: ForumThread): Chapter {
  const extendedData = thread.extendedData || {};
  
  return {
    id: thread.id,
    name: thread.title,
    description: thread.content || undefined,
    courseId: extendedData.courseId || '',
    label: extendedData.label || 'Chapter',
    status: extendedData.status || 'Collecting',
    contributionCount: 0, // Will be populated by counting posts
    hasAiNotes: false, // Will be set by checking for unified_notes posts
    latestAiNoteVersion: undefined,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
  };
}

// Map Foru.ms post to Contribution
export function mapPostToContribution(post: ForumPost, author?: ForumUser): Contribution {
  const extendedData = post.extendedData || {};
  const contributionType = extendedData.contributionType || getTagValue(post.tags, 'type:') as any || 'takeaway';
  
  // Use extendedData for structured data, fallback to parsing content
  let parsedContent = extendedData;
  if (!parsedContent.content && post.content) {
    try {
      parsedContent = JSON.parse(post.content);
    } catch {
      // Content is plain text
      parsedContent = { content: post.content };
    }
  }

  return {
    id: post.id,
    title: parsedContent.title || extendedData.title || 'Untitled',
    content: parsedContent.content || post.content,
    type: contributionType,
    link: parsedContent.link,
    imageUrl: parsedContent.imageUrl,
    links: parsedContent.links || [],
    userId: post.userId,
    chapterId: post.threadId,
    author: author ? {
      id: author.id,
      name: author.name,
      avatar: author.avatarUrl,
    } : {
      id: post.userId,
      name: 'Unknown User',
    },
    anonymous: parsedContent.anonymous || extendedData.anonymous || false,
    helpfulCount: post.helpfulCount || 0,
    replyCount: post.replyCount || 0,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

// Map Foru.ms post to AI Note
export function mapPostToAiNote(post: ForumPost): AiNote {
  const extendedData = post.extendedData || {};
  
  return {
    id: post.id,
    version: extendedData.version || 1,
    content: post.content,
    contributionCount: extendedData.contributionCount || 0,
    chapterId: post.threadId,
    generatedBy: {
      id: extendedData.generatedBy || post.userId,
      name: extendedData.generatedByName || 'AI Assistant',
    },
    createdAt: extendedData.generatedAt || post.createdAt,
  };
}

// Map array of threads to schools with role information
export function mapThreadsToSchools(
  threads: ForumThread[], 
  memberships: Record<string, { role: UserRole; joinedAt: string }>
): School[] {
  return threads
    .filter(thread => thread.extendedData?.type === 'school')
    .map(thread => {
      const membership = memberships[thread.id];
      return mapThreadToSchool(thread, membership?.role);
    });
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
export function mapPostsToAiNotes(posts: ForumPost[]): AiNote[] {
  return posts
    .filter(post => post.extendedData?.type === 'unified_notes')
    .map(mapPostToAiNote)
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
  return JSON.stringify(data);
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