/**
 * Test Registration with Foru.ms API
 * Testing different registration formats to find the correct one
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

async function testRegistration() {
  console.log('🎯 Testing Registration Formats');
  
  const timestamp = Date.now();
  const testUsername = `testuser_${timestamp}`;
  
  // Test 1: Try with 'login' field (as shown in login)
  console.log('\n📋 Test 1: Using "login" field');
  const result1 = await makeRequest('POST', '/auth/register', {
    login: testUsername,
    password: 'testpassword123',
    email: `${testUsername}@example.com`,
  });
  
  if (result1.success) {
    console.log('✅ Format 1 works!');
    return;
  }
  
  // Test 2: Try with 'username' field
  console.log('\n📋 Test 2: Using "username" field');
  const result2 = await makeRequest('POST', '/auth/register', {
    username: `${testUsername}_2`,
    password: 'testpassword123',
    email: `${testUsername}_2@example.com`,
  });
  
  if (result2.success) {
    console.log('✅ Format 2 works!');
    return;
  }
  
  // Test 3: Try with 'username' and 'displayName'
  console.log('\n📋 Test 3: Using "username" and "displayName"');
  const result3 = await makeRequest('POST', '/auth/register', {
    username: `${testUsername}_3`,
    displayName: 'Test User 3',
    password: 'testpassword123',
    email: `${testUsername}_3@example.com`,
  });
  
  if (result3.success) {
    console.log('✅ Format 3 works!');
    return;
  }
  
  // Test 4: Minimal fields only
  console.log('\n📋 Test 4: Minimal fields (username + password)');
  const result4 = await makeRequest('POST', '/auth/register', {
    username: `${testUsername}_4`,
    password: 'testpassword123',
  });
  
  if (result4.success) {
    console.log('✅ Format 4 works!');
    return;
  }
  
  // Test 5: Check if there's a different endpoint
  console.log('\n📋 Test 5: Try /auth/signup instead');
  const result5 = await makeRequest('POST', '/auth/signup', {
    username: `${testUsername}_5`,
    password: 'testpassword123',
    email: `${testUsername}_5@example.com`,
  });
  
  if (result5.success) {
    console.log('✅ Format 5 works!');
    return;
  }
  
  console.log('\n❌ All registration formats failed');
  console.log('Please check the Foru.ms API documentation for the correct format');
}

testRegistration().catch(console.error);
