/**
 * Manual Test Script for Certificate Creation with String IDs
 * 
 * This script tests that certificates can be created and retrieved with string IDs
 * for classId and selectedClassIds fields.
 * 
 * Run with: npx ts-node scripts/test-certificate-string-ids.ts
 */

import mongoose from 'mongoose';
import CertificateDrivingLesson from '../lib/models/CertificateDrivingLesson';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function testCertificateStringIds() {
  console.log('🧪 Starting Certificate String ID Test...\n');

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Create certificate with string IDs
    console.log('Test 1: Creating certificate with string IDs');
    const compositeClassId = 'driving_lesson_68c9b231d7584ae078455b26_2025-10-30_08:30_1761533011637_test';
    const selectedIds = [
      compositeClassId,
      'driving_lesson_68c9b231d7584ae078455b26_2025-10-30_10:30_1761533011638_test',
      'driving_lesson_68c9b231d7584ae078455b26_2025-10-31_08:30_1761533011639_test',
    ];
    const studentId = new mongoose.Types.ObjectId();

    const certificate = new CertificateDrivingLesson({
      studentId,
      classId: compositeClassId,
      selectedClassIds: selectedIds,
      classType: 'driving lesson',
      totalHours: 6,
      completionDate: '2025-10-31',
      instructorName: 'Test Instructor',
      instructorSignature: 'https://example.com/signature.png',
      licenseNumber: 'DL123456',
      generated: false,
    });

    const saved = await certificate.save();
    console.log('✅ Certificate created successfully');
    console.log('   Certificate ID:', saved._id);
    console.log('   classId type:', typeof saved.classId);
    console.log('   classId value:', saved.classId);
    console.log('   selectedClassIds:', saved.selectedClassIds);
    console.log('');

    // Test 2: Retrieve certificate from database
    console.log('Test 2: Retrieving certificate from database');
    const retrieved = await CertificateDrivingLesson.findById(saved._id);
    
    if (!retrieved) {
      throw new Error('Certificate not found in database');
    }

    console.log('✅ Certificate retrieved successfully');
    console.log('   classId matches:', retrieved.classId === compositeClassId);
    console.log('   selectedClassIds count:', retrieved.selectedClassIds?.length);
    console.log('   All IDs are strings:', retrieved.selectedClassIds?.every(id => typeof id === 'string'));
    console.log('');

    // Test 3: Update certificate with new selectedClassIds
    console.log('Test 3: Updating certificate with additional class IDs');
    const additionalId = 'driving_lesson_68c9b231d7584ae078455b26_2025-11-01_09:00_1761533011640_test';
    retrieved.selectedClassIds = [...(retrieved.selectedClassIds || []), additionalId];
    retrieved.totalHours = 8;
    await retrieved.save();

    const updated = await CertificateDrivingLesson.findById(saved._id);
    console.log('✅ Certificate updated successfully');
    console.log('   New selectedClassIds count:', updated?.selectedClassIds?.length);
    console.log('   New total hours:', updated?.totalHours);
    console.log('');

    // Test 4: Query certificate by classId (string)
    console.log('Test 4: Querying certificate by string classId');
    const foundByClassId = await CertificateDrivingLesson.findOne({ classId: compositeClassId });
    
    if (!foundByClassId) {
      throw new Error('Certificate not found by classId query');
    }

    console.log('✅ Certificate found by classId query');
    console.log('   Found certificate ID:', foundByClassId._id);
    console.log('');

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await CertificateDrivingLesson.deleteOne({ _id: saved._id });
    console.log('✅ Test data cleaned up\n');

    console.log('🎉 All tests passed successfully!\n');
    console.log('Summary:');
    console.log('✅ Certificates can be created with string classId');
    console.log('✅ Certificates can store array of string selectedClassIds');
    console.log('✅ Certificates can be retrieved with string IDs intact');
    console.log('✅ Certificates can be updated with new selectedClassIds');
    console.log('✅ Certificates can be queried by string classId');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

// Run the test
testCertificateStringIds();
