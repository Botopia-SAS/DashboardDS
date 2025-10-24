# Implementation Plan

- [x] 1. Analyze PDF template and measure field positions





  - Open `/public/templates_certificates/youthful-offender-class.pdf` to understand the actual layout
  - Identify the exact positions of form fields within each 264pt certificate slot
  - Document the vertical spacing between fields
  - _Requirements: 1.1, 1.2, 1.3_

- [-] 2. Recalculate Y-coordinates for all text elements



- [x] 2.1 Update Certificate 1 (TOP) text element coordinates


  - Recalculate Y-coordinates for citation, court, county, certn fields
  - Recalculate Y-coordinates for firstName, middleInitial, lastName fields
  - Recalculate Y-coordinates for licenseNumber and courseDate fields
  - Update comments to explain coordinate system
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_

- [x] 2.2 Update Certificate 2 (MIDDLE) text element coordinates





  - Apply same Y-coordinates as Certificate 1 (generator handles offsetY)
  - Verify X-coordinates are correct for center alignment
  - Update comments for clarity
  - _Requirements: 1.1, 1.3, 2.1, 2.2, 2.3_

- [x] 2.3 Update Certificate 3 (BOTTOM) text element coordinates





  - Apply same Y-coordinates as Certificate 1 (generator handles offsetY)
  - Verify X-coordinates are correct for center alignment
  - Update comments for clarity
  - _Requirements: 1.1, 1.3, 2.1, 2.2, 2.3_
-

- [x] 3. Update shape elements (checkbox marks) coordinates




- [x] 3.1 Recalculate checkbox X marks for course time options







  - Update Y-coordinates for 4hr, 6hr, 8hr checkboxes on all 3 certificates
  - Ensure X marks align with PDF template checkbox squares
  - _Requirements: 1.1, 2.2, 2.3_
-

- [x] 3.2 Recalculate checkbox X marks for attendance reason options





  - Update Y-coordinates for Court Order, Volunteer, Ticket checkboxes on all 3 certificates
  - Ensure X marks align with PDF template checkbox squares
  - _Requirements: 1.1, 2.2, 2.3_


- [x] 4. Update image elements (signature) coordinates




  - Recalculate Y-coordinates for instructor signature on all 3 certificates
  - Verify signature appears in correct position on PDF template
  - _Requirements: 1.1, 2.2, 2.3_

- [x] 5. Test certificate generation with sample data






  - Generate a test PDF with sample student data
  - Verify all text fields are visible and correctly positioned
  - Verify checkboxes are marked in correct positions
  - Verify signature appears correctly
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3_

- [ ] 6. Fine-tune coordinates based on test results
  - Adjust X and Y coordinates as needed for perfect alignment
  - Test with different data lengths (long names, etc.)
  - Verify consistency across all 3 certificates on the page
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3_
