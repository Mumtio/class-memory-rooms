/**
 * Demo Data Seeder Script
 * 
 * This script populates Foru.ms with demo school data
 * 
 * Run with: node scripts/seed-demo-data.js
 */

require('dotenv').config({ path: '.env.local' })

// Configuration
const FORUMMS_API_URL = process.env.FORUMMS_API_URL || 'https://foru.ms/api/v1'
const FORUMMS_API_KEY = process.env.FORUMMS_API_KEY
const DEMO_SCHOOL_JOIN_KEY = 'DEMO24'

// You need to provide credentials for a Foru.ms user
const FORUMMS_USERNAME = process.env.FORUMMS_SEED_USERNAME || 'demo_admin'
const FORUMMS_PASSWORD = process.env.FORUMMS_SEED_PASSWORD || 'demo_password_123'

if (!FORUMMS_API_KEY) {
  console.error('❌ FORUMMS_API_KEY environment variable is required')
  console.error('Make sure .env.local file exists with FORUMMS_API_KEY')
  process.exit(1)
}

let authToken = null

// Helper function to login and get auth token
async function login() {
  console.log('🔐 Logging in to Foru.ms...')
  
  try {
    // Try login with 'login' field (as used in the app)
    let response = await fetch(`${FORUMMS_API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': FORUMMS_API_KEY,
      },
      body: JSON.stringify({
        login: FORUMMS_USERNAME,
        password: FORUMMS_PASSWORD,
      }),
    })

    let loginError = null
    if (!response.ok) {
      loginError = await response.text()
      console.log(`⚠️  Login failed (${response.status}): ${loginError}`)
      
      // Try to register if login fails
      console.log('⚠️  Attempting to register new user...')
      const registerResponse = await fetch(`${FORUMMS_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': FORUMMS_API_KEY,
        },
        body: JSON.stringify({
          username: FORUMMS_USERNAME,
          password: FORUMMS_PASSWORD,
          email: `${FORUMMS_USERNAME}@example.com`,
        }),
      })

      if (!registerResponse.ok) {
        const errorText = await registerResponse.text()
        // If user already exists (409), we need to use a different username or reset password
        if (registerResponse.status === 409) {
          console.log('⚠️  User already exists but login failed')
          console.log('💡 Options:')
          console.log('   1. Change FORUMMS_SEED_USERNAME in .env.local to a new username')
          console.log('   2. Or reset the password for demo_admin in Foru.ms')
          throw new Error(`User exists but login failed. Try a different username.`)
        }
        throw new Error(`Registration failed: ${registerResponse.status} - ${errorText}`)
      }

      const registerData = await registerResponse.json()
      authToken = registerData.token
      console.log('✅ User registered successfully')
    } else {
      const loginData = await response.json()
      authToken = loginData.token
      console.log('✅ Logged in successfully')
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error.message)
    throw error
  }
}

// Helper function to make API calls
async function forumApiCall(endpoint, method = 'GET', data = null) {
  if (!authToken) {
    throw new Error('Not authenticated. Call login() first.')
  }

  const url = `${FORUMMS_API_URL}${endpoint}`
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      'X-API-Key': FORUMMS_API_KEY,
    },
  }

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data)
  }

  console.log(`📡 ${method} ${endpoint}`)
  const response = await fetch(url, options)
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API call failed: ${response.status} - ${error}`)
  }

  return response.json()
}

// Demo data structure
const demoData = {
  school: {
    name: 'Demo High School',
    description: 'A collaborative learning environment for students to share notes, resources, and knowledge.',
  },
  subjects: [
    { id: 'phy', name: 'Physics', colorTag: '#7EC8E3' },
    { id: 'math', name: 'Mathematics', colorTag: '#FFE45C' },
    { id: 'cse', name: 'Computer Science', colorTag: '#D6FF3F' },
    { id: 'chem', name: 'Chemistry', colorTag: '#FF6B6B' },
  ],
  courses: {
    phy: [
      { code: 'PHY-101', title: 'Mechanics I', teacher: 'Ms. Farzana Ahmed', term: 'Fall 2025', section: 'A' },
      { code: 'PHY-102', title: 'Waves & Optics', teacher: 'Mr. Arif Rahman', term: 'Fall 2025', section: 'B' },
      { code: 'PHY-201', title: 'Electromagnetism', teacher: 'Dr. Kamal Hossain', term: 'Fall 2025', section: 'A' },
    ],
    math: [
      { code: 'MATH-201', title: 'Calculus II', teacher: 'Dr. Nabila Khan', term: 'Fall 2025', section: 'A' },
      { code: 'MATH-301', title: 'Linear Algebra', teacher: 'Prof. Sadiq Ali', term: 'Fall 2025', section: 'B' },
    ],
    cse: [
      { code: 'CSE-110', title: 'Intro to Programming', teacher: 'Mr. Kabir Hassan', term: 'Fall 2025', section: 'A' },
      { code: 'CSE-220', title: 'Data Structures', teacher: 'Ms. Rukhsar Begum', term: 'Fall 2025', section: 'B' },
    ],
    chem: [
      { code: 'CHEM-121', title: 'Organic Chemistry I', teacher: 'Ms. Tania Sultana', term: 'Fall 2025', section: 'A' },
      { code: 'CHEM-221', title: 'Physical Chemistry', teacher: 'Dr. Rafiq Ahmed', term: 'Fall 2025', section: 'C' },
    ],
  },
  chapters: {
    'PHY-101': [
      { label: 'Lec 01', title: 'Vectors & Scalars', date: 'Sep 5', status: 'Compiled' },
      { label: 'Lec 02', title: 'Newton\'s Laws', date: 'Sep 8', status: 'Compiled' },
      { label: 'Lec 03', title: 'Friction & Inclines', date: 'Sep 12', status: 'AI Ready' },
    ],
    'PHY-102': [
      { label: 'Lec 01', title: 'Wave Properties', date: 'Sep 6', status: 'Compiled' },
      { label: 'Lec 02', title: 'Sound Waves', date: 'Sep 9', status: 'Compiled' },
    ],
    'MATH-201': [
      { label: 'Lec 01', title: 'Integration Techniques', date: 'Sep 5', status: 'Compiled' },
      { label: 'Lec 02', title: 'Series & Sequences', date: 'Sep 8', status: 'Compiled' },
    ],
    'CSE-110': [
      { label: 'Lec 01', title: 'Intro to Python', date: 'Sep 5', status: 'Compiled' },
      { label: 'Lec 02', title: 'Variables & Data Types', date: 'Sep 8', status: 'Compiled' },
    ],
  },
  sampleContributions: [
    {
      type: 'takeaway',
      title: 'Key Concept',
      content: 'This is an important takeaway from the lecture that helps understand the core concept.',
      anonymous: false,
      authorName: 'Demo Student',
    },
    {
      type: 'resource',
      title: 'Helpful Resource',
      content: 'Check out this resource for more information.',
      link: { url: 'https://example.com', title: 'Example Resource' },
      anonymous: false,
      authorName: 'Demo Student',
    },
    {
      type: 'solved_example',
      title: 'Practice Problem Solution',
      content: 'Here is how to solve a typical problem from this chapter:\n\nStep 1: Identify the given information\nStep 2: Apply the relevant formula\nStep 3: Calculate the result',
      anonymous: false,
      authorName: 'Demo Student',
    },
  ],
}

async function seedDemoData() {
  console.log('🌱 Starting demo data seeding...\n')

  try {
    // Step 0: Login to get auth token
    await login()
    console.log('')

    // Step 1: Create Demo School
    console.log('📚 Creating Demo School...')
    const schoolThread = await forumApiCall('/thread', 'POST', {
      title: demoData.school.name,
      body: demoData.school.description,
      userId: 'system', // Will be replaced by authenticated user
      extendedData: {
        type: 'school',
        joinKey: DEMO_SCHOOL_JOIN_KEY,
        isDemo: true,
        name: demoData.school.name,
        description: demoData.school.description,
      },
    })
    const schoolId = schoolThread.id
    console.log(`✅ School created: ${schoolId}\n`)

    // Step 2: Create Subjects
    console.log('📖 Creating Subjects...')
    const subjectIds = {}
    
    for (const subject of demoData.subjects) {
      const subjectPost = await forumApiCall('/post', 'POST', {
        threadId: schoolId,
        body: `Subject: ${subject.name}`,
        userId: 'system',
        extendedData: {
          type: 'subject',
          name: subject.name,
          colorTag: subject.colorTag,
          subjectId: subject.id,
        },
      })
      subjectIds[subject.id] = subjectPost.id
      console.log(`  ✅ ${subject.name}`)
    }
    console.log('')

    // Step 3: Create Courses
    console.log('📝 Creating Courses...')
    const courseIds = {}
    
    for (const [subjectKey, courses] of Object.entries(demoData.courses)) {
      for (const course of courses) {
        const coursePost = await forumApiCall('/post', 'POST', {
          threadId: schoolId,
          body: `${course.code}: ${course.title}`,
          userId: 'system',
          extendedData: {
            type: 'course',
            subjectId: subjectIds[subjectKey],
            code: course.code,
            title: course.title,
            teacher: course.teacher,
            term: course.term,
            section: course.section,
          },
        })
        courseIds[course.code] = coursePost.id
        console.log(`  ✅ ${course.code}: ${course.title}`)
      }
    }
    console.log('')

    // Step 4: Create Chapters
    console.log('📑 Creating Chapters...')
    const chapterIds = []
    
    for (const [courseCode, chapters] of Object.entries(demoData.chapters)) {
      for (const chapter of chapters) {
        const chapterThread = await forumApiCall('/thread', 'POST', {
          title: `${chapter.label}: ${chapter.title}`,
          body: `Chapter for ${courseCode}`,
          userId: 'system',
          extendedData: {
            type: 'chapter',
            courseId: courseIds[courseCode],
            label: chapter.label,
            title: chapter.title,
            date: chapter.date,
            status: chapter.status,
          },
        })
        chapterIds.push(chapterThread.id)
        console.log(`  ✅ ${courseCode} - ${chapter.label}: ${chapter.title}`)
      }
    }
    console.log('')

    // Step 5: Add Sample Contributions to First Few Chapters
    console.log('💬 Adding Sample Contributions...')
    const chaptersToSeed = chapterIds.slice(0, 5) // Add contributions to first 5 chapters
    
    for (const chapterId of chaptersToSeed) {
      for (const contribution of demoData.sampleContributions) {
        await forumApiCall('/post', 'POST', {
          threadId: chapterId,
          body: contribution.content,
          userId: 'system',
          extendedData: {
            type: 'contribution',
            contributionType: contribution.type,
            title: contribution.title,
            anonymous: contribution.anonymous,
            authorName: contribution.authorName,
            link: contribution.link,
          },
        })
      }
      console.log(`  ✅ Added contributions to chapter ${chapterId}`)
    }
    console.log('')

    // Summary
    console.log('🎉 Demo data seeding completed successfully!\n')
    console.log('📊 Summary:')
    console.log(`  - School ID: ${schoolId}`)
    console.log(`  - Join Key: ${DEMO_SCHOOL_JOIN_KEY}`)
    console.log(`  - Subjects: ${demoData.subjects.length}`)
    console.log(`  - Courses: ${Object.values(demoData.courses).flat().length}`)
    console.log(`  - Chapters: ${chapterIds.length}`)
    console.log(`  - Sample Contributions: ${chaptersToSeed.length * demoData.sampleContributions.length}`)
    console.log('\n✨ You can now join the demo school with key: DEMO24')

  } catch (error) {
    console.error('\n❌ Error seeding demo data:', error)
    process.exit(1)
  }
}

// Run the seeder
seedDemoData()
