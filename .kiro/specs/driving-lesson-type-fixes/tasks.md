# Implementation Plan

- [x] 1. Update Mongoose schema definition for paymentMethod field





  - Modify the InstructorSchema in lib/models/Instructor.ts to make paymentMethod optional
  - Change from `paymentMethod: String` to `paymentMethod: { type: String, required: false }`
  - Ensure the change aligns with the existing TypeScript interface definition
  - _Requirements: 1.1, 1.2, 1.3_
-

- [-] 2. Verify TypeScript compilation and API functionality


  - Run TypeScript compilation to confirm the build error is resolved
  - Test the driving lesson rejection API endpoint to ensure it works correctly
  - Verify that paymentMethod can be set, updated, and deleted without errors
  - _Requirements: 1.1, 1.4, 3.1, 3.2, 3.3_

- [ ]* 2.1 Write unit tests for paymentMethod field handling
  - Create tests for Mongoose schema validation with optional paymentMethod
  - Test document creation with and without paymentMethod values
  - Verify that paymentMethod can be dynamically added and removed
  - _Requirements: 2.1, 2.3, 2.4_

- [ ]* 2.2 Add integration tests for driving lesson API endpoints
  - Test lesson rejection with null paymentMethod
  - Test lesson rejection with valid paymentMethod value
  - Verify notification broadcasting works correctly after schema update
  - _Requirements: 3.1, 3.2, 3.3, 3.5_