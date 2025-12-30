/**
 * Detailed Foru.ms API Test
 * Testing more endpoint variations to understand the API structure
 */

const API_KEY = '88e3494b-c191-429f-924a-b6440a9619cb';
const BASE_URL = 'https://foru.ms/api/v1';

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
      return { success: true, data, status: response.status };
    } else {
      const errorText = await response.text();
      console.log('❌ Error:', errorText.substring(0, 200) + '...');
      return { success: false, error: errorText, status: response.status };
    }
  } catch (error) {
    console.log('💥 Network Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testDetailedAPI() {
  console.log('🔬 Detailed Foru.ms API Analysis');
  
  // Test different HTTP methods on threads
  console.log('\n📋 Testing HTTP Methods on /threads');
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  
  for (const method of methods) {
    const body = method !== 'GET' && method !== 'DELETE' ? {
      title: 'Test Thread',
      body: 'Test content'
    } : null;
    
    await makeRequest(method, '/threads', body);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Test different endpoint variations
  console.log('\n📋 Testing Endpoint Variations');
  const endpoints = [
    '/thread', // singular
    '/discussions',
    '/topics',
    '/forums',
    '/channels',
    '/conversations',
    '/messages',
    '/content',
    '/api-info',
    '/info',
    '/status',
    '/health'
  ];

  for (const endpoint of endpoints) {
    await makeRequest('GET', endpoint);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Test with different authentication methods
  console.log('\n📋 Testing Authentication Variations');
  
  // Test with Authorization header instead
  const authTests = [
    { headers: { 'Authorization': `Bearer ${API_KEY}` }, desc: 'Bearer token' },
    { headers: { 'Authorization': `API-Key ${API_KEY}` }, desc: 'API-Key prefix' },
    { headers: { 'Api-Key': API_KEY }, desc: 'Api-Key header' },
    { headers: { 'x-api-key': API_KEY }, desc: 'lowercase x-api-key' }
  ];

  for (const test of authTests) {
    console.log(`\n🔑 Testing: ${test.desc}`);
    try {
      const response = await fetch(`${BASE_URL}/threads`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...test.headers
        }
      });
      console.log(`📊 Status: ${response.status}`);
      if (response.ok) {
        console.log('✅ Authentication method works');
      }
    } catch (error) {
      console.log('❌ Failed:', error.message);
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Test query parameters
  console.log('\n📋 Testing Query Parameters');
  const queryTests = [
    '/threads?limit=10',
    '/threads?page=1',
    '/threads?sort=created',
    '/threads?filter=active',
    '/posts?thread_id=1',
    '/users?active=true'
  ];

  for (const endpoint of queryTests) {
    await makeRequest('GET', endpoint);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n🎯 Analysis Complete!');
}

testDetailedAPI().catch(console.error);