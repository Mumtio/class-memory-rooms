/**
 * Test Foru.ms Permissions and Roles
 */

const API_KEY = '88e3494b-c191-429f-924a-b6440a9619cb';
const BASE_URL = 'https://foru.ms/api/v1';

async function makeRequest(method, path, body = null) {
  const url = `${BASE_URL}${path}`;
  
  const options = {
    method,
    headers: {
      'x-api-key': API_KEY, // Using lowercase as it worked
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
      return { success: true, data, status: response.status };
    } else {
      const errorText = await response.text();
      console.log('❌ Error:', errorText.substring(0, 300) + '...');
      return { success: false, error: errorText, status: response.status };
    }
  } catch (error) {
    console.log('💥 Network Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testPermissions() {
  console.log('🔐 Testing Foru.ms Permissions & Roles');
  
  // Test role-related endpoints
  const roleEndpoints = [
    '/roles',
    '/role', 
    '/permissions',
    '/permission',
    '/user-roles',
    '/api-keys',
    '/api-key',
    '/instance',
    '/instance/settings',
    '/instance/permissions',
    '/settings',
    '/config',
    '/account',
    '/profile'
  ];

  console.log('\n📋 Testing Role & Permission Endpoints');
  for (const endpoint of roleEndpoints) {
    await makeRequest('GET', endpoint);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Test if we can create with different content types
  console.log('\n📋 Testing Different Content Types for Thread Creation');
  
  const contentTypes = [
    'application/json',
    'application/x-www-form-urlencoded',
    'multipart/form-data'
  ];

  for (const contentType of contentTypes) {
    console.log(`\n🔄 POST /threads with ${contentType}`);
    try {
      let body;
      let headers = {
        'x-api-key': API_KEY,
      };

      if (contentType === 'application/json') {
        headers['Content-Type'] = contentType;
        body = JSON.stringify({
          title: 'Test Thread',
          body: 'Test content'
        });
      } else if (contentType === 'application/x-www-form-urlencoded') {
        headers['Content-Type'] = contentType;
        body = 'title=Test%20Thread&body=Test%20content';
      } else {
        // Skip multipart for now as it's complex
        continue;
      }

      const response = await fetch(`${BASE_URL}/threads`, {
        method: 'POST',
        headers,
        body
      });

      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success!', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log('❌ Error:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.log('💥 Error:', error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Test specific thread creation endpoints
  console.log('\n📋 Testing Alternative Thread Creation Endpoints');
  const createEndpoints = [
    '/threads/create',
    '/thread/create', 
    '/create-thread',
    '/new-thread',
    '/add-thread'
  ];

  for (const endpoint of createEndpoints) {
    await makeRequest('POST', endpoint, {
      title: 'Test Thread',
      body: 'Test content'
    });
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n🎯 Permission Analysis Complete!');
}

testPermissions().catch(console.error);