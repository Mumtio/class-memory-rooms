/**
 * Test Post Validation - Focus on /post endpoint
 * Since /post returned 400 (validation failed) instead of 405 (method not allowed)
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

async function testPostValidation() {
  console.log('🔍 Testing Post Validation on /post endpoint');
  console.log('Since /post returned 400 (validation failed), the endpoint exists!');
  
  // Test different field combinations
  const testCases = [
    {
      name: 'Empty object',
      data: {}
    },
    {
      name: 'Just body',
      data: { body: 'Test content' }
    },
    {
      name: 'Just content',
      data: { content: 'Test content' }
    },
    {
      name: 'Just title',
      data: { title: 'Test title' }
    },
    {
      name: 'Title and body',
      data: { title: 'Test title', body: 'Test content' }
    },
    {
      name: 'Title and content',
      data: { title: 'Test title', content: 'Test content' }
    },
    {
      name: 'All text fields',
      data: { 
        title: 'Test title', 
        body: 'Test content',
        content: 'Test content alt'
      }
    },
    {
      name: 'With thread reference',
      data: { 
        title: 'Test title', 
        body: 'Test content',
        threadId: 'test-thread-id'
      }
    },
    {
      name: 'With thread_id',
      data: { 
        title: 'Test title', 
        body: 'Test content',
        thread_id: 'test-thread-id'
      }
    },
    {
      name: 'With tags array',
      data: { 
        title: 'Test title', 
        body: 'Test content',
        tags: ['test']
      }
    },
    {
      name: 'With user info',
      data: { 
        title: 'Test title', 
        body: 'Test content',
        userId: 'test-user',
        user_id: 'test-user'
      }
    },
    {
      name: 'Kitchen sink',
      data: { 
        title: 'Test Post Title',
        body: 'Test post content body',
        content: 'Test post content',
        threadId: 'thread-123',
        thread_id: 'thread-123',
        userId: 'user-123',
        user_id: 'user-123',
        tags: ['test', 'api'],
        type: 'post',
        category: 'general'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.name}`);
    await makeRequest('POST', '/post', testCase.data);
    
    // Small delay to be respectful
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Also test if we need to create a thread first through the console
  console.log('\n📋 Testing if we can get more info about required fields');
  
  // Test OPTIONS request to see if it gives us schema info
  console.log('\n🔄 OPTIONS /post (check for schema info)');
  try {
    const response = await fetch(`${BASE_URL}/post`, {
      method: 'OPTIONS',
      headers: {
        'x-api-key': API_KEY,
      }
    });
    console.log(`📊 Status: ${response.status}`);
    const text = await response.text();
    console.log('Response:', text);
  } catch (error) {
    console.log('❌ OPTIONS failed:', error.message);
  }

  console.log('\n🎯 Post Validation Test Complete!');
  console.log('\n💡 Next steps:');
  console.log('1. Check the Foru.ms console for required fields');
  console.log('2. Try creating content through the web interface first');
  console.log('3. Look for API documentation or examples');
}

testPostValidation().catch(console.error);