/**
 * Test with Valid User ID
 * We're getting "Invalid userId" so we need to find or create a valid user
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

async function testWithValidUser() {
  console.log('👤 Testing with Valid User ID');
  
  // Step 1: Check existing users
  console.log('\n📋 Step 1: Check existing users');
  const usersResult = await makeRequest('GET', '/users');
  
  let validUserId = null;
  if (usersResult.success && usersResult.data.users && usersResult.data.users.length > 0) {
    validUserId = usersResult.data.users[0].id;
    console.log(`✅ Found existing user ID: ${validUserId}`);
  }

  // Step 2: Try to create a user if none exist
  if (!validUserId) {
    console.log('\n📋 Step 2: Try to create a user');
    
    const userCreationTests = [
      {
        endpoint: '/user',
        data: {
          name: 'Test User',
          email: 'test@example.com',
          extendedData: {}
        }
      },
      {
        endpoint: '/users',
        data: {
          name: 'Test User',
          email: 'test@example.com'
        }
      },
      {
        endpoint: '/users/create',
        data: {
          name: 'Test User',
          email: 'test@example.com'
        }
      }
    ];

    for (const test of userCreationTests) {
      console.log(`\n🔄 Testing user creation: POST ${test.endpoint}`);
      const result = await makeRequest('POST', test.endpoint, test.data);
      
      if (result.success && result.data.id) {
        validUserId = result.data.id;
        console.log(`✅ Created user with ID: ${validUserId}`);
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Step 3: Try with different user ID formats if we still don't have one
  if (!validUserId) {
    console.log('\n📋 Step 3: Try with different user ID formats');
    
    const userIdFormats = [
      'user_1',
      'user-1', 
      '1',
      'admin',
      'test-user',
      'api-user',
      // Try UUID format
      '550e8400-e29b-41d4-a716-446655440000'
    ];

    for (const userId of userIdFormats) {
      console.log(`\n🔄 Testing with userId: ${userId}`);
      
      const postData = {
        body: `Test post with userId: ${userId}`,
        threadId: "test-thread-id",
        userId: userId,
        parentId: null,
        extendedData: {}
      };

      const result = await makeRequest('POST', '/post', postData);
      
      if (result.success) {
        console.log(`✅ Success with userId: ${userId}`);
        validUserId = userId;
        break;
      } else if (!result.error.includes('Invalid userId')) {
        console.log(`🔍 Different error with ${userId}: ${result.error}`);
        // If we get a different error, this userId might be valid but we have other issues
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Step 4: If we have a valid user ID, try creating thread and post
  if (validUserId) {
    console.log(`\n📋 Step 4: Try creating content with valid userId: ${validUserId}`);
    
    // Try creating a thread first
    console.log('\n🔄 Creating thread with valid user');
    const threadData = {
      title: "Test Thread with Valid User",
      body: "This thread is created with a valid user ID",
      userId: validUserId,
      extendedData: {}
    };

    const threadResult = await makeRequest('POST', '/thread', threadData);
    
    if (threadResult.success && threadResult.data.id) {
      const threadId = threadResult.data.id;
      console.log(`✅ Thread created with ID: ${threadId}`);
      
      // Now create a post in this thread
      console.log('\n🔄 Creating post in the new thread');
      const postData = {
        body: "This is a post in the newly created thread with valid user!",
        threadId: threadId,
        userId: validUserId,
        parentId: null,
        extendedData: {
          type: "test-post",
          title: "Test Post Title"
        }
      };

      await makeRequest('POST', '/post', postData);
    }
  }

  // Step 5: Check final state
  console.log('\n📋 Step 5: Check final state');
  console.log('\n🔄 GET /users');
  await makeRequest('GET', '/users');
  
  console.log('\n🔄 GET /threads');
  await makeRequest('GET', '/threads');
  
  console.log('\n🔄 GET /posts');
  await makeRequest('GET', '/posts');

  console.log('\n🎯 Valid User Test Complete!');
  
  if (validUserId) {
    console.log(`✅ Valid User ID found: ${validUserId}`);
  } else {
    console.log('❌ No valid user ID found - may need to create users through web interface first');
  }
}

testWithValidUser().catch(console.error);