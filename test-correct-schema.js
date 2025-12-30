/**
 * Test Post Creation with Correct Schema
 * Using the schema you provided: {"body": "string","threadId": "string","userId": "string","parentId": "string","extendedData": {}}
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

async function testCorrectSchema() {
  console.log('🎯 Testing Post Creation with Correct Schema');
  console.log('Schema: {"body": "string","threadId": "string","userId": "string","parentId": "string","extendedData": {}}');
  
  // First, let's see if we need to create a thread or if there are existing threads
  console.log('\n📋 Step 1: Check for existing threads');
  const threadsResult = await makeRequest('GET', '/threads');
  
  // Test with the exact schema structure
  console.log('\n📋 Step 2: Test with correct schema (minimal required fields)');
  
  const postData1 = {
    body: "This is a test post created with the correct schema!",
    threadId: "test-thread-id", // We might need a real thread ID
    userId: "test-user-id",
    parentId: null, // For top-level posts
    extendedData: {}
  };

  const result1 = await makeRequest('POST', '/post', postData1);

  // Test with different variations
  console.log('\n📋 Step 3: Test with parentId as empty string');
  const postData2 = {
    body: "Test post with empty string parentId",
    threadId: "test-thread-id",
    userId: "test-user-id", 
    parentId: "", // Empty string instead of null
    extendedData: {}
  };

  const result2 = await makeRequest('POST', '/post', postData2);

  // Test without parentId
  console.log('\n📋 Step 4: Test without parentId field');
  const postData3 = {
    body: "Test post without parentId field",
    threadId: "test-thread-id",
    userId: "test-user-id",
    extendedData: {}
  };

  const result3 = await makeRequest('POST', '/post', postData3);

  // Test with extendedData containing some data
  console.log('\n📋 Step 5: Test with extendedData containing metadata');
  const postData4 = {
    body: "Test post with extended data",
    threadId: "test-thread-id", 
    userId: "test-user-id",
    parentId: null,
    extendedData: {
      type: "contribution",
      contributionType: "takeaway",
      title: "Test Contribution",
      anonymous: false
    }
  };

  const result4 = await makeRequest('POST', '/post', postData4);

  // If we need a real thread ID, let's try to create one first
  console.log('\n📋 Step 6: Try to create a thread first (if needed)');
  
  // Check if there's a thread creation endpoint that works
  const threadEndpoints = ['/thread', '/threads/create', '/create-thread'];
  
  for (const endpoint of threadEndpoints) {
    console.log(`\n🔄 Testing thread creation: POST ${endpoint}`);
    const threadData = {
      title: "Test Thread for Posts",
      body: "This thread is for testing post creation",
      extendedData: {}
    };
    
    const threadResult = await makeRequest('POST', endpoint, threadData);
    
    if (threadResult.success && threadResult.data.id) {
      console.log(`✅ Thread created! ID: ${threadResult.data.id}`);
      
      // Now try creating a post in this thread
      console.log('\n📋 Step 7: Create post in newly created thread');
      const postInNewThread = {
        body: "This is a post in the newly created thread!",
        threadId: threadResult.data.id,
        userId: "test-user-id",
        parentId: null,
        extendedData: {
          type: "test-post"
        }
      };
      
      await makeRequest('POST', '/post', postInNewThread);
      break;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Check if anything was created
  console.log('\n📋 Step 8: Check if content was created');
  console.log('\n🔄 GET /threads');
  await makeRequest('GET', '/threads');
  
  console.log('\n🔄 GET /posts');
  await makeRequest('GET', '/posts');

  console.log('\n🎯 Schema Test Complete!');
}

testCorrectSchema().catch(console.error);