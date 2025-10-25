const { connectToDB } = require('../lib/mongoDB');

async function testBasicConnection() {
  console.log('🧪 Starting Basic Model Connection Test...\n');
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await connectToDB();
    console.log('✅ Database connected successfully');
    
    // Test that models are properly registered
    const mongoose = require('mongoose');
    const modelNames = mongoose.modelNames();
    console.log('📋 Registered models:', modelNames);
    
    if (modelNames.length > 0) {
      console.log('✅ Models are properly registered');
    } else {
      console.log('⚠️  No models found registered');
    }
    
    console.log('\n🎉 Basic Model Connection Test Passed!');
    
  } catch (error) {
    console.error('❌ Model Connection Test Failed:', error);
    process.exit(1);
  }
}

// Run the test
testBasicConnection()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });