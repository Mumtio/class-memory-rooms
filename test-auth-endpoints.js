/**
 * Test Foru.ms Authentication Endpoints
 * Testing /auth/register and /auth/login to see if we can create users and authenticate
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

async function testAuthEndpoints() {
  console.log('🔐 Testing Foru.ms Authentication Endpoints');
  
  // Test 1: Try to register a new user
  console.log('\n📋 Step 1: Test user registration');
  
  const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    displayName: 'Test User',
    password: 'testpassword123',
    emailVerified: true,
    roles: ['user'],
    extendedData: {}
  };

  const registerResult = await makeRequest('POST', '/auth/register', testUser);
  
  let authToken = null;
  let userId = null;
  
  if (registerResult.success) {
    console.log('✅ User registration successful!');
    authToken = registerResult.data.token;
    userId = registerResult.data.user?.id || registerResult.data.id;
    console.log(`🎫 Auth Token: ${authToken}`);
    console.log(`👤 User ID: ${userId}`);
  } else {
    console.log('❌ User registration failed, trying with minimal data...');
    
    // Try with minimal required fields
    const minimalUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'testpassword123'
    };
    
    const minimalRegisterResult = await makeRequest('POST', '/auth/register', minimalUser);
    
    if (minimalRegisterResult.success) {
      console.log('✅ Minimal user registration successful!');
      authToken = minimalRegisterResult.data.token;
      userId = minimalRegisterResult.data.user?.id || minimalRegisterResult.data.id;
    }
  }

  // Test 2: Try to login with the created user
  if (authToken && testUser.username) {
    console.log('\n📋 Step 2: Test user login');
    
    const loginData = {
      login: testUser.username,
      password: testUser.password
    };
    
    const loginResult = await makeRequest('POST', '/auth/login', loginData);
    
    if (loginResult.success) {
      console.log('✅ User login successful!');
      const loginToken = loginResult.data.token;
      console.log(`🎫 Login Token: ${loginToken}`);
    }
  }

  // Test 3: Try to create content with authenticated user
  if (authToken && userId) {
    console.log('\n📋 Step 3: Test content creation with authenticated user');
    
    // Try creating a thread
    console.log('\n🔄 Creating thread with authenticated user');
    const threadData = {
      title: "Test Thread with Auth",
      body: "This thread is created with an authenticated user",
      userId: userId,
      extendedData: {
        type: "test-thread"
      }
    };

    const threadResult = await makeRequest('POST', '/thread', threadData);
    
    if (threadResult.success && threadResult.data.id) {
      const threadId = threadResult.data.id;
      console.log(`✅ Thread created with ID: ${threadId}`);
      
      // Try creating a post in the thread
      console.log('\n🔄 Creating post in the thread');
      const postData = {
        body: "This is a post in the thread created by authenticated user!",
        threadId: threadId,
        userId: userId,
        parentId: null,
        extendedData: {
          type: "test-post"
        }
      };

      const postResult = await makeRequest('POST', '/post', postData);
      
      if (postResult.success) {
        console.log('✅ Post creation successful!');
      }
    }
  }

  // Test 4: Check if we can now see users, threads, and posts
  console.log('\n📋 Step 4: Check final state');
  
  console.log('\n🔄 GET /users');
  await makeRequest('GET', '/users');
  
  console.log('\n🔄 GET /threads');
  await makeRequest('GET', '/threads');
  
  console.log('\n🔄 GET /posts');
  await makeRequest('GET', '/posts');

  console.log('\n🎯 Authentication Test Complete!');
  
  if (authToken) {
    console.log(`✅ Authentication working! Token: ${authToken}`);
    console.log(`✅ User ID: ${userId}`);
    console.log('🚀 Ready to implement full Foru.ms integration!');
  } else {
    console.log('❌ Authentication not working - may need different approach');
  }
}

testAuthEndpoints().catch(console.error);