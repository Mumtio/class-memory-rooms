/**
 * Test Login with newly created user
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

async function testLogin() {
  console.log('🎯 Testing Login with newly created user');
  
  // Use the user we just created
  const username = 'testuser_1767127795179_2';
  const password = 'testpassword123';
  
  console.log(`\n📋 Logging in as: ${username}`);
  
  const result = await makeRequest('POST', '/auth/login', {
    login: username,
    password: password,
  });
  
  if (result.success) {
    console.log('\n✅ Login successful!');
    console.log(`Token: ${result.data.token}`);
    
    // Now test /auth/me endpoint
    console.log('\n📋 Testing /auth/me endpoint');
    const meResult = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${result.data.token}`,
      },
    });
    
    console.log(`📊 Status: ${meResult.status} ${meResult.statusText}`);
    
    if (meResult.ok) {
      const userData = await meResult.json();
      console.log('✅ User data:', JSON.stringify(userData, null, 2));
    } else {
      const errorText = await meResult.text();
      console.log('❌ Error:', errorText);
    }
  } else {
    console.log('\n❌ Login failed');
  }
}

testLogin().catch(console.error);
