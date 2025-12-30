/**
 * Foru.ms API Test Script
 * 
 * This script tests your actual Foru.ms API to understand:
 * - Available endpoints
 * - Request/response formats  
 * - Supported features
 * 
 * Usage:
 * 1. Get your API key from https://foru.ms/instances/memory-room/console
 * 2. Replace 'YOUR_API_KEY_HERE' below
 * 3. Run: node test-foru-ms-api.js
 */

const API_KEY = '88e3494b-c191-429f-924a-b6440a9619cb'; // Your memory-room instance API key
const BASE_URL = 'https://foru.ms/api/v1';
const INSTANCE = 'memory-room';

async function makeRequest(method, path, body = null) {
  const url = `${BASE_URL}${path}`;
  
  const options = {
    method,
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`\n🔄 ${method} ${path}`);
    const response = await fetch(url, options);
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Response:', JSON.stringify(data, null, 2));
      return { success: true, data };
    } else {
      const errorText = await response.text();
      console.log('❌ Error:', errorText);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.log('💥 Network Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testForumsAPI() {
  console.log('🚀 Testing Foru.ms API');
  console.log(`📍 Instance: ${INSTANCE}`);
  console.log(`🔗 Base URL: ${BASE_URL}`);
  
  if (API_KEY === 'YOUR_API_KEY_HERE') {
    console.log('❌ Please set your API key in the script first!');
    return;
  }

  // Test 1: Basic endpoint discovery
  console.log('\n📋 PHASE 1: Endpoint Discovery');
  const endpoints = [
    { method: 'GET', path: '/threads', description: 'List threads' },
    { method: 'GET', path: '/posts', description: 'List posts' },
    { method: 'GET', path: '/users', description: 'List users' },
    { method: 'GET', path: '/tags', description: 'List tags' },
    { method: 'GET', path: '/categories', description: 'List categories' },
    { method: 'GET', path: '/me', description: 'Current user info' },
  ];

  const results = {};
  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testing: ${endpoint.description}`);
    const result = await makeRequest(endpoint.method, endpoint.path);
    results[endpoint.path] = result;
    
    // Small delay to be respectful
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Test 2: Create a test thread (if threads endpoint works)
  if (results['/threads']?.success) {
    console.log('\n📋 PHASE 2: Create Test Thread');
    
    const testThread = {
      title: 'Class Memory Rooms Test Thread',
      body: 'This is a test thread created by the integration test script.',
      tags: ['test', 'integration']
    };

    const createResult = await makeRequest('POST', '/threads', testThread);
    
    if (createResult.success) {
      const threadId = createResult.data.id;
      console.log(`✅ Created thread with ID: ${threadId}`);
      
      // Test 3: Get the created thread
      console.log('\n📋 PHASE 3: Retrieve Created Thread');
      await makeRequest('GET', `/threads/${threadId}`);
      
      // Test 4: Create a post in the thread
      console.log('\n📋 PHASE 4: Create Test Post');
      const testPost = {
        threadId: threadId,
        body: 'This is a test post in the test thread.',
        tags: ['test-post']
      };
      
      const postResult = await makeRequest('POST', '/posts', testPost);
      
      if (postResult.success) {
        const postId = postResult.data.id;
        console.log(`✅ Created post with ID: ${postId}`);
        
        // Test 5: Get posts in thread
        console.log('\n📋 PHASE 5: Get Thread Posts');
        await makeRequest('GET', `/threads/${threadId}/posts`);
      }
    }
  }

  // Test 6: Test metadata support (if possible)
  console.log('\n📋 PHASE 6: Metadata Support Test');
  const metadataThread = {
    title: 'Metadata Test Thread',
    body: 'Testing if metadata is supported',
    tags: ['metadata-test'],
    metadata: {
      testKey: 'testValue',
      joinKey: 'ABC123',
      type: 'school'
    }
  };

  await makeRequest('POST', '/threads', metadataThread);

  // Summary
  console.log('\n📊 SUMMARY');
  console.log('='.repeat(50));
  
  const workingEndpoints = Object.entries(results)
    .filter(([_, result]) => result.success)
    .map(([path, _]) => path);
    
  const failedEndpoints = Object.entries(results)
    .filter(([_, result]) => !result.success)
    .map(([path, _]) => path);

  console.log(`✅ Working endpoints (${workingEndpoints.length}):`);
  workingEndpoints.forEach(path => console.log(`   - ${path}`));
  
  console.log(`❌ Failed endpoints (${failedEndpoints.length}):`);
  failedEndpoints.forEach(path => console.log(`   - ${path}`));

  console.log('\n💡 Next Steps:');
  console.log('1. Update the integration based on working endpoints');
  console.log('2. Adjust data structures to match API responses');
  console.log('3. Implement fallbacks for unsupported features');
  console.log('4. Test with real Class Memory Rooms data');
}

// Run the test
testForumsAPI().catch(console.error);

// Export for use in other scripts
module.exports = { makeRequest, testForumsAPI };