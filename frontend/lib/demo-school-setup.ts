/**
 * Demo School Setup and Initialization
 * Creates demo school with sample content using Foru.ms API
 * Requirements: 9.1, 9.2, 9.3
 */

import { forumClient } from './forum/client';
import { db } from './database';
import { DEMO_SCHOOL_ID, DEMO_SCHOOL_NAME } from './demo-school';

export interface DemoSchoolSetupResult {
  schoolId: string;
  schoolName: string;
  subjectCount: number;
  courseCount: number;
  chapterCount: number;
  contributionCount: number;
}

// Sample demo content data
const DEMO_SUBJECTS = [
  {
    name: 'Mathematics',
    description: 'Core mathematical concepts and problem solving',
    color: '#3B82F6', // Blue
  },
  {
    name: 'Physics',
    description: 'Understanding the physical world through scientific principles',
    color: '#10B981', // Green
  },
  {
    name: 'Computer Science',
    description: 'Programming, algorithms, and computational thinking',
    color: '#8B5CF6', // Purple
  },
];

const DEMO_COURSES = [
  // Mathematics courses
  {
    subjectName: 'Mathematics',
    code: 'MATH101',
    name: 'Calculus I',
    description: 'Introduction to differential and integral calculus',
    teacher: 'Dr. Sarah Johnson',
    term: 'Fall 2024',
  },
  {
    subjectName: 'Mathematics',
    code: 'MATH201',
    name: 'Linear Algebra',
    description: 'Vector spaces, matrices, and linear transformations',
    teacher: 'Prof. Michael Chen',
    term: 'Spring 2024',
  },
  // Physics courses
  {
    subjectName: 'Physics',
    code: 'PHYS101',
    name: 'Classical Mechanics',
    description: 'Newton\'s laws, energy, and momentum',
    teacher: 'Dr. Emily Rodriguez',
    term: 'Fall 2024',
  },
  // Computer Science courses
  {
    subjectName: 'Computer Science',
    code: 'CS101',
    name: 'Introduction to Programming',
    description: 'Basic programming concepts using Python',
    teacher: 'Prof. David Kim',
    term: 'Fall 2024',
  },
];

const DEMO_CHAPTERS = [
  // Calculus I chapters
  {
    courseCode: 'MATH101',
    title: 'Limits and Continuity',
    description: 'Understanding limits and continuous functions',
    label: 'Chapter 1',
  },
  {
    courseCode: 'MATH101',
    title: 'Derivatives',
    description: 'Rules of differentiation and applications',
    label: 'Chapter 2',
  },
  // Linear Algebra chapters
  {
    courseCode: 'MATH201',
    title: 'Vector Spaces',
    description: 'Introduction to vector spaces and subspaces',
    label: 'Chapter 1',
  },
  // Classical Mechanics chapters
  {
    courseCode: 'PHYS101',
    title: 'Newton\'s Laws',
    description: 'The three laws of motion and their applications',
    label: 'Chapter 1',
  },
  // Programming chapters
  {
    courseCode: 'CS101',
    title: 'Variables and Data Types',
    description: 'Basic programming concepts and data structures',
    label: 'Chapter 1',
  },
];

const DEMO_CONTRIBUTIONS = [
  // Calculus I - Limits and Continuity contributions
  {
    chapterTitle: 'Limits and Continuity',
    courseCode: 'MATH101',
    type: 'takeaway' as const,
    title: 'Key Insight on Limits',
    content: 'A limit describes the behavior of a function as the input approaches a particular value. It doesn\'t matter what happens exactly at that point, only what happens as we get arbitrarily close.',
    anonymous: false,
  },
  {
    chapterTitle: 'Limits and Continuity',
    courseCode: 'MATH101',
    type: 'solved_example' as const,
    title: 'Limit Calculation Example',
    content: 'Find lim(x→2) (x² - 4)/(x - 2)\n\nSolution: Factor the numerator: (x² - 4) = (x + 2)(x - 2)\nSo we have: lim(x→2) (x + 2)(x - 2)/(x - 2) = lim(x→2) (x + 2) = 4',
    anonymous: false,
  },
  {
    chapterTitle: 'Limits and Continuity',
    courseCode: 'MATH101',
    type: 'confusion' as const,
    title: 'Confusion about Continuity',
    content: 'I\'m having trouble understanding when a function is continuous vs when it just has a limit. Can someone explain the difference?',
    anonymous: true,
  },
  // Derivatives contributions
  {
    chapterTitle: 'Derivatives',
    courseCode: 'MATH101',
    type: 'takeaway' as const,
    title: 'Power Rule',
    content: 'The power rule is fundamental: d/dx(x^n) = n·x^(n-1). This works for any real number n.',
    anonymous: false,
  },
  {
    chapterTitle: 'Derivatives',
    courseCode: 'MATH101',
    type: 'resource' as const,
    title: 'Derivative Rules Cheat Sheet',
    content: 'Here\'s a comprehensive list of derivative rules that I found helpful for the exam.',
    links: ['https://example.com/derivative-rules'],
    anonymous: false,
  },
  // Physics contributions
  {
    chapterTitle: 'Newton\'s Laws',
    courseCode: 'PHYS101',
    type: 'takeaway' as const,
    title: 'Newton\'s First Law',
    content: 'An object at rest stays at rest, and an object in motion stays in motion, unless acted upon by an external force. This is also called the law of inertia.',
    anonymous: false,
  },
  {
    chapterTitle: 'Newton\'s Laws',
    courseCode: 'PHYS101',
    type: 'solved_example' as const,
    title: 'Force Calculation',
    content: 'A 5kg object accelerates at 2 m/s². What force is applied?\n\nUsing F = ma:\nF = 5 kg × 2 m/s² = 10 N',
    anonymous: false,
  },
  // Computer Science contributions
  {
    chapterTitle: 'Variables and Data Types',
    courseCode: 'CS101',
    type: 'takeaway' as const,
    title: 'Variable Naming Best Practices',
    content: 'Use descriptive names for variables. Instead of \'x\' or \'temp\', use names like \'student_count\' or \'temperature_celsius\' that clearly indicate what the variable represents.',
    anonymous: false,
  },
  {
    chapterTitle: 'Variables and Data Types',
    courseCode: 'CS101',
    type: 'solved_example' as const,
    title: 'Python Data Types Example',
    content: '# Different data types in Python\nname = "Alice"  # string\nage = 20        # integer\nheight = 5.6    # float\nis_student = True  # boolean\ngrades = [85, 92, 78]  # list',
    anonymous: false,
  },
];

/**
 * Initialize the demo school with sample content
 */
export async function initializeDemoSchool(): Promise<DemoSchoolSetupResult> {
  console.log('Starting demo school initialization...');
  
  try {
    // 1. Create or verify demo school thread exists
    let demoSchoolThread;
    try {
      demoSchoolThread = await forumClient.getThread(DEMO_SCHOOL_ID);
      console.log('Demo school thread already exists');
    } catch (error) {
      // Create demo school thread
      demoSchoolThread = await forumClient.createThread({
        title: DEMO_SCHOOL_NAME,
        content: 'Welcome to the Demo High School! This is a sample school environment where you can explore all the features of Class Memory Rooms. Feel free to browse subjects, courses, and chapters to see how collaborative learning works.',
        tags: ['demo', 'school'],
        extendedData: {
          type: 'school',
          joinKey: 'DEMO01',
          isDemo: true,
          description: 'A demonstration school showcasing Class Memory Rooms features',
        },
      });
      console.log('Created demo school thread:', demoSchoolThread.id);
    }

    // 2. Create subjects
    const subjectMap = new Map<string, string>();
    for (const subject of DEMO_SUBJECTS) {
      const subjectPost = await forumClient.createPost({
        threadId: DEMO_SCHOOL_ID,
        content: subject.description,
        tags: ['subject', 'demo'],
        extendedData: {
          type: 'subject',
          name: subject.name,
          description: subject.description,
          color: subject.color,
          schoolId: DEMO_SCHOOL_ID,
          isDemo: true,
        },
      });
      subjectMap.set(subject.name, subjectPost.id);
      console.log(`Created subject: ${subject.name}`);
    }

    // 3. Create courses
    const courseMap = new Map<string, { id: string; subjectId: string }>();
    for (const course of DEMO_COURSES) {
      const subjectId = subjectMap.get(course.subjectName);
      if (!subjectId) {
        console.warn(`Subject not found for course: ${course.code}`);
        continue;
      }

      const coursePost = await forumClient.createPost({
        threadId: DEMO_SCHOOL_ID,
        content: course.description,
        tags: ['course', 'demo'],
        extendedData: {
          type: 'course',
          code: course.code,
          name: course.name,
          description: course.description,
          teacher: course.teacher,
          term: course.term,
          subjectId: subjectId,
          schoolId: DEMO_SCHOOL_ID,
          isDemo: true,
        },
      });
      courseMap.set(course.code, { id: coursePost.id, subjectId });
      console.log(`Created course: ${course.code} - ${course.name}`);
    }

    // 4. Create chapters
    const chapterMap = new Map<string, string>();
    for (const chapter of DEMO_CHAPTERS) {
      const courseInfo = courseMap.get(chapter.courseCode);
      if (!courseInfo) {
        console.warn(`Course not found for chapter: ${chapter.title}`);
        continue;
      }

      const chapterThread = await forumClient.createThread({
        title: chapter.title,
        content: chapter.description,
        tags: ['chapter', 'demo'],
        extendedData: {
          type: 'chapter',
          title: chapter.title,
          description: chapter.description,
          label: chapter.label,
          courseId: courseInfo.id,
          status: 'Collecting',
          isDemo: true,
        },
      });
      chapterMap.set(`${chapter.courseCode}-${chapter.title}`, chapterThread.id);
      console.log(`Created chapter: ${chapter.title} for ${chapter.courseCode}`);
    }

    // 5. Create contributions
    let contributionCount = 0;
    for (const contribution of DEMO_CONTRIBUTIONS) {
      const chapterKey = `${contribution.courseCode}-${contribution.chapterTitle}`;
      const chapterId = chapterMap.get(chapterKey);
      if (!chapterId) {
        console.warn(`Chapter not found for contribution: ${contribution.title}`);
        continue;
      }

      const contributionPost = await forumClient.createPost({
        threadId: chapterId,
        content: contribution.content,
        tags: ['contribution', 'demo'],
        extendedData: {
          type: 'contribution',
          contributionType: contribution.type,
          title: contribution.title,
          anonymous: contribution.anonymous,
          links: contribution.links || [],
          chapterId: chapterId,
          isDemo: true,
        },
      });
      contributionCount++;
      console.log(`Created contribution: ${contribution.title} (${contribution.type})`);
    }

    // 6. Update AI settings for demo school
    await db.updateAISettings(DEMO_SCHOOL_ID, {
      minContributions: 3, // Lower threshold for demo
      studentCooldown: 0.5, // 30 minutes for demo
      teacherCooldown: 0.25, // 15 minutes for demo
    });

    const result: DemoSchoolSetupResult = {
      schoolId: DEMO_SCHOOL_ID,
      schoolName: DEMO_SCHOOL_NAME,
      subjectCount: DEMO_SUBJECTS.length,
      courseCount: DEMO_COURSES.length,
      chapterCount: DEMO_CHAPTERS.length,
      contributionCount,
    };

    console.log('Demo school initialization completed:', result);
    return result;

  } catch (error) {
    console.error('Error initializing demo school:', error);
    throw new Error(`Failed to initialize demo school: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Auto-enroll a user in the demo school
 * Requirements: 9.1, 9.3
 */
export async function autoEnrollInDemoSchool(userId: string): Promise<void> {
  try {
    // Check if user is already enrolled
    const existingMembership = await db.getSchoolMembership(userId, DEMO_SCHOOL_ID);
    if (existingMembership) {
      console.log(`User ${userId} already enrolled in demo school`);
      return;
    }

    // Add user to demo school with student role
    await db.addSchoolMembership(userId, DEMO_SCHOOL_ID, 'student');

    // Add user as thread participant in Foru.ms
    try {
      await forumClient.addThreadParticipant(DEMO_SCHOOL_ID, userId);
    } catch (error) {
      console.warn('Could not add user to demo thread participants:', error);
      // This is not critical - membership is tracked in database
    }

    console.log(`Auto-enrolled user ${userId} in demo school`);
  } catch (error) {
    console.error('Error auto-enrolling user in demo school:', error);
    throw new Error(`Failed to auto-enroll user in demo school: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if demo school exists and is properly set up
 */
export async function isDemoSchoolSetup(): Promise<boolean> {
  try {
    // Check if demo school thread exists
    const demoThread = await forumClient.getThread(DEMO_SCHOOL_ID);
    
    // Check if it has the correct structure
    if (demoThread.extendedData?.type !== 'school' || !demoThread.extendedData?.isDemo) {
      return false;
    }

    // Check if subjects exist
    const subjects = await forumClient.getPostsByType('subject');
    const demoSubjects = subjects.filter(post => 
      post.extendedData?.schoolId === DEMO_SCHOOL_ID && post.extendedData?.isDemo
    );

    return demoSubjects.length > 0;
  } catch (error) {
    console.error('Error checking demo school setup:', error);
    return false;
  }
}

/**
 * Reset demo school (for testing/maintenance)
 */
export async function resetDemoSchool(): Promise<void> {
  console.log('Resetting demo school...');
  
  try {
    // Note: This is a simplified reset - in a real implementation,
    // you might want to delete existing content first
    await initializeDemoSchool();
    console.log('Demo school reset completed');
  } catch (error) {
    console.error('Error resetting demo school:', error);
    throw error;
  }
}

// Export utility functions
export const demoSchoolSetup = {
  initializeDemoSchool,
  autoEnrollInDemoSchool,
  isDemoSchoolSetup,
  resetDemoSchool,
};