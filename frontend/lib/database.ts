/**
 * Database Helper Functions
 * Centralized database operations for school memberships and AI generations
 * 
 * Uses Foru.ms API for data storage via structured extendedData fields
 * All data is stored as posts with specific types in the forum system
 */

import { forumClient } from './forum/client';

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
  teacherCooldown: number; // hours
}

// School Membership Functions
export async function getUserSchoolMemberships(
  userId: string
): Promise<Record<string, { role: 'student' | 'teacher' | 'admin'; joinedAt: string }>> {
  try {
    // Query Foru.ms for membership posts by this user
    const membershipPosts = await forumClient.getPostsByType('membership');
    
    // Filter for this user's memberships
    const userMemberships = membershipPosts.filter(post => 
      post.extendedData?.userId === userId
    );
    
    const result: Record<string, { role: 'student' | 'teacher' | 'admin'; joinedAt: string }> = {};
    
    userMemberships.forEach(post => {
      if (post.extendedData?.schoolId && post.extendedData?.role && post.extendedData?.joinedAt) {
        result[post.extendedData.schoolId] = {
          role: post.extendedData.role,
          joinedAt: post.extendedData.joinedAt,
        };
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error fetching user school memberships:', error);
    return {};
  }
}

export async function getSchoolMembership(
  userId: string,
  schoolId: string
): Promise<SchoolMembership | null> {
  try {
    // Query Foru.ms for membership posts
    const membershipPosts = await forumClient.getPostsByType('membership');
    
    // Find the specific membership
    const membershipPost = membershipPosts.find(post => 
      post.extendedData?.userId === userId && 
      post.extendedData?.schoolId === schoolId
    );
    
    if (!membershipPost || !membershipPost.extendedData) {
      return null;
    }
    
    return {
      id: membershipPost.id,
      userId: membershipPost.extendedData.userId,
      schoolId: membershipPost.extendedData.schoolId,
      role: membershipPost.extendedData.role,
      joinedAt: membershipPost.extendedData.joinedAt,
    };
  } catch (error) {
    console.error('Error fetching school membership:', error);
    return null;
  }
}

export async function addSchoolMembership(
  userId: string,
  schoolId: string,
  role: 'student' | 'teacher' | 'admin'
): Promise<void> {
  try {
    const joinedAt = new Date().toISOString();
    
    // Create a membership post in Foru.ms
    await forumClient.createPost({
      threadId: schoolId, // School thread ID
      content: 'School membership record',
      tags: ['membership'],
      extendedData: {
        type: 'membership',
        userId,
        schoolId,
        role,
        joinedAt,
      },
    });
    
    console.log(`Added membership: ${userId} -> ${schoolId} as ${role}`);
  } catch (error) {
    console.error('Error adding school membership:', error);
    throw error;
  }
}

export async function updateMembershipRole(
  userId: string,
  schoolId: string,
  newRole: 'student' | 'teacher' | 'admin'
): Promise<void> {
  try {
    // Find the existing membership post
    const membershipPosts = await forumClient.getPostsByType('membership');
    const membershipPost = membershipPosts.find(post => 
      post.extendedData?.userId === userId && 
      post.extendedData?.schoolId === schoolId
    );
    
    if (!membershipPost) {
      throw new Error(`Membership not found for user ${userId} in school ${schoolId}`);
    }
    
    // Update the post with new role
    const updatedExtendedData = {
      ...membershipPost.extendedData,
      role: newRole,
    };
    
    // Note: This assumes the forum client supports updating extendedData
    // If not, we might need to delete and recreate the post
    await forumClient.updatePost(membershipPost.id, JSON.stringify(updatedExtendedData));
    
    console.log(`Updated role: ${userId} in ${schoolId} to ${newRole}`);
  } catch (error) {
    console.error('Error updating membership role:', error);
    throw error;
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
  try {
    // Query Foru.ms for membership posts in this school
    const membershipPosts = await forumClient.getPostsByType('membership');
    const schoolMemberships = membershipPosts.filter(post => 
      post.extendedData?.schoolId === schoolId
    );
    
    // Get user details for each membership
    const members = await Promise.all(
      schoolMemberships.map(async (post) => {
        try {
          const user = await forumClient.getUser(post.extendedData.userId);
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatarUrl,
            role: post.extendedData.role,
            joinedAt: post.extendedData.joinedAt,
          };
        } catch (error) {
          // If user fetch fails, return basic info
          return {
            id: post.extendedData.userId,
            name: 'Unknown User',
            email: 'unknown@example.com',
            role: post.extendedData.role,
            joinedAt: post.extendedData.joinedAt,
          };
        }
      })
    );
    
    return members;
  } catch (error) {
    console.error('Error fetching school members:', error);
    return [];
  }
}

// AI Generation Functions
export async function getLastGeneration(chapterId: string): Promise<AIGeneration | null> {
  try {
    // Query Foru.ms for AI generation posts in this chapter
    const generationPosts = await forumClient.getPostsByThread(chapterId);
    const aiGenerationPosts = generationPosts.filter(post => 
      post.extendedData?.type === 'ai_generation'
    );
    
    // Sort by generation date and get the most recent
    const sortedGenerations = aiGenerationPosts.sort((a, b) => 
      new Date(b.extendedData.generatedAt).getTime() - new Date(a.extendedData.generatedAt).getTime()
    );
    
    const lastGeneration = sortedGenerations[0];
    if (!lastGeneration || !lastGeneration.extendedData) {
      return null;
    }
    
    return {
      id: lastGeneration.id,
      chapterId: lastGeneration.extendedData.chapterId,
      generatedBy: lastGeneration.extendedData.generatedBy,
      generatorRole: lastGeneration.extendedData.generatorRole,
      contributionCount: lastGeneration.extendedData.contributionCount,
      generatedAt: lastGeneration.extendedData.generatedAt,
    };
  } catch (error) {
    console.error('Error fetching last generation:', error);
    return null;
  }
}

export async function recordGeneration(
  chapterId: string,
  userId: string,
  role: string,
  contributionCount: number
): Promise<void> {
  try {
    const generatedAt = new Date().toISOString();
    
    // Create an AI generation tracking post in Foru.ms
    await forumClient.createPost({
      threadId: chapterId, // Chapter thread ID
      content: 'AI generation tracking record',
      tags: ['ai-generation'],
      extendedData: {
        type: 'ai_generation',
        chapterId,
        generatedBy: userId,
        generatorRole: role,
        contributionCount,
        generatedAt,
      },
    });
    
    console.log(`Recorded generation: ${chapterId} by ${userId} (${role}) with ${contributionCount} contributions`);
  } catch (error) {
    console.error('Error recording generation:', error);
    throw error;
  }
}

// AI Settings Functions
export async function getAISettings(schoolId: string, setting?: keyof AISettings): Promise<any> {
  try {
    // Query Foru.ms for school settings posts
    const settingsPosts = await forumClient.getPostsByType('school_settings');
    const schoolSettingsPost = settingsPosts.find(post => 
      post.extendedData?.schoolId === schoolId
    );
    
    // Default settings if none found
    const defaultSettings: AISettings = {
      minContributions: 5,
      studentCooldown: 2,
      teacherCooldown: 0.5,
    };
    
    const settings = schoolSettingsPost?.extendedData?.settings || defaultSettings;
    
    if (setting) {
      return settings[setting];
    }
    
    return settings;
  } catch (error) {
    console.error('Error fetching AI settings:', error);
    // Return defaults on error
    const defaultSettings: AISettings = {
      minContributions: 5,
      studentCooldown: 2,
      teacherCooldown: 0.5,
    };
    
    if (setting) {
      return defaultSettings[setting];
    }
    
    return defaultSettings;
  }
}

export async function updateAISettings(
  schoolId: string,
  settings: Partial<AISettings>
): Promise<void> {
  try {
    // Check if settings post already exists
    const settingsPosts = await forumClient.getPostsByType('school_settings');
    const existingSettingsPost = settingsPosts.find(post => 
      post.extendedData?.schoolId === schoolId
    );
    
    if (existingSettingsPost) {
      // Update existing settings
      const updatedSettings = {
        ...existingSettingsPost.extendedData.settings,
        ...settings,
      };
      
      const updatedExtendedData = {
        ...existingSettingsPost.extendedData,
        settings: updatedSettings,
        updatedAt: new Date().toISOString(),
      };
      
      await forumClient.updatePost(existingSettingsPost.id, JSON.stringify(updatedExtendedData));
    } else {
      // Create new settings post
      const defaultSettings: AISettings = {
        minContributions: 5,
        studentCooldown: 2,
        teacherCooldown: 0.5,
      };
      
      const newSettings = {
        ...defaultSettings,
        ...settings,
      };
      
      await forumClient.createPost({
        threadId: schoolId, // School thread ID
        content: 'School AI settings',
        tags: ['school-settings'],
        extendedData: {
          type: 'school_settings',
          schoolId,
          settings: newSettings,
          updatedAt: new Date().toISOString(),
        },
      });
    }
    
    console.log(`Updated AI settings for ${schoolId}:`, settings);
  } catch (error) {
    console.error('Error updating AI settings:', error);
    throw error;
  }
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
  // No initialization needed for Foru.ms-based storage
  // All data is stored as posts with structured extendedData
  console.log('Database initialized (Foru.ms-based storage)');
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
FORU.MS DATA STORAGE SCHEMA:

All data is stored within Foru.ms using structured extendedData fields:

-- School Memberships (Posts with extendedData.type = "membership")
{
  type: "membership",
  userId: string,
  schoolId: string,
  role: "student" | "teacher" | "admin",
  joinedAt: ISO timestamp
}

-- AI Generations (Posts with extendedData.type = "ai_generation")
{
  type: "ai_generation",
  chapterId: string,
  generatedBy: string,
  generatorRole: string,
  contributionCount: number,
  generatedAt: ISO timestamp
}

-- School Settings (Posts with extendedData.type = "school_settings")
{
  type: "school_settings",
  schoolId: string,
  settings: {
    minContributions: number,
    studentCooldown: number,
    teacherCooldown: number
  },
  updatedAt: ISO timestamp
}

All posts are tagged appropriately and use threadId to associate with schools/chapters.
*/