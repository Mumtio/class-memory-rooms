/**
 * Test Content Creation with Valid User ID
 * Now that we have a valid user ID, test if we can create threads and posts
 */

const API_KEY = '88e3494b-c191-429f-924a-b6440a9619cb';
const BASE_URL = 'https://foru.ms/api/v1';
const VALID_USER_ID = '3c85b0c8-b556-4b08-a19d-7f61e694f8f2'; // From previous test

async function makeRequest(method, path, body = null) {
  const url = `${BASE_URL}${path}`;
  
  const options = {
    method,
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`\n🔄 ${method} ${path}`);
    if (body) {
      console.log('📤 Body:', JSON.stringify(body, null, 2));
    }
    
    const response = await fetch(url, options);
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS:', JSON.stringify(data, null, 2));
      return { success: true, data, status: response.status };
    } else {
      const errorText = await response.text();
      console.log('❌ Error:', errorText);
      return { success: false, error: errorText, status: response.status };
    }
  } catch (error) {
    console.log('💥 Network Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testContentCreation() {
  console.log('📝 Testing Content Creation with Valid User ID');
  console.log(`👤 Using User ID: ${VALID_USER_ID}`);
  
  // Test 1: Try to login first
  console.log('\n📋 Step 1: Test login');
  const loginData = {
    login: 'testuser_1767107166881', // Username from previous test
    password: 'testpassword123'
  };
  
  const loginResult = await makeRequest('POST', '/auth/login', loginData);
  let authToken = null;
  
  if (loginResult.success) {
    authToken = loginResult.data.token;
    console.log(`🎫 Login Token: ${authToken}`);
  }

  // Test 2: Create a thread
  console.log('\n📋 Step 2: Create a thread');
  const threadData = {
    title: "Class Memory Rooms - Demo School",
    body: "Welcome to the Demo School for Class Memory Rooms!",
    userId: VALID_USER_ID,
    extendedData: {
      type: "school",
      joinKey: "DEMO123",
      isDemo: true
    }
  };

  const threadResult = await makeRequest('POST', '/thread', threadData);
  
  let threadId = null;
  if (threadResult.success && threadResult.data.id) {
    threadId = threadResult.data.id;
    console.log(`✅ Thread created with ID: ${threadId}`);
  }

  // Test 3: Create a post in the thread
  if (threadId) {
    console.log('\n📋 Step 3: Create a post in the thread');
    const postData = {
      body: "This is the first post in our Demo School thread!",
      threadId: threadId,
      userId: VALID_USER_ID,
      parentId: null,
      extendedData: {
        type: "subject",
        name: "Mathematics",
        description: "Math courses and chapters"
      }
    };

    const postResult = await makeRequest('POST', '/post', postData);
    
    if (postResult.success) {
      console.log('✅ Post creation successful!');
      
      // Test 4: Create a reply to the post
      console.log('\n📋 Step 4: Create a reply to the post');
      const replyData = {
        body: "This is a reply to the first post - testing nested content!",
        threadId: threadId,
        userId: VALID_USER_ID,
        parentId: postResult.data.id,
        extendedData: {
          type: "course",
          code: "MATH101",
          name: "Calculus I"
        }
      };

      await makeRequest('POST', '/post', replyData);
    }
  }

  // Test 5: Create another thread for testing
  console.log('\n📋 Step 5: Create another thread (Chapter)');
  const chapterThreadData = {
    title: "MATH101 - Chapter 1: Limits",
    body: "Chapter about limits in calculus",
    userId: VALID_USER_ID,
    extendedData: {
      type: "chapter",
      courseId: "math101",
      status: "Collecting"
    }
  };

  const chapterResult = await makeRequest('POST', '/thread', chapterThreadData);
  
  if (chapterResult.success && chapterResult.data.id) {
    const chapterId = chapterResult.data.id;
    console.log(`✅ Chapter thread created with ID: ${chapterId}`);
    
    // Add some contributions to the chapter
    console.log('\n📋 Step 6: Add contributions to the chapter');
    
    const contributions = [
      {
        body: "Key takeaway: The limit of a function describes its behavior as the input approaches a value.",
        threadId: chapterId,
        userId: VALID_USER_ID,
        parentId: null,
        extendedData: {
          type: "contribution",
          contributionType: "takeaway",
          title: "Understanding Limits"
        }
      },
      {
        body: "Solved example: Find the limit of (x²-1)/(x-1) as x approaches 1.",
        threadId: chapterId,
        userId: VALID_USER_ID,
        parentId: null,
        extendedData: {
          type: "contribution",
          contributionType: "solved_example",
          title: "Limit Calculation Example"
        }
      }
    ];

    for (const contribution of contributions) {
      await makeRequest('POST', '/post', contribution);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
    }
  }

  // Test 6: Check final state
  console.log('\n📋 Step 7: Check final state');
  
  console.log('\n🔄 GET /users');
  await makeRequest('GET', '/users');
  
  console.log('\n🔄 GET /threads');
  await makeRequest('GET', '/threads');
  
  console.log('\n🔄 GET /posts');
  await makeRequest('GET', '/posts');

  console.log('\n🎯 Content Creation Test Complete!');
  console.log('🚀 Ready to implement full Class Memory Rooms integration with Foru.ms!');
}

testContentCreation().catch(console.error);