/**
 * Database Helper Functions
 * Centralized database operations for school memberships and AI generations
 * 
 * TODO: Replace with your actual database implementation
 * This file provides the interface that all API routes expect
 */

// Types
export interface SchoolMembership {
  id: string;
  userId: string;
  schoolId: string;
  role: 'student' | 'teacher' | 'admin';
  joinedAt: string;
}

export interface AIGeneration {
  id: string;
  chapterId: string;
  generatedBy: string;
  generatorRole: string;
  contributionCount: number;
  generatedAt: string;
}

export interface AISettings {
  minContributions: number;
  studentCooldown: number; // hours
}

// Mock data for development - REPLACE WITH REAL DATABASE
const mockMemberships: SchoolMembership[] = [
  {
    id: '1',
    userId: 'demo-user-1',
    schoolId: 'demo',
    role: 'student',
    joinedAt: '2024-01-01T00:00:00Z',
  },
];

const mockGenerations: AIGeneration[] = [];

const mockSettings: Record<string, AISettings> = {
  demo: {
    minContributions: 5,
    studentCooldown: 2,
  },
};

// School Membership Functions
export async function getUserSchoolMemberships(
  userId: string
): Promise<Record<string, { role: 'student' | 'teacher' | 'admin'; joinedAt: string }>> {
  // TODO: Replace with actual database query
  // Example SQL: SELECT school_id, role, joined_at FROM school_memberships WHERE user_id = $1
  
  const memberships = mockMemberships.filter(m => m.userId === userId);
  const result: Record<string, { role: 'student' | 'teacher' | 'admin'; joinedAt: string }> = {};
  
  memberships.forEach(membership => {
    result[membership.schoolId] = {
      role: membership.role,
      joinedAt: membership.joinedAt,
    };
  });
  
  return result;
}

export async function getSchoolMembership(
  userId: string,
  schoolId: string
): Promise<SchoolMembership | null> {
  // TODO: Replace with actual database query
  // Example SQL: SELECT * FROM school_memberships WHERE user_id = $1 AND school_id = $2
  
  return mockMemberships.find(m => m.userId === userId && m.schoolId === schoolId) || null;
}

export async function addSchoolMembership(
  userId: string,
  schoolId: string,
  role: 'student' | 'teacher' | 'admin'
): Promise<void> {
  // TODO: Replace with actual database insert
  // Example SQL: INSERT INTO school_memberships (user_id, school_id, role) VALUES ($1, $2, $3)
  
  const membership: SchoolMembership = {
    id: `mock-${Date.now()}`,
    userId,
    schoolId,
    role,
    joinedAt: new Date().toISOString(),
  };
  
  mockMemberships.push(membership);
  console.log(`Added membership: ${userId} -> ${schoolId} as ${role}`);
}

export async function updateMembershipRole(
  userId: string,
  schoolId: string,
  newRole: 'student' | 'teacher' | 'admin'
): Promise<void> {
  // TODO: Replace with actual database update
  // Example SQL: UPDATE school_memberships SET role = $1 WHERE user_id = $2 AND school_id = $3
  
  const membership = mockMemberships.find(m => m.userId === userId && m.schoolId === schoolId);
  if (membership) {
    membership.role = newRole;
    console.log(`Updated role: ${userId} in ${schoolId} to ${newRole}`);
  }
}

export async function getSchoolMembers(schoolId: string): Promise<Array<{
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'student' | 'teacher' | 'admin';
  joinedAt: string;
}>> {
  // TODO: Replace with actual database query with JOIN to users table
  // Example SQL: 
  // SELECT u.id, u.name, u.email, u.avatar, sm.role, sm.joined_at 
  // FROM school_memberships sm 
  // JOIN users u ON sm.user_id = u.id 
  // WHERE sm.school_id = $1
  
  const memberships = mockMemberships.filter(m => m.schoolId === schoolId);
  
  return memberships.map(membership => ({
    id: membership.userId,
    name: membership.userId === 'demo-user-1' ? 'Demo User' : 'Unknown User',
    email: membership.userId === 'demo-user-1' ? 'demo@example.com' : 'unknown@example.com',
    role: membership.role,
    joinedAt: membership.joinedAt,
  }));
}

// AI Generation Functions
export async function getLastGeneration(chapterId: string): Promise<AIGeneration | null> {
  // TODO: Replace with actual database query
  // Example SQL: SELECT * FROM ai_generations WHERE chapter_id = $1 ORDER BY generated_at DESC LIMIT 1
  
  const generations = mockGenerations
    .filter(g => g.chapterId === chapterId)
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  
  return generations[0] || null;
}

export async function recordGeneration(
  chapterId: string,
  userId: string,
  role: string,
  contributionCount: number
): Promise<void> {
  // TODO: Replace with actual database insert
  // Example SQL: INSERT INTO ai_generations (chapter_id, generated_by, generator_role, contribution_count) VALUES ($1, $2, $3, $4)
  
  const generation: AIGeneration = {
    id: `gen-${Date.now()}`,
    chapterId,
    generatedBy: userId,
    generatorRole: role,
    contributionCount,
    generatedAt: new Date().toISOString(),
  };
  
  mockGenerations.push(generation);
  console.log(`Recorded generation: ${chapterId} by ${userId} (${role}) with ${contributionCount} contributions`);
}

// AI Settings Functions
export async function getAISettings(schoolId: string, setting?: keyof AISettings): Promise<any> {
  // TODO: Replace with actual database query
  // Example SQL: SELECT ai_settings FROM schools WHERE id = $1
  
  const settings = mockSettings[schoolId] || {
    minContributions: 5,
    studentCooldown: 2,
  };
  
  if (setting) {
    return settings[setting];
  }
  
  return settings;
}

export async function updateAISettings(
  schoolId: string,
  settings: Partial<AISettings>
): Promise<void> {
  // TODO: Replace with actual database update
  // Example SQL: UPDATE schools SET ai_settings = $1 WHERE id = $2
  
  if (!mockSettings[schoolId]) {
    mockSettings[schoolId] = {
      minContributions: 5,
      studentCooldown: 2,
    };
  }
  
  Object.assign(mockSettings[schoolId], settings);
  console.log(`Updated AI settings for ${schoolId}:`, settings);
}

// Utility Functions
export function isDemoSchool(schoolId: string): boolean {
  return schoolId === 'demo';
}

export function isValidRole(role: string): role is 'student' | 'teacher' | 'admin' {
  return ['student', 'teacher', 'admin'].includes(role);
}

// Database initialization (for development)
export async function initializeDatabase(): Promise<void> {
  // TODO: Replace with actual database schema creation
  console.log('Database initialized (mock)');
}

// Export all functions for easy importing
export const db = {
  // Memberships
  getUserSchoolMemberships,
  getSchoolMembership,
  addSchoolMembership,
  updateMembershipRole,
  getSchoolMembers,
  
  // AI Generations
  getLastGeneration,
  recordGeneration,
  
  // Settings
  getAISettings,
  updateAISettings,
  
  // Utilities
  isDemoSchool,
  isValidRole,
  initializeDatabase,
};

/*
PRODUCTION DATABASE SCHEMA:

-- School memberships table
CREATE TABLE school_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  school_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, school_id)
);

-- AI generations tracking table
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

-- Optional: Schools table for AI settings
CREATE TABLE schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ai_settings JSONB DEFAULT '{"minContributions": 5, "studentCooldown": 2}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);
*/