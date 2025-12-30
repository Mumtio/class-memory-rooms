/**
 * Type definitions for Class Memory Rooms
 */

export type UserRole = 'student' | 'teacher' | 'admin';

export interface School {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  joinKey: string;
  memberCount: number;
  userRole: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
  color: string;
  schoolId: string;
  courseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  name: string;
  description?: string;
  code: string;
  subjectId: string;
  teacher: string;
  term: string;
  chapterCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  name: string;
  description?: string;
  courseId: string;
  label?: string;
  status: 'Collecting' | 'AI Ready' | 'Compiled';
  contributionCount: number;
  hasAiNotes: boolean;
  latestAiNoteVersion?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Contribution {
  id: string;
  title?: string;
  content: string;
  type: 'takeaway' | 'notes_photo' | 'resource' | 'solved_example' | 'confusion';
  link?: string;
  imageUrl?: string;
  links: string[];
  userId: string;
  chapterId: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  anonymous: boolean;
  helpfulCount: number;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AiNote {
  id: string;
  version: number;
  content: string;
  contributionCount: number;
  chapterId: string;
  generatedBy: {
    id: string;
    name: string;
  };
  createdAt: string;
}