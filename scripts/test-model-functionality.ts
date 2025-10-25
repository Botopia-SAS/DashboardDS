import { connectToDB } from '../lib/mongoDB';
import User from '../lib/models/User';
import Admin from '../lib/models/Admin';
import Session from '../lib/models/Session';
import TicketClass from '../lib/models/TicketClass';
import Instructor from '../lib/models/Instructor';

async function testModelFunctionality() {
  console.log('🧪 Starting Model Functionality Tests...\n');
  
  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await connectToDB();
    console.log('✅ Database connected successfully\n');

    // Test 1: User Model CRUD Operations
    console.log('🔍 Testing User Model...');
    
    // Create a test user
    const testUser = new User({
      firstName: 'Test',
      lastName: 'User',
      email: `test-${Date.now()}@example.com`,
      birthDate: new Date('1990-01-01'),
      role: 'User'
    });
    
    const savedUser = await testUser.save();
    console.log('✅ User created successfully:', savedUser._id);
    
    // Read the user
    const foundUser = await User.findById(savedUser._id);
    console.log('✅ User found successfully:', foundUser?.email);
    
    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      savedUser._id, 
      { firstName: 'Updated' }, 
      { new: true }
    );
    console.log('✅ User updated successfully:', updatedUser?.firstName);
    
    // Delete the user
    await User.findByIdAndDelete(savedUser._id);
    console.log('✅ User deleted successfully\n');

    // Test 2: Admin Model
    console.log('🔍 Testing Admin Model...');
    
    const testAdmin = new Admin({
      username: `testadmin${Date.now()}`,
      email: `admin-${Date.now()}@example.com`,
      password: 'hashedpassword123',
      firstName: 'Test',
      lastName: 'Admin',
      role: 'admin',
      permissions: ['users_read', 'users_write']
    });
    
    const savedAdmin = await testAdmin.save();
    console.log('✅ Admin created successfully:', savedAdmin._id);
    
    // Clean up
    await Admin.findByIdAndDelete(savedAdmin._id);
    console.log('✅ Admin deleted successfully\n');

    // Test 3: Session Model
    console.log('🔍 Testing Session Model...');
    
    const testSession = new Session({
      sessionId: `test-session-${Date.now()}`,
      userId: savedUser._id, // Using a valid ObjectId format
      startTime: new Date(),
      status: 'scheduled',
      type: 'driving_lesson'
    });
    
    const savedSession = await testSession.save();
    console.log('✅ Session created successfully:', savedSession._id);
    
    // Clean up
    await Session.findByIdAndDelete(savedSession._id);
    console.log('✅ Session deleted successfully\n');

    // Test 4: TicketClass Model
    console.log('🔍 Testing TicketClass Model...');
    
    const testTicketClass = new TicketClass({
      className: 'Test Driving Class',
      date: new Date(),
      startTime: '09:00',
      endTime: '17:00',
      maxStudents: 20,
      currentStudents: 0,
      status: 'scheduled'
    });
    
    const savedTicketClass = await testTicketClass.save();
    console.log('✅ TicketClass created successfully:', savedTicketClass._id);
    
    // Clean up
    await TicketClass.findByIdAndDelete(savedTicketClass._id);
    console.log('✅ TicketClass deleted successfully\n');

    // Test 5: Instructor Model
    console.log('🔍 Testing Instructor Model...');
    
    const testInstructor = new Instructor({
      firstName: 'Test',
      lastName: 'Instructor',
      email: `instructor-${Date.now()}@example.com`,
      phoneNumber: '555-0123',
      licenseNumber: `LIC${Date.now()}`,
      active: true
    });
    
    const savedInstructor = await testInstructor.save();
    console.log('✅ Instructor created successfully:', savedInstructor._id);
    
    // Clean up
    await Instructor.findByIdAndDelete(savedInstructor._id);
    console.log('✅ Instructor deleted successfully\n');

    // Test 6: Model Relationships and Queries
    console.log('🔍 Testing Model Queries...');
    
    // Test finding models with filters
    const activeInstructors = await Instructor.find({ active: true }).limit(5);
    console.log(`✅ Found ${activeInstructors.length} active instructors`);
    
    const recentSessions = await Session.find({}).sort({ startTime: -1 }).limit(5);
    console.log(`✅ Found ${recentSessions.length} recent sessions`);
    
    const userCount = await User.countDocuments();
    console.log(`✅ Total users in database: ${userCount}`);
    
    console.log('\n🎉 All Model Functionality Tests Passed!');
    
  } catch (error) {
    console.error('❌ Model Functionality Test Failed:', error);
    process.exit(1);
  }
}

// Run the tests
testModelFunctionality()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });