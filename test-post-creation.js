/**
 * Test Post Creation in Foru.ms
 * Based on the console screenshot showing "Create a new post" endpoint
 */

const API_KEY = '88e3494b-c191-429f-924a-b6440a9619cb';
const BASE_URL = 'https://foru.ms/api/v1';

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
      console.log('✅ Response:', JSON.stringify(data, null, 2));
      return { success: true, data, status: response.status };
    } else {
      const errorText = await response.text();
      console.log('❌ Error:', errorText.substring(0, 500));
      return { success: false, error: errorText, status: response.status };
    }
  } catch (error) {
    console.log('💥 Network Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testPostCreation() {
  console.log('📝 Testing Post Creation in Foru.ms');
  console.log('Based on console screenshot showing "Create a new post" endpoint');
  
  // First, let's see if we need to create a thread first
  console.log('\n📋 Step 1: Try creating a thread first');
  
  const threadData = {
    title: 'Test Thread for Class Memory Rooms',
    body: 'This is a test thread to see if we can create content.',
    tags: ['test', 'class-memory-rooms']
  };

  const threadResult = await makeRequest('POST', '/threads', threadData);
  
  let threadId = null;
  if (threadResult.success && threadResult.data.id) {
    threadId = threadResult.data.id;
    console.log(`✅ Thread created with ID: ${threadId}`);
  }

  // Test different post creation approaches
  console.log('\n📋 Step 2: Test Post Creation Methods');
  
  const postData = {
    title: 'Test Post',
    body: 'This is a test post content.',
    content: 'This is a test post content.', // Alternative field name
    threadId: threadId,
    thread_id: threadId, // Alternative field name
    tags: ['test-post']
  };

  // Method 1: Direct POST to /posts
  console.log('\n🔄 Method 1: POST /posts');
  const postResult1 = await makeRequest('POST', '/posts', postData);

  // Method 2: POST to /post (singular)
  console.log('\n🔄 Method 2: POST /post');
  const postResult2 = await makeRequest('POST', '/post', postData);

  // Method 3: If we have a thread, try posting to it
  if (threadId) {
    console.log('\n🔄 Method 3: POST /threads/{threadId}/posts');
    const postResult3 = await makeRequest('POST', `/threads/${threadId}/posts`, {
      title: 'Test Post in Thread',
      body: 'This is a test post in the created thread.',
      content: 'This is a test post in the created thread.'
    });
  }

  // Method 4: Try different post structures
  console.log('\n🔄 Method 4: Different post structure');
  const simplePost = {
    body: 'Simple post content without thread reference'
  };
  const postResult4 = await makeRequest('POST', '/posts', simplePost);

  // Method 5: Try with minimal data
  console.log('\n🔄 Method 5: Minimal post data');
  const minimalPost = {
    content: 'Minimal post content'
  };
  const postResult5 = await makeRequest('POST', '/posts', minimalPost);

  // Test if we can get the created content
  console.log('\n📋 Step 3: Verify Created Content');
  
  console.log('\n🔄 GET /threads (check if thread was created)');
  await makeRequest('GET', '/threads');
  
  console.log('\n🔄 GET /posts (check if posts were created)');
  await makeRequest('GET', '/posts');

  console.log('\n🎯 Post Creation Test Complete!');
}

testPostCreation().catch(console.error);