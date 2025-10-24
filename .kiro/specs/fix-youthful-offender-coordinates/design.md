# Design Document

## Overview

This design addresses the coordinate positioning issue in the Youthful Offender Class certificate template. The root cause is that Y-coordinates in the template are incorrectly calculated, placing text elements outside the visible certificate areas. The solution involves recalculating all Y-coordinates to work correctly with the PDF coordinate system (Y=0 at bottom) and the 3-certificates-per-page layout.

## Architecture

### Current System Behavior

The certificate generator (`useDynamicCertificateGenerator`) processes templates with the following flow:

1. Creates a PDF page with dimensions 612x792 points (Letter size)
2. Divides the page into 3 vertical slots (264pt each)
3. For each certificate slot, applies an `offsetY` transformation
4. Renders text elements using: `pdfY = height - (y * certScaleY + offsetY) - baselineOffset`

### Problem Analysis

The current template has Y-coordinates like:
- Certificate 1: y: 300, 390, 480, 570, 660, 750, 840, 930, 1020
- Certificate 2: y: 384, 419, 444 (120 + 264)
- Certificate 3: y: 648, 683, 708 (120 + 528)

With `certScaleY = 1/3`, these coordinates result in:
- Certificate 1: Actual Y positions of 100, 130, 160, 190, 220, 250, 280, 310, 340
- These positions are measured from the TOP of the page in the template coordinate space
- After PDF transformation, they end up outside visible bounds

### Coordinate System Clarification

**PDF Coordinate System:**
- Origin (0,0) is at BOTTOM-LEFT
- Y increases UPWARD
- Page height = 792pt

**Certificate Slots (from bottom):**
- Slot 1 (BOTTOM): Y range 0-264pt
- Slot 2 (MIDDLE): Y range 264-528pt  
- Slot 3 (TOP): Y range 528-792pt

**Template Coordinate Space:**
- The generator applies: `pdfY = height - (y * certScaleY + offsetY) - baselineOffset`
- For 3 certs: `certScaleY = 1/3`, `offsetY = row * 264`
- Text Y-coordinates should be in the range 0-264 for each certificate's local space

## Components and Interfaces

### Modified Component: youthfulOffenderTemplate.ts

**Changes Required:**
1. Recalculate all Y-coordinates for text elements
2. Update comments to clarify coordinate system
3. Ensure consistent spacing between fields

**Coordinate Calculation Formula:**

For each certificate position (cert1=top, cert2=middle, cert3=bottom):
```
localY = desiredPositionFromTop (within 264pt slot)
templateY = localY (no multiplication needed, certScaleY handles it)
```

### Field Positioning Strategy

Based on the PDF template layout, fields should be positioned as follows (approximate values, will need fine-tuning):

**Certificate 1 (TOP slot):**
- Citation/Court/County/Certn: Y ≈ 240-250 (near top of slot)
- First/Middle/Last Name: Y ≈ 180-210 (middle-upper area)
- License/Completion Date: Y ≈ 120-150 (middle-lower area)

**Certificate 2 (MIDDLE slot):**
- Same relative positions within the 264pt slot
- Template Y values identical to Certificate 1

**Certificate 3 (BOTTOM slot):**
- Same relative positions within the 264pt slot
- Template Y values identical to Certificate 1

## Data Models

### TextElement Interface (existing)

```typescript
interface TextElement {
  id: string;
  content: string;  // Contains {{variable}} placeholders
  x: number;        // Horizontal position
  y: number;        // Vertical position (local to certificate slot)
  fontSize: number;
  fontFamily: string;
  color: string;
  align: 'left' | 'center' | 'right';
}
```

### Template Coordinate Conventions

```typescript
// For 3-per-page templates:
// - Y coordinates are in local certificate space (0-264)
// - Generator applies offsetY based on certificate position
// - certScaleY (1/3) is applied automatically
// - Final PDF Y = height - (y * certScaleY + offsetY) - baselineOffset
```

## Error Handling

### Validation

1. **Coordinate Bounds Check**: Ensure Y-coordinates are within reasonable range (0-264 for local space)
2. **Visual Verification**: Test with actual student data to verify positioning
3. **Multi-Certificate Consistency**: Verify all 3 certificates show identical layout

### Debugging Strategy

1. Add console logging for calculated PDF Y positions
2. Generate test PDF with visible coordinate markers
3. Compare with physical PDF template to verify alignment

## Testing Strategy

### Manual Testing

1. **Single Certificate Generation**
   - Generate one certificate with test data
   - Verify all fields are visible and correctly positioned
   - Check alignment with PDF template background

2. **Multiple Certificate Generation**
   - Generate 3 certificates with different student data
   - Verify each certificate shows correct data
   - Verify consistent positioning across all 3

3. **Field Coverage**
   - Test with maximum length names
   - Test with empty optional fields
   - Test with special characters

### Test Data

```typescript
const testStudent = {
  first_name: "TECHNOLOGY",
  middle_initial: "S",
  last_name: "BOTOPIA",
  license_number: "A1234567",
  citation_number: "TC-2024-001",
  court: "County Court",
  county: "Palm Beach County, FL",
  course_date: "10/18/2025",
  certn: "12345",
  courseTime: "4 hr",
  attendanceReason: "Ticket/Citation"
};
```

### Visual Inspection Checklist

- [ ] All text fields visible on certificate 1
- [ ] All text fields visible on certificate 2
- [ ] All text fields visible on certificate 3
- [ ] Text aligned with PDF template form fields
- [ ] No text overflow or truncation
- [ ] Consistent spacing between fields
- [ ] Checkboxes marked correctly

## Implementation Notes

### Coordinate Adjustment Process

1. Open the PDF template (`/templates_certificates/youthful-offender-class.pdf`)
2. Measure actual field positions using PDF viewer with ruler tool
3. Convert measurements to PDF points (1 inch = 72 points)
4. Calculate Y-coordinates from bottom of each 264pt slot
5. Update template with new coordinates
6. Test and iterate until alignment is perfect

### Expected Y-Coordinate Ranges

Based on typical form layouts:
- Top section fields (citation, court, county, certn): Y ≈ 220-250
- Name fields: Y ≈ 160-200
- Bottom section fields (license, date): Y ≈ 100-140
- Signature area: Y ≈ 40-80

These are starting estimates and will need adjustment based on actual PDF template.
