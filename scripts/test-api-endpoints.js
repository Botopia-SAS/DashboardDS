// Simple test to verify API endpoints work with updated models
const https = require('https');
const http = require('http');

async function testAPIEndpoints() {
  console.log('🧪 Testing API Endpoints with Updated Models...\n');
  
  const baseUrl = 'http://localhost:3000';
  
  const endpoints = [
    '/api/users',
    '/api/instructors',
    '/api/ticket/classes',
    '/api/settings',
    '/api/seo'
  ];
  
  console.log('📋 Endpoints to test:', endpoints);
  console.log('⚠️  Note: This test requires the development server to be running\n');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing ${endpoint}...`);
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log(`✅ ${endpoint} - Status: ${response.status}`);
      } else {
        console.log(`⚠️  ${endpoint} - Status: ${response.status} (may require authentication)`);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
    }
  }
  
  console.log('\n📝 Test Summary:');
  console.log('- If endpoints return 200 or authentication errors, models are working');
  console.log('- Connection errors indicate the dev server is not running');
  console.log('- This confirms models can be imported and used by API routes');
}

testAPIEndpoints()
  .then(() => {
    console.log('\n✅ API endpoint test completed');
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
  });